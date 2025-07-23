"""Tests for ElizaOS client integration"""

import pytest
import asyncio
import json
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from aiohttp import ClientSession, ClientResponse
import aioresponses

from sei_dlp_ai.integrations.elizaos_client import ElizaOSClient, ElizaOSConfig
from sei_dlp_ai.types import (
    ElizaOSMessage, MarketData, TradingSignal, AssetSymbol,
    ArbitrageOpportunity, Portfolio, StrategyType
)


class TestElizaOSConfig:
    """Test ElizaOS configuration"""
    
    def test_default_config(self):
        """Test default configuration values"""
        config = ElizaOSConfig()
        
        assert config.base_url == "http://localhost:3000"
        assert config.websocket_url == "ws://localhost:3001"
        assert config.agent_id == "ai_engine"
        assert config.room_id == "sei_dlp_main"
        assert config.timeout == 30
        
    def test_custom_config(self):
        """Test custom configuration values"""
        config = ElizaOSConfig(
            base_url="https://api.sei-dlp.com",
            websocket_url="wss://ws.sei-dlp.com",
            api_key="test_key_123",
            agent_id="custom_agent",
            timeout=60
        )
        
        assert config.base_url == "https://api.sei-dlp.com"
        assert config.api_key == "test_key_123"
        assert config.agent_id == "custom_agent"
        assert config.timeout == 60


@pytest.fixture
def client_config():
    """Create test client configuration"""
    return ElizaOSConfig(
        base_url="http://test-api.com",
        websocket_url="test://test-ws.com",
        api_key="test_key",
        timeout=10
    )
    
@pytest.fixture
def elizaos_client(client_config):
    """Create ElizaOS client for testing"""
    return ElizaOSClient(client_config)


class TestElizaOSClient:
    """Test ElizaOS client functionality"""
        
    def test_client_initialization(self, elizaos_client, client_config):
        """Test client initializes with correct configuration"""
        assert elizaos_client.config == client_config
        assert elizaos_client.session is None
        assert elizaos_client.websocket is None
        assert not elizaos_client.is_connected
        assert elizaos_client.message_handlers == {}
        
    def test_auth_headers(self, elizaos_client):
        """Test authentication header generation"""
        headers = elizaos_client._get_auth_headers()
        
        assert headers["Content-Type"] == "application/json"
        assert headers["Authorization"] == "Bearer test_key"
        
    def test_auth_headers_without_key(self):
        """Test headers without API key"""
        config = ElizaOSConfig(api_key=None)
        client = ElizaOSClient(config)
        headers = client._get_auth_headers()
        
        assert "Authorization" not in headers
        assert headers["Content-Type"] == "application/json"
        
    def test_register_handler(self, elizaos_client):
        """Test message handler registration"""
        async def test_handler(message):
            pass
            
        elizaos_client.register_handler("TEST_MESSAGE", test_handler)
        
        assert "TEST_MESSAGE" in elizaos_client.message_handlers
        assert elizaos_client.message_handlers["TEST_MESSAGE"] == test_handler
        
    @pytest.mark.asyncio
    async def test_handle_message_with_handler(self, elizaos_client):
        """Test message handling with registered handler"""
        handler_called = False
        received_message = None
        
        async def test_handler(message):
            nonlocal handler_called, received_message
            handler_called = True
            received_message = message
            
        elizaos_client.register_handler("TEST_TYPE", test_handler)
        
        message_data = {
            "id": "test_id",
            "room_id": "test_room",
            "agent_id": "test_agent",
            "user_id": "test_user",
            "content": "test content",
            "message_type": "TEST_TYPE",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await elizaos_client._handle_message(message_data)
        
        assert handler_called
        assert received_message.id == "test_id"
        assert received_message.message_type == "TEST_TYPE"
        
    @pytest.mark.asyncio
    async def test_handle_message_without_handler(self, elizaos_client):
        """Test message handling without registered handler"""
        message_data = {
            "id": "test_id",
            "room_id": "test_room", 
            "agent_id": "test_agent",
            "user_id": "test_user",
            "content": "test content",
            "message_type": "UNKNOWN_TYPE",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Should not raise an exception
        await elizaos_client._handle_message(message_data)
        
    def test_json_serializer(self, elizaos_client):
        """Test custom JSON serialization"""
        # Test Decimal serialization
        decimal_val = Decimal("123.456")
        result = elizaos_client._json_serializer(decimal_val)
        assert result == "123.456"
        
        # Test datetime serialization
        dt = datetime(2023, 1, 1, 12, 0, 0)
        result = elizaos_client._json_serializer(dt)
        assert result == "2023-01-01T12:00:00"
        
        # Test unsupported type
        with pytest.raises(TypeError):
            elizaos_client._json_serializer(set([1, 2, 3]))
            
    @pytest.mark.asyncio
    async def test_get_market_data_success(self, elizaos_client):
        """Test successful market data retrieval"""
        mock_response_data = {
            "market_data": [
                {
                    "symbol": "SEI",
                    "price": "0.45",
                    "volume_24h": "1000000",
                    "price_change_24h": "0.02",
                    "funding_rate": "0.0001",
                    "confidence_score": 0.95,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source": "pyth"
                }
            ]
        }
        
        with aioresponses.aioresponses() as m:
            # Ensure client has a session
            await elizaos_client.connect()
            
            # Mock the exact URL with query parameters that aiohttp will generate
            m.get(
                "http://test-api.com/api/oracle/market-data?assets=SEI%2CUSDC",
                payload=mock_response_data
            )
            
            result = await elizaos_client.get_market_data([AssetSymbol.SEI, AssetSymbol.USDC])
            
            assert len(result) == 1
            assert isinstance(result[0], MarketData)
            assert result[0].symbol == AssetSymbol.SEI
            assert result[0].price == Decimal("0.45")
            
            await elizaos_client.disconnect()
            
    @pytest.mark.asyncio
    async def test_get_market_data_no_session(self, elizaos_client):
        """Test market data retrieval without session"""
        with pytest.raises(ConnectionError, match="HTTP session not established"):
            await elizaos_client.get_market_data([AssetSymbol.SEI])
            
    @pytest.mark.asyncio
    async def test_execute_dragonswap_trade_success(self, elizaos_client):
        """Test successful DragonSwap trade execution"""
        mock_response = {
            "success": True,
            "transaction_hash": "0x123abc",
            "amount_out": "2250.75",
            "price_impact": "0.002"
        }
        
        with aioresponses.aioresponses() as m:
            # Ensure client has a session
            await elizaos_client.connect()
            
            m.post(
                "http://test-api.com/api/trading/dragonswap/swap",
                payload=mock_response
            )
            
            result = await elizaos_client.execute_dragonswap_trade(
                from_asset=AssetSymbol.USDC,
                to_asset=AssetSymbol.SEI,
                amount=Decimal("1000"),
                max_slippage=0.005
            )
            
            assert result["success"] is True
            assert "transaction_hash" in result
            
            await elizaos_client.disconnect()
            
    @pytest.mark.asyncio
    async def test_execute_perp_trade_success(self, elizaos_client):
        """Test successful perpetual trade execution"""
        mock_response = {
            "success": True,
            "position_id": "pos_123",
            "entry_price": "2850.00",
            "liquidation_price": "2400.00"
        }
        
        with aioresponses.aioresponses() as m:
            # Ensure client has a session
            await elizaos_client.connect()
            
            m.post(
                "http://test-api.com/api/trading/perpetual/position",
                payload=mock_response
            )
            
            result = await elizaos_client.execute_perp_trade(
                asset=AssetSymbol.ETH,
                side="long",
                size=Decimal("10"),
                leverage=2.0
            )
            
            assert result["success"] is True
            assert result["position_id"] == "pos_123"
            
            await elizaos_client.disconnect()
            
    @pytest.mark.asyncio
    async def test_get_arbitrage_opportunities(self, elizaos_client):
        """Test arbitrage opportunities retrieval"""
        mock_response = {
            "opportunities": [
                {
                    "asset": "ETH",
                    "exchanges": ["binance", "bybit"],
                    "funding_rates": {"binance": "0.0001", "bybit": "0.0005"},
                    "spread": "0.0004",
                    "potential_profit": "120.50",
                    "risk_score": 0.3,
                    "execution_complexity": 2,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            ]
        }
        
        with aioresponses.aioresponses() as m:
            # Ensure client has a session
            await elizaos_client.connect()
            
            m.get(
                "http://test-api.com/api/arbitrage/opportunities",
                payload=mock_response
            )
            
            result = await elizaos_client.get_arbitrage_opportunities()
            
            assert len(result) == 1
            assert isinstance(result[0], ArbitrageOpportunity)
            assert result[0].asset == AssetSymbol.ETH
            assert result[0].spread == Decimal("0.0004")
            
            await elizaos_client.disconnect()
            
    @pytest.mark.asyncio
    async def test_trigger_portfolio_rebalance(self, elizaos_client, mock_portfolio):
        """Test portfolio rebalancing trigger"""
        mock_response = {
            "success": True,
            "rebalance_id": "rebal_123",
            "trades_executed": 3,
            "total_cost": "12.50"
        }
        
        with aioresponses.aioresponses() as m:
            # Ensure client has a session
            await elizaos_client.connect()
            
            m.post(
                "http://test-api.com/api/portfolio/rebalance",
                payload=mock_response
            )
            
            result = await elizaos_client.trigger_portfolio_rebalance(
                portfolio=mock_portfolio,
                force=True
            )
            
            assert result["success"] is True
            assert result["trades_executed"] == 3
            
            await elizaos_client.disconnect()
            
    @pytest.mark.asyncio
    async def test_send_trading_signal(self, elizaos_client, mock_trading_signal):
        """Test sending trading signal"""
        elizaos_client.websocket = AsyncMock()
        elizaos_client.is_connected = True
        
        await elizaos_client.send_trading_signal(mock_trading_signal)
        
        elizaos_client.websocket.send.assert_called_once()
        
        # Verify message content
        sent_data = elizaos_client.websocket.send.call_args[0][0]
        message_dict = json.loads(sent_data)
        
        assert message_dict["message_type"] == "TRADING_SIGNAL"
        assert message_dict["content"]["signal"]["asset"] == "SEI"
        assert message_dict["content"]["signal"]["action"] == "BUY"
        
    @pytest.mark.asyncio
    async def test_send_message_not_connected(self, elizaos_client):
        """Test sending message when not connected"""
        message = ElizaOSMessage(
            id="test",
            room_id="test",
            agent_id="test",
            user_id="test",
            content="test",
            message_type="TEST",
            timestamp=datetime.now(timezone.utc)
        )
        
        with pytest.raises(ConnectionError, match="Not connected to ElizaOS"):
            await elizaos_client.send_message(message)
            
    @pytest.mark.asyncio
    async def test_context_manager(self, elizaos_client):
        """Test async context manager functionality"""
        with patch.object(elizaos_client, 'connect', new_callable=AsyncMock) as mock_connect:
            with patch.object(elizaos_client, 'disconnect', new_callable=AsyncMock) as mock_disconnect:
                
                async with elizaos_client as client:
                    assert client is elizaos_client
                    
                mock_connect.assert_called_once()
                mock_disconnect.assert_called_once()


class TestElizaOSClientErrorHandling:
    """Test error handling and edge cases"""
    
    @pytest.mark.asyncio
    async def test_disconnect_with_reconnect_task(self, elizaos_client):
        """Test disconnect when reconnect task is active"""
        # Mock a reconnect task
        mock_task = MagicMock()
        elizaos_client._reconnect_task = mock_task
        elizaos_client.is_connected = True
        
        await elizaos_client.disconnect()
        
        mock_task.cancel.assert_called_once()
        assert not elizaos_client.is_connected

    @pytest.mark.asyncio
    async def test_disconnect_with_websocket_and_session_cleanup(self, elizaos_client):
        """Test disconnect properly closes websocket and session"""
        # Set up mock websocket and session
        mock_websocket = AsyncMock()
        mock_session = AsyncMock()
        
        elizaos_client.websocket = mock_websocket
        elizaos_client.session = mock_session
        elizaos_client.is_connected = True
        
        await elizaos_client.disconnect()
        
        # Verify websocket was closed and set to None
        mock_websocket.close.assert_called_once()
        assert elizaos_client.websocket is None
        
        # Verify session was closed and set to None
        mock_session.close.assert_called_once()
        assert elizaos_client.session is None
        assert not elizaos_client.is_connected

    @pytest.mark.asyncio
    async def test_websocket_listener_message_handling_exception(self, elizaos_client):
        """Test websocket listener handles general exceptions in message processing"""
        mock_websocket = AsyncMock()
        
        # Create a valid JSON message
        test_message = '{"message_type": "TEST", "content": "test"}'
        mock_websocket.__aiter__.return_value = iter([test_message])
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        # Mock _handle_message to raise an exception
        with patch.object(elizaos_client, '_handle_message', side_effect=Exception("Processing error")):
            with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
                try:
                    await asyncio.wait_for(elizaos_client._websocket_listener(), timeout=0.1)
                except asyncio.TimeoutError:
                    pass
                
                # Verify error was logged
                mock_logger.error.assert_called()
                assert any("Error handling message" in str(call) for call in mock_logger.error.call_args_list)

    @pytest.mark.asyncio
    async def test_reconnect_websocket_success(self, elizaos_client):
        """Test successful WebSocket reconnection"""
        elizaos_client.config.reconnect_attempts = 2
        elizaos_client.config.reconnect_delay = 0.01  # Short delay for testing
        
        with patch.object(elizaos_client, '_connect_websocket', new_callable=AsyncMock) as mock_connect:
            with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
                with patch('asyncio.sleep', new_callable=AsyncMock) as mock_sleep:
                    
                    await elizaos_client._reconnect_websocket()
                    
                    # Verify sleep was called for backoff
                    mock_sleep.assert_called_once()
                    
                    # Verify connection was attempted
                    mock_connect.assert_called_once()
                    
                    # Verify success was logged
                    mock_logger.info.assert_called_with("WebSocket reconnected successfully")

    @pytest.mark.asyncio
    async def test_reconnect_websocket_all_attempts_fail(self, elizaos_client):
        """Test WebSocket reconnection when all attempts fail"""
        elizaos_client.config.reconnect_attempts = 2
        elizaos_client.config.reconnect_delay = 0.01
        elizaos_client.is_connected = True
        
        with patch.object(elizaos_client, '_connect_websocket', side_effect=Exception("Connection failed")):
            with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
                with patch('asyncio.sleep', new_callable=AsyncMock):
                    
                    await elizaos_client._reconnect_websocket()
                    
                    # Verify error was logged
                    mock_logger.error.assert_called_with("Failed to reconnect WebSocket after all attempts")
                    
                    # Verify is_connected was set to False
                    assert not elizaos_client.is_connected
                    
                    # Verify warning was logged for each attempt
                    warning_calls = [call for call in mock_logger.warning.call_args_list 
                                   if "WebSocket reconnection attempt" in str(call)]
                    assert len(warning_calls) == 2

    @pytest.mark.asyncio
    async def test_handle_message_no_handler_debug_log(self, elizaos_client):
        """Test _handle_message logs debug when no handler is registered"""
        message_data = {
            "id": "test_id",
            "room_id": "test_room",
            "agent_id": "test_agent", 
            "user_id": "test_user",
            "content": "test content",
            "message_type": "UNKNOWN_TYPE",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            await elizaos_client._handle_message(message_data)
            
            # Verify debug log was called
            mock_logger.debug.assert_called()
            assert any("No handler for message type" in str(call) for call in mock_logger.debug.call_args_list)

    @pytest.mark.asyncio
    async def test_handle_message_processing_exception(self, elizaos_client):
        """Test _handle_message handles exceptions during message processing"""
        # Create invalid message data that will cause an exception
        invalid_message_data = {"invalid": "data"}  # Missing required fields
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            await elizaos_client._handle_message(invalid_message_data)
            
            # Verify error was logged
            mock_logger.error.assert_called()
            assert any("Error processing message" in str(call) for call in mock_logger.error.call_args_list)

    @pytest.mark.asyncio
    async def test_send_message_exception_handling(self, elizaos_client):
        """Test send_message handles exceptions properly"""
        mock_websocket = AsyncMock()
        mock_websocket.send.side_effect = Exception("Send failed")
        
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        message = ElizaOSMessage(
            id="test",
            room_id="test",
            agent_id="test",
            user_id="test",
            content="test",
            message_type="TEST",
            timestamp=datetime.now(timezone.utc)
        )
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            with pytest.raises(Exception, match="Send failed"):
                await elizaos_client.send_message(message)
            
            # Verify error was logged
            mock_logger.error.assert_called()
            assert any("Failed to send message" in str(call) for call in mock_logger.error.call_args_list)

    @pytest.mark.asyncio
    async def test_register_handler_debug_logging(self, elizaos_client):
        """Test register_handler logs debug message"""
        async def test_handler(message):
            pass
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            elizaos_client.register_handler("TEST_TYPE", test_handler)
            
            # Verify debug log was called
            mock_logger.debug.assert_called()
            assert any("Registered handler for message type" in str(call) for call in mock_logger.debug.call_args_list)
    
    @pytest.mark.asyncio 
    async def test_get_auth_headers_with_api_key(self, elizaos_client):
        """Test authentication headers with API key"""
        elizaos_client.config.api_key = "test_api_key_123"
        
        headers = elizaos_client._get_auth_headers()
        
        assert headers["Content-Type"] == "application/json"
        assert headers["Authorization"] == "Bearer test_api_key_123"
    
    @pytest.mark.asyncio
    async def test_get_auth_headers_without_api_key(self, elizaos_client):
        """Test authentication headers without API key"""
        elizaos_client.config.api_key = None
        
        headers = elizaos_client._get_auth_headers()
        
        assert headers["Content-Type"] == "application/json"
        assert "Authorization" not in headers
    
    @pytest.mark.asyncio
    async def test_register_handler(self, elizaos_client):
        """Test registering message handlers"""
        async def test_handler(message):
            pass
        
        elizaos_client.register_handler("test_type", test_handler)
        
        assert "test_type" in elizaos_client.message_handlers
        assert elizaos_client.message_handlers["test_type"] == test_handler
    
    @pytest.mark.asyncio
    async def test_json_serializer(self, elizaos_client):
        """Test JSON serializer for custom types"""
        # Test datetime serialization
        dt = datetime.now(timezone.utc)
        result = elizaos_client._json_serializer(dt)
        assert result == dt.isoformat()
        
        # Test Decimal serialization
        decimal_val = Decimal("123.456")
        result = elizaos_client._json_serializer(decimal_val)
        assert result == "123.456"
        
        # Test other types (should raise TypeError)
        with pytest.raises(TypeError):
            elizaos_client._json_serializer(object())


class TestElizaOSClientConnectionMethods:
    """Test connection and disconnection methods thoroughly"""
    
    @pytest.mark.asyncio
    @patch('aiohttp.ClientSession')
    async def test_connect_with_session_creation(self, mock_session_class, elizaos_client):
        """Test connect method creates HTTP session"""
        mock_session = AsyncMock()
        mock_session_class.return_value = mock_session
        
        # Mock _connect_websocket to avoid actual websocket connection
        with patch.object(elizaos_client, '_connect_websocket') as mock_ws_connect:
            await elizaos_client.connect()
            
            mock_session_class.assert_called_once()
            mock_ws_connect.assert_called_once()
            assert elizaos_client.session == mock_session
            assert elizaos_client.is_connected is True
    
    @pytest.mark.asyncio
    @patch('aiohttp.ClientSession')
    async def test_connect_failure_calls_disconnect(self, mock_session_class, elizaos_client):
        """Test that connect failure properly calls disconnect"""
        mock_session = AsyncMock()
        mock_session_class.return_value = mock_session
        
        # Mock _connect_websocket to raise exception
        with patch.object(elizaos_client, '_connect_websocket', side_effect=Exception("Connection failed")):
            with patch.object(elizaos_client, 'disconnect') as mock_disconnect:
                with pytest.raises(Exception, match="Connection failed"):
                    await elizaos_client.connect()
                
                mock_disconnect.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_disconnect_logs_completion(self, elizaos_client):
        """Test disconnect method logs completion"""
        elizaos_client.is_connected = True
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            await elizaos_client.disconnect()
            
            mock_logger.info.assert_called_with("Disconnected from ElizaOS services")
            assert not elizaos_client.is_connected
    
    @pytest.mark.asyncio
    @patch('sei_dlp_ai.integrations.elizaos_client.asyncio.create_task')
    async def test_connect_websocket_creates_listener_task(self, mock_create_task, elizaos_client):
        """Test websocket connection creates listener task"""
        # Set up non-test URL to trigger actual websocket logic
        elizaos_client.config.websocket_url = "ws://localhost:3001"
        
        mock_websocket = AsyncMock()
        mock_task = AsyncMock()
        mock_create_task.return_value = mock_task
        
        # Mock the websockets.connect function properly
        with patch('sei_dlp_ai.integrations.elizaos_client.websockets.connect', new_callable=AsyncMock) as mock_ws_connect:
            mock_ws_connect.return_value = mock_websocket
            
            await elizaos_client._connect_websocket()
            
            mock_ws_connect.assert_called_once()
            mock_create_task.assert_called_once()
            assert elizaos_client.websocket == mock_websocket
            assert elizaos_client._reconnect_task == mock_task
            assert elizaos_client.is_connected is True
    
    @pytest.mark.asyncio
    @patch('sei_dlp_ai.integrations.elizaos_client.websockets.connect')
    async def test_connect_websocket_failure_logs_error(self, mock_ws_connect, elizaos_client):
        """Test websocket connection failure logging"""
        elizaos_client.config.websocket_url = "ws://localhost:3001"
        mock_ws_connect.side_effect = Exception("WebSocket failed")
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            with pytest.raises(ConnectionError, match="Failed to connect to ElizaOS WebSocket"):
                await elizaos_client._connect_websocket()
            
            mock_logger.error.assert_called_with("WebSocket connection failed: WebSocket failed")


class TestElizaOSClientWebSocketMethods:
    """Test WebSocket listener and message handling"""
    
    @pytest.mark.asyncio
    async def test_websocket_listener_receives_messages(self, elizaos_client):
        """Test websocket listener processes incoming messages"""
        mock_websocket = AsyncMock()
        
        # Create test messages
        test_messages = [
            '{"message_type": "TRADING_SIGNAL", "content": "message1", "timestamp": "2025-01-01T00:00:00Z"}',
            '{"message_type": "RISK_ALERT", "content": "message2", "timestamp": "2025-01-01T00:00:00Z"}'
        ]
        
        # Set up mock websocket to return test messages when iterated
        mock_websocket.__aiter__.return_value = iter(test_messages)
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        # Mock message handler
        message_handler = AsyncMock()
        with patch.object(elizaos_client, '_handle_message', message_handler):
            # Use asyncio.wait_for to set a timeout for the listener
            try:
                await asyncio.wait_for(elizaos_client._websocket_listener(), timeout=0.1)
            except asyncio.TimeoutError:
                pass  # Expected when no more messages
        
        assert message_handler.call_count == 2
    
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_websocket_listener_handles_json_error(self, elizaos_client):
        """Test websocket listener handles JSON decode errors"""
        mock_websocket = AsyncMock()
        
        # Invalid JSON message
        invalid_json = "invalid json message"
        mock_websocket.__aiter__.return_value = iter([invalid_json])
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            # Use asyncio.wait_for to set a timeout for the listener
            try:
                await asyncio.wait_for(elizaos_client._websocket_listener(), timeout=0.1)
            except asyncio.TimeoutError:
                pass  # Expected when no more messages
            
            # Verify that JSON error was logged
            mock_logger.warning.assert_called()
            assert any("Invalid JSON received" in str(call) for call in mock_logger.warning.call_args_list)
    
    @pytest.mark.asyncio
    async def test_websocket_listener_connection_error(self, elizaos_client):
        """Test _websocket_listener handles connection errors"""
        from websockets import ConnectionClosed
        
        mock_websocket = AsyncMock()
        # Make the websocket iteration raise ConnectionClosed
        mock_websocket.__aiter__.side_effect = ConnectionClosed(None, None)
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger, \
             patch.object(elizaos_client, '_reconnect_websocket', new_callable=AsyncMock) as mock_reconnect:
            
            await elizaos_client._websocket_listener()
            
            # Verify that connection closed was logged
            mock_logger.warning.assert_called()
            assert any("WebSocket connection closed" in str(call) for call in mock_logger.warning.call_args_list)
            
            # Verify reconnect was attempted since is_connected is True
            mock_reconnect.assert_called_once()


class TestElizaOSClientHTTPMethods:
    """Test HTTP API methods thoroughly"""
    
    @pytest.mark.asyncio
    async def test_get_market_data_http_error(self, elizaos_client):
        """Test get_market_data with HTTP error"""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        
        # Make raise_for_status throw an exception (sync, not async)
        def raise_http_error():
            raise Exception("HTTP 500")
        
        mock_response.raise_for_status = raise_http_error
        
        # Create proper context manager mock
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_response)
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_session.get = MagicMock(return_value=mock_context)
        
        elizaos_client.session = mock_session
        
        with pytest.raises(Exception, match="HTTP 500"):
            await elizaos_client.get_market_data([AssetSymbol.SEI])

    @pytest.mark.asyncio
    async def test_execute_dragonswap_trade_no_session(self, elizaos_client):
        """Test DragonSwap trade execution without session"""
        with pytest.raises(ConnectionError, match="HTTP session not established"):
            await elizaos_client.execute_dragonswap_trade(
                from_asset=AssetSymbol.USDC,
                to_asset=AssetSymbol.SEI,
                amount=Decimal("1000"),
                max_slippage=0.005
            )

    @pytest.mark.asyncio
    async def test_execute_perp_trade_no_session(self, elizaos_client):
        """Test perpetual trade execution without session"""
        with pytest.raises(ConnectionError, match="HTTP session not established"):
            await elizaos_client.execute_perp_trade(
                asset=AssetSymbol.ETH,
                side="long", 
                size=Decimal("10"),
                leverage=2.0
            )

    @pytest.mark.asyncio
    async def test_get_arbitrage_opportunities_no_session(self, elizaos_client):
        """Test arbitrage opportunities retrieval without session"""
        with pytest.raises(ConnectionError, match="HTTP session not established"):
            await elizaos_client.get_arbitrage_opportunities()

    @pytest.mark.asyncio
    async def test_trigger_portfolio_rebalance_no_session(self, elizaos_client, mock_portfolio):
        """Test portfolio rebalance trigger without session"""
        with pytest.raises(ConnectionError, match="HTTP session not established"):
            await elizaos_client.trigger_portfolio_rebalance(mock_portfolio)
    
    @pytest.mark.asyncio
    async def test_get_arbitrage_opportunities_success(self, elizaos_client):
        """Test successful arbitrage opportunities request"""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        
        # Mock successful response
        mock_response.json.return_value = {
            "opportunities": [
                {
                    "asset": "SEI",
                    "exchanges": ["binance", "coinbase"],
                    "funding_rates": {"binance": "0.0001", "coinbase": "0.0002"},
                    "spread": "0.0001",
                    "potential_profit": "100.0",
                    "risk_score": 0.3,
                    "execution_complexity": 2,
                    "timestamp": "2025-01-01T00:00:00Z"
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        
        # Create proper context manager mock
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_response)
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_session.get = MagicMock(return_value=mock_context)
        
        elizaos_client.session = mock_session
        
        opportunities = await elizaos_client.get_arbitrage_opportunities()
        
        assert len(opportunities) == 1
        assert opportunities[0].asset == AssetSymbol.SEI
        assert len(opportunities[0].exchanges) == 2
    
    @pytest.mark.asyncio
    async def test_trigger_portfolio_rebalance_success(self, elizaos_client, mock_portfolio):
        """Test successful portfolio rebalance trigger"""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        
        # Mock successful response
        mock_response.json.return_value = {"status": "rebalance_triggered", "job_id": "rebalance_123"}
        mock_response.raise_for_status.return_value = None
        
        # Create proper context manager mock
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_response)
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_session.post = MagicMock(return_value=mock_context)
        
        elizaos_client.session = mock_session
        
        result = await elizaos_client.trigger_portfolio_rebalance(mock_portfolio)
        
        assert result["status"] == "rebalance_triggered"
        assert "job_id" in result
        
        # Verify the request was made with correct data
        mock_session.post.assert_called_once()
        call_args = mock_session.post.call_args
        assert "/portfolio/rebalance" in call_args[0][0]
    
    @pytest.mark.asyncio
    async def test_send_trading_signal_with_risk_metrics(self, elizaos_client, mock_trading_signal, mock_risk_metrics):
        """Test sending trading signal with risk metrics"""
        mock_websocket = AsyncMock()
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        await elizaos_client.send_trading_signal(mock_trading_signal)
        
        # Verify websocket send was called
        mock_websocket.send.assert_called_once()
        
        # Parse the sent message
        sent_message = mock_websocket.send.call_args[0][0]
        message_data = json.loads(sent_message)
        
        assert message_data["message_type"] == "TRADING_SIGNAL"
        assert "signal" in message_data["content"]
        assert "type" in message_data["content"]
        assert message_data["content"]["type"] == "trading_signal"
    
    @pytest.mark.asyncio
    async def test_send_risk_alert_success(self, elizaos_client, mock_risk_metrics):
        """Test sending risk alert"""
        mock_websocket = AsyncMock()
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        await elizaos_client.send_risk_alert(mock_risk_metrics, "HIGH")
        
        # Verify websocket send was called
        mock_websocket.send.assert_called_once()
        
        # Parse the sent message
        sent_message = mock_websocket.send.call_args[0][0]
        message_data = json.loads(sent_message)
        
        assert message_data["message_type"] == "RISK_ALERT"
        assert "risk_metrics" in message_data["content"]

    @pytest.mark.asyncio
    async def test_send_message_debug_logging(self, elizaos_client):
        """Test send_message logs debug information"""
        mock_websocket = AsyncMock()
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        message = ElizaOSMessage(
            id="test",
            room_id="test",
            agent_id="test",
            user_id="test",
            content="test",
            message_type="TEST",
            timestamp=datetime.now(timezone.utc)
        )
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            await elizaos_client.send_message(message)
            
            # Verify debug log was called
            mock_logger.debug.assert_called()
            debug_calls = [call for call in mock_logger.debug.call_args_list 
                          if "Sent message" in str(call)]
            assert len(debug_calls) >= 1

    @pytest.mark.asyncio
    async def test_execute_dragonswap_trade_exception_handling(self, elizaos_client):
        """Test DragonSwap trade execution error handling"""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        
        # Make the context manager raise an exception
        mock_context = AsyncMock()
        mock_context.__aenter__.side_effect = Exception("Network error")
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_session.post = MagicMock(return_value=mock_context)
        
        elizaos_client.session = mock_session
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            with pytest.raises(Exception, match="Network error"):
                await elizaos_client.execute_dragonswap_trade(
                    from_asset=AssetSymbol.USDC,
                    to_asset=AssetSymbol.SEI,
                    amount=Decimal("1000"),
                    max_slippage=0.005
                )
            
            # Verify error was logged
            mock_logger.error.assert_called()
            assert any("DragonSwap trade failed" in str(call) for call in mock_logger.error.call_args_list)

    @pytest.mark.asyncio
    async def test_execute_perp_trade_exception_handling(self, elizaos_client):
        """Test perpetual trade execution error handling"""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        
        # Make the context manager raise an exception
        mock_context = AsyncMock()
        mock_context.__aenter__.side_effect = Exception("Trading error")
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_session.post = MagicMock(return_value=mock_context)
        
        elizaos_client.session = mock_session
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            with pytest.raises(Exception, match="Trading error"):
                await elizaos_client.execute_perp_trade(
                    asset=AssetSymbol.ETH,
                    side="long",
                    size=Decimal("10"),
                    leverage=2.0
                )
            
            # Verify error was logged
            mock_logger.error.assert_called()
            assert any("Perpetual trade failed" in str(call) for call in mock_logger.error.call_args_list)

    @pytest.mark.asyncio
    async def test_get_arbitrage_opportunities_exception_handling(self, elizaos_client):
        """Test arbitrage opportunities error handling"""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        
        # Make the context manager raise an exception
        mock_context = AsyncMock()
        mock_context.__aenter__.side_effect = Exception("API error")
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_session.get = MagicMock(return_value=mock_context)
        
        elizaos_client.session = mock_session
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            with pytest.raises(Exception, match="API error"):
                await elizaos_client.get_arbitrage_opportunities()
            
            # Verify error was logged
            mock_logger.error.assert_called()
            assert any("Failed to get arbitrage opportunities" in str(call) for call in mock_logger.error.call_args_list)

    @pytest.mark.asyncio
    async def test_trigger_portfolio_rebalance_exception_handling(self, elizaos_client, mock_portfolio):
        """Test portfolio rebalance error handling"""
        mock_session = AsyncMock()
        mock_response = AsyncMock()
        
        # Make the context manager raise an exception
        mock_context = AsyncMock()
        mock_context.__aenter__.side_effect = Exception("Rebalance error")
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_session.post = MagicMock(return_value=mock_context)
        
        elizaos_client.session = mock_session
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            with pytest.raises(Exception, match="Rebalance error"):
                await elizaos_client.trigger_portfolio_rebalance(mock_portfolio)
            
            # Verify error was logged
            mock_logger.error.assert_called()
            assert any("Portfolio rebalance failed" in str(call) for call in mock_logger.error.call_args_list)
