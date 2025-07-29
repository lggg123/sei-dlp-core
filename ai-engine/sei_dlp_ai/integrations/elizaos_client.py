"""
ElizaOS Client Integration

Connects the Python AI engine with your ElizaOS TypeScript infrastructure.
Handles real-time communication for market data, trading signals, and execution.
"""

import asyncio
import json
import logging
from decimal import Decimal
from datetime import datetime, timezone
from typing import Dict, List, Optional, Callable, Any
from urllib.parse import urljoin
import aiohttp
import websockets
from websockets import ConnectionClosed
from pydantic import BaseModel

from ..types import (
    ElizaOSMessage, MarketData, TradingSignal, Portfolio,
    ArbitrageOpportunity, RiskMetrics, AssetSymbol
)


logger = logging.getLogger(__name__)


class ElizaOSConfig(BaseModel):
    """Configuration for ElizaOS integration"""
    base_url: str = "http://localhost:3000"
    websocket_url: str = "ws://localhost:3001"
    api_key: Optional[str] = None
    agent_id: str = "ai_engine"
    room_id: str = "sei_dlp_main"
    timeout: int = 30
    reconnect_attempts: int = 5
    reconnect_delay: float = 5.0


class ElizaOSClient:
    """
    Client for integrating with ElizaOS infrastructure
    
    Provides real-time communication with your TypeScript plugins:
    - SEI Oracle Provider
    - DragonSwap Trading Action  
    - Perpetual Trading Action
    - Funding Rate Arbitrage Engine
    - Portfolio Rebalancing System
    """
    
    def __init__(self, config: ElizaOSConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.message_handlers: Dict[str, Callable] = {}
        self.is_connected = False
        self._reconnect_task: Optional[asyncio.Task] = None
        
    async def connect(self) -> None:
        """Establish connections to ElizaOS services"""
        try:
            # HTTP session for REST API calls
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.config.timeout),
                headers=self._get_auth_headers()
            )
            
            # WebSocket for real-time communication
            await self._connect_websocket()
            
            self.is_connected = True
            logger.info("Connected to ElizaOS services")
            
        except Exception as e:
            logger.error(f"Failed to connect to ElizaOS: {e}")
            await self.disconnect()
            raise
            
    async def disconnect(self) -> None:
        """Close all connections"""
        self.is_connected = False
        
        if self._reconnect_task:
            self._reconnect_task.cancel()
            
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
            
        if self.session:
            await self.session.close()
            self.session = None
            
        logger.info("Disconnected from ElizaOS services")
        
    async def _connect_websocket(self) -> None:
        """Connect to ElizaOS WebSocket endpoint"""
        if self.config.websocket_url.startswith("test://"):
            # Skip websocket in test mode
            self.is_connected = True
            return
            
        try:
            self.websocket = await websockets.connect(
                self.config.websocket_url,
                extra_headers=self._get_auth_headers()
            )
            self.is_connected = True
            
            # Start listening for messages
            self._reconnect_task = asyncio.create_task(self._websocket_listener())
            
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            raise ConnectionError(f"Failed to connect to ElizaOS WebSocket: {e}")
                    
    async def _websocket_listener(self) -> None:
        """Listen for incoming WebSocket messages"""
        if not self.websocket:
            logger.error("WebSocket is not connected")
            return
            
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    await self._handle_message(data)
                except json.JSONDecodeError as e:
                    logger.warning(f"Invalid JSON received: {e}")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
                    
        except ConnectionClosed:
            logger.warning("WebSocket connection closed")
            if self.is_connected:
                self._reconnect_task = asyncio.create_task(self._reconnect_websocket())
                
    async def _reconnect_websocket(self) -> None:
        """Reconnect WebSocket with exponential backoff"""
        for attempt in range(self.config.reconnect_attempts):
            try:
                await asyncio.sleep(self.config.reconnect_delay * (2 ** attempt))
                await self._connect_websocket()
                logger.info("WebSocket reconnected successfully")
                return
            except Exception as e:
                logger.warning(f"WebSocket reconnection attempt {attempt + 1} failed: {e}")
                
        logger.error("Failed to reconnect WebSocket after all attempts")
        self.is_connected = False
        
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers"""
        headers = {"Content-Type": "application/json"}
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
        return headers
        
    async def _handle_message(self, data: Dict[str, Any]) -> None:
        """Handle incoming messages from ElizaOS"""
        try:
            message = ElizaOSMessage(**data)
            message_type = message.message_type
            
            if message_type in self.message_handlers:
                await self.message_handlers[message_type](message)
            else:
                logger.debug(f"No handler for message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            
    def register_handler(self, message_type: str, handler: Callable) -> None:
        """Register a message handler for specific message types"""
        self.message_handlers[message_type] = handler
        logger.debug(f"Registered handler for message type: {message_type}")
        
    async def send_message(self, message: ElizaOSMessage) -> None:
        """Send message via WebSocket"""
        if not self.websocket or not self.is_connected:
            raise ConnectionError("Not connected to ElizaOS")
            
        try:
            message_data = message.model_dump()
            # Convert Decimal and datetime to JSON-serializable formats
            message_json = json.dumps(message_data, default=self._json_serializer)
            await self.websocket.send(message_json)
            logger.debug(f"Sent message: {message.message_type}")
            
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            raise
            
    async def get_market_data(self, assets: List[AssetSymbol]) -> List[MarketData]:
        """
        Get market data from SEI Oracle Provider
        
        Calls your existing oracle provider that aggregates:
        - Pyth Network prices
        - Chainlink feeds  
        - CEX APIs for funding rates
        """
        if not self.session:
            raise ConnectionError("HTTP session not established")
            
        try:
            asset_symbols = [asset.value for asset in assets]
            
            async with self.session.get(
                urljoin(self.config.base_url, "/api/oracle/market-data"),
                params={"assets": ",".join(asset_symbols)}
            ) as response:
                response.raise_for_status()
                data = await response.json()
                
                return [MarketData(**item) for item in data["market_data"]]
                
        except Exception as e:
            logger.error(f"Failed to get market data: {e}")
            raise
            
    async def execute_dragonswap_trade(
        self, 
        from_asset: AssetSymbol,
        to_asset: AssetSymbol, 
        amount: Decimal,
        max_slippage: float = 0.005
    ) -> Dict[str, Any]:
        """
        Execute trade via DragonSwap
        
        Integrates with your DragonSwap trading action
        """
        if not self.session:
            raise ConnectionError("HTTP session not established")
            
        try:
            trade_data = {
                "from_asset": from_asset.value,
                "to_asset": to_asset.value,
                "amount": str(amount),
                "max_slippage": max_slippage,
                "agent_id": self.config.agent_id
            }
            
            async with self.session.post(
                urljoin(self.config.base_url, "/api/trading/dragonswap/swap"),
                json=trade_data
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                logger.info(f"DragonSwap trade executed: {from_asset} -> {to_asset}")
                return result
                
        except Exception as e:
            logger.error(f"DragonSwap trade failed: {e}")
            raise
            
    async def execute_perp_trade(
        self,
        asset: AssetSymbol,
        side: str,  # "long" or "short"
        size: Decimal,
        leverage: float,
        order_type: str = "market"
    ) -> Dict[str, Any]:
        """
        Execute perpetual futures trade
        
        Integrates with your perpetual trading action
        """
        if not self.session:
            raise ConnectionError("HTTP session not established")
            
        try:
            trade_data = {
                "asset": asset.value,
                "side": side,
                "size": str(size),
                "leverage": leverage,
                "order_type": order_type,
                "agent_id": self.config.agent_id
            }
            
            async with self.session.post(
                urljoin(self.config.base_url, "/api/trading/perpetual/position"),
                json=trade_data
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                logger.info(f"Perpetual trade executed: {side} {asset} with {leverage}x leverage")
                return result
                
        except Exception as e:
            logger.error(f"Perpetual trade failed: {e}")
            raise
            
    async def get_arbitrage_opportunities(self) -> List[ArbitrageOpportunity]:
        """
        Get funding rate arbitrage opportunities
        
        Fetches from your funding arbitrage engine
        """
        if not self.session:
            raise ConnectionError("HTTP session not established")
            
        try:
            async with self.session.get(
                urljoin(self.config.base_url, "/api/arbitrage/opportunities")
            ) as response:
                response.raise_for_status()
                data = await response.json()
                
                return [ArbitrageOpportunity(**item) for item in data["opportunities"]]
                
        except Exception as e:
            logger.error(f"Failed to get arbitrage opportunities: {e}")
            raise
            
    async def trigger_portfolio_rebalance(
        self, 
        portfolio: Portfolio,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Trigger portfolio rebalancing
        
        Integrates with your rebalancing system
        """
        if not self.session:
            raise ConnectionError("HTTP session not established")
            
        try:
            rebalance_data = {
                "strategy": portfolio.strategy.value,
                "target_allocations": {
                    asset.value: allocation 
                    for asset, allocation in portfolio.target_allocations.items()
                },
                "force_rebalance": force,
                "agent_id": self.config.agent_id
            }
            
            async with self.session.post(
                urljoin(self.config.base_url, "/api/portfolio/rebalance"),
                json=rebalance_data
            ) as response:
                response.raise_for_status()
                result = await response.json()
                
                logger.info(f"Portfolio rebalance triggered for {portfolio.strategy}")
                return result
                
        except Exception as e:
            logger.error(f"Portfolio rebalance failed: {e}")
            raise
            
    async def send_trading_signal(self, signal: TradingSignal) -> None:
        """Send AI-generated trading signal to ElizaOS"""
        message = ElizaOSMessage(
            id=f"signal_{int(datetime.now(timezone.utc).timestamp())}",
            room_id=self.config.room_id,
            agent_id=self.config.agent_id,
            user_id="system",
            content={
                "signal": signal.model_dump(),
                "type": "trading_signal"
            },
            message_type="TRADING_SIGNAL",
            timestamp=datetime.now(timezone.utc),
            metadata={"source": "ai_engine"}
        )
        
        await self.send_message(message)
        
    async def send_risk_alert(self, risk_metrics: RiskMetrics, alert_level: str) -> None:
        """Send risk management alert to ElizaOS"""
        message = ElizaOSMessage(
            id=f"risk_alert_{int(datetime.now(timezone.utc).timestamp())}",
            room_id=self.config.room_id,
            agent_id=self.config.agent_id,
            user_id="system",
            content={
                "risk_metrics": risk_metrics.model_dump(),
                "alert_level": alert_level,
                "type": "risk_alert"
            },
            message_type="RISK_ALERT",
            timestamp=datetime.now(timezone.utc),
            metadata={"source": "ai_engine"}
        )
        
        await self.send_message(message)
        
    def _json_serializer(self, obj: Any) -> Any:
        """Custom JSON serializer for Decimal and datetime"""
        if isinstance(obj, Decimal):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
        
    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.disconnect()
