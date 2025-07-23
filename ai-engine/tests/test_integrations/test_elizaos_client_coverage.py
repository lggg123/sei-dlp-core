"""
Additional tests for ElizaOS client to improve coverage
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from decimal import Decimal
from datetime import datetime, timezone

from sei_dlp_ai.integrations.elizaos_client import ElizaOSClient, ElizaOSConfig
from sei_dlp_ai.types import AssetSymbol, MarketData, TradingSignal, RiskMetrics
from tests.test_utils import (
    mock_market_data, mock_trading_signal, mock_risk_metrics,
    elizaos_config, elizaos_client, mock_aiohttp_session,
    mock_websocket, create_mock_response
)


class TestElizaOSClientCoverage:
    """Test missing coverage areas"""
    
    @pytest.mark.asyncio
    async def test_connect_with_session_creation(self, elizaos_client):
        """Test connect creates HTTP session"""
        with patch('aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_session_class.return_value = mock_session
            
            # Mock _connect_websocket since we're using test URL
            await elizaos_client.connect()
            
            assert elizaos_client.session == mock_session
            assert elizaos_client.is_connected
    
    @pytest.mark.asyncio
    async def test_disconnect_with_cleanup(self, elizaos_client):
        """Test disconnect cleans up resources"""
        # Set up state to test cleanup
        mock_session = AsyncMock()
        mock_session.close = AsyncMock()
        elizaos_client.session = mock_session
        elizaos_client.websocket = AsyncMock()
        elizaos_client._reconnect_task = MagicMock()  # Use regular Mock for cancellable task
        elizaos_client.is_connected = True

        await elizaos_client.disconnect()

        assert not elizaos_client.is_connected
        mock_session.close.assert_called_once()
        elizaos_client._reconnect_task.cancel.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_websocket_connection_real_url(self, elizaos_client):
        """Test websocket with real URL (not test mode)"""
        elizaos_client.config.websocket_url = "ws://localhost:3001"

        async def mock_connect(*args, **kwargs):
            return AsyncMock()

        with patch('websockets.connect', side_effect=mock_connect) as mock_connect:
            with patch('asyncio.create_task') as mock_task:
                mock_task.return_value = AsyncMock()

                await elizaos_client._connect_websocket()

                assert elizaos_client.websocket is not None
                assert elizaos_client.is_connected
    
    @pytest.mark.asyncio
    async def test_websocket_connection_failure(self, elizaos_client):
        """Test websocket connection failure handling"""
        elizaos_client.config.websocket_url = "ws://localhost:3001"
        
        with patch('websockets.connect', side_effect=Exception("Connection failed")):
            with pytest.raises(ConnectionError, match="Failed to connect to ElizaOS WebSocket"):
                await elizaos_client._connect_websocket()
    
    @pytest.mark.asyncio
    async def test_websocket_listener_basic(self, elizaos_client):
        """Test basic websocket listener functionality"""
        import websockets
        mock_websocket = AsyncMock()
        
        # Mock async iteration properly
        async def async_iter(self):
            yield '{"message_type": "test", "data": "value"}'
            # Raise the expected WebSocket exception
            raise websockets.exceptions.ConnectionClosed(None, None)
        
        mock_websocket.__aiter__ = async_iter
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        with patch.object(elizaos_client, '_handle_message') as mock_handler:
            with patch('sei_dlp_ai.integrations.elizaos_client.logger'):
                with patch('asyncio.create_task') as mock_task:
                    mock_task.return_value = AsyncMock()
                    await elizaos_client._websocket_listener()
                    
                    # Should have processed at least one message
                    mock_handler.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_websocket_listener_json_error(self, elizaos_client):
        """Test websocket listener JSON error handling"""
        import websockets
        mock_websocket = AsyncMock()
        
        # Mock async iteration with invalid JSON
        async def async_iter(self):
            yield 'invalid json'
            # Raise the expected WebSocket exception
            raise websockets.exceptions.ConnectionClosed(None, None)
        
        mock_websocket.__aiter__ = async_iter
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        with patch('sei_dlp_ai.integrations.elizaos_client.logger') as mock_logger:
            with patch('asyncio.create_task') as mock_task:
                mock_task.return_value = AsyncMock()
                await elizaos_client._websocket_listener()
                
                # Should have logged the JSON error
                mock_logger.warning.assert_called()
    
    @pytest.mark.asyncio
    async def test_reconnect_websocket(self, elizaos_client):
        """Test websocket reconnection logic"""
        elizaos_client.is_connected = True
        elizaos_client.config.reconnect_attempts = 2
        
        with patch.object(elizaos_client, '_connect_websocket', side_effect=Exception("Reconnect failed")) as mock_connect:
            with patch('asyncio.sleep'):  # Speed up test
                with patch('sei_dlp_ai.integrations.elizaos_client.logger'):
                    await elizaos_client._reconnect_websocket()
                    
                    # Should have attempted reconnection
                    assert mock_connect.call_count >= 1
    
    @pytest.mark.asyncio
    async def test_get_market_data_success(self, elizaos_client):
        """Test successful market data request"""
        mock_session = AsyncMock()
        
        # Create proper context manager mock
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "market_data": [{
                "symbol": "SEI",
                "price": "0.45",
                "volume_24h": "1000000",
                "price_change_24h": "0.05",
                "high_24h": "0.50",
                "low_24h": "0.40",
                "market_cap": "1000000",
                "funding_rate": "0.0001",
                "open_interest": "50000000",
                "vwap": "0.45",
                "volatility": "0.25",
                "liquidity_score": "0.95",
                "confidence_score": "0.95",
                "timestamp": "2025-01-01T00:00:00Z",
                "source": "pyth"
            }]
        }
        
        # Mock context manager properly
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_response)
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_session.get = MagicMock(return_value=mock_context)  # Use MagicMock not AsyncMock
        
        elizaos_client.session = mock_session
        
        result = await elizaos_client.get_market_data([AssetSymbol.SEI])
        
        assert len(result) == 1
        assert result[0].symbol == AssetSymbol.SEI
        assert result[0].confidence_score == 0.95
        assert result[0].price == Decimal("0.45")
    
    @pytest.mark.asyncio
    async def test_get_market_data_no_session(self, elizaos_client):
        """Test market data request with no session"""
        elizaos_client.session = None
        
        with pytest.raises(ConnectionError, match="HTTP session not established"):
            await elizaos_client.get_market_data([AssetSymbol.SEI])
    
    @pytest.mark.asyncio
    async def test_send_trading_signal_success(self, elizaos_client):
        """Test sending trading signal"""
        mock_websocket = AsyncMock()
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        signal = TradingSignal(
            asset=AssetSymbol.SEI,
            action="BUY",
            confidence=0.85,
            target_price=Decimal("0.50"),
            stop_loss=Decimal("0.40"),
            reasoning="Test trading signal based on volume analysis",  # Required field
            position_size=Decimal("1000"),
            strategy="test_strategy",
            model_version="v1.0",
            timestamp=datetime.now(timezone.utc)
        )
        
        await elizaos_client.send_trading_signal(signal)
        
        # Verify WebSocket message was sent
        mock_websocket.send.assert_called_once()
        
        # Check message content
        sent_data = mock_websocket.send.call_args[0][0]
        message = json.loads(sent_data)
        assert message["message_type"] == "TRADING_SIGNAL"  # Expected uppercase
    
    @pytest.mark.asyncio
    async def test_send_risk_alert_success(self, elizaos_client):
        """Test sending risk alert"""
        mock_websocket = AsyncMock()
        elizaos_client.websocket = mock_websocket
        elizaos_client.is_connected = True
        
        risk_metrics = RiskMetrics(
            portfolio_var_95=Decimal("1000"),
            max_leverage=3.0,
            concentration_risk=0.3,
            liquidity_risk=0.2,
            counterparty_risk=0.1,
            overall_risk_score=0.35,  # Required field
            recommended_max_position_size=Decimal("5000"),  # Required field
            position_size=Decimal("5000"),
            timestamp=datetime.now(timezone.utc)
        )
        
        await elizaos_client.send_risk_alert(risk_metrics, "HIGH")
        
        # Verify WebSocket message was sent
        mock_websocket.send.assert_called_once()
        
        # Check message content
        sent_data = mock_websocket.send.call_args[0][0]
        message = json.loads(sent_data)
        assert message["message_type"] == "RISK_ALERT"  # Expected uppercase
    
    @pytest.mark.asyncio
    async def test_send_websocket_not_connected(self, elizaos_client):
        """Test websocket send when not connected"""
        elizaos_client.websocket = None
        elizaos_client.is_connected = False
        
        signal = TradingSignal(
            asset=AssetSymbol.SEI,
            action="BUY",
            confidence=0.85,
            target_price=Decimal("0.50"),
            stop_loss=Decimal("0.40"),
            reasoning="Test signal for websocket error handling",  # Required field
            position_size=Decimal("1000"),
            strategy="test_strategy",
            model_version="v1.0",
            timestamp=datetime.now(timezone.utc)
        )
        
        with pytest.raises(ConnectionError, match="Not connected to ElizaOS"):
            await elizaos_client.send_trading_signal(signal)
    
    def test_json_serializer_decimal(self, elizaos_client):
        """Test JSON serializer with Decimal"""
        result = elizaos_client._json_serializer(Decimal("123.45"))
        assert result == "123.45"
    
    def test_json_serializer_datetime(self, elizaos_client):
        """Test JSON serializer with datetime"""
        dt = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        result = elizaos_client._json_serializer(dt)
        assert result == "2025-01-01T12:00:00+00:00"
    
    def test_json_serializer_unsupported_type(self, elizaos_client):
        """Test JSON serializer with unsupported type"""
        with pytest.raises(TypeError):
            elizaos_client._json_serializer(object())
    
    @pytest.mark.asyncio
    async def test_context_manager_enter(self, elizaos_client):
        """Test context manager __aenter__"""
        with patch.object(elizaos_client, 'connect') as mock_connect:
            result = await elizaos_client.__aenter__()
            assert result == elizaos_client
            mock_connect.assert_called_once()
    
    @pytest.mark.asyncio  
    async def test_context_manager_exit(self, elizaos_client):
        """Test context manager __aexit__"""
        with patch.object(elizaos_client, 'disconnect') as mock_disconnect:
            await elizaos_client.__aexit__(None, None, None)
            mock_disconnect.assert_called_once()
