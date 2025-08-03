"""SEI DLP Engine - Main AI Engine Entry Point"""

import asyncio
import logging
import pandas as pd
from decimal import Decimal
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from ..types import (
    ChainId, AssetSymbol, MarketData, Position, LiquidityPool,
    TradingSignal, LiquidityRange, Portfolio, RiskMetrics, ArbitrageOpportunity
)
from ..models.liquidity_optimizer import LiquidityOptimizer
from ..models.risk_manager import RiskManager
from ..integrations.elizaos_client import ElizaOSClient, ElizaOSConfig

logger = logging.getLogger(__name__)


class SEIDLPEngine:
    """
    Main AI engine for SEI DLP
    
    Coordinates all AI components:
    - Liquidity optimization using ML models
    - Risk management and assessment
    - Integration with ElizaOS infrastructure
    - Real-time trading signals and execution
    """
    
    def __init__(self, elizaos_config: Optional[ElizaOSConfig] = None):
        """Initialize the SEI DLP AI Engine"""
        # Core components
        self.liquidity_optimizer = LiquidityOptimizer()
        self.risk_manager = RiskManager()
        
        # ElizaOS integration
        self.elizaos_config = elizaos_config or ElizaOSConfig()
        self.elizaos_client: Optional[ElizaOSClient] = None
        
        # Engine state
        self.is_initialized = False
        self.is_running = False
        self._monitoring_task: Optional[asyncio.Task] = None
        
        logger.info("SEI DLP Engine initialized")
    
    async def initialize(self) -> None:
        """Initialize the engine and all components"""
        try:
            # Initialize ElizaOS client
            self.elizaos_client = ElizaOSClient(self.elizaos_config)
            await self.elizaos_client.connect()
            
            # Register message handlers
            self._register_message_handlers()
            
            self.is_initialized = True
            logger.info("SEI DLP Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize engine: {e}")
            raise
    
    async def start(self) -> None:
        """Start the engine and begin monitoring"""
        if not self.is_initialized:
            await self.initialize()
        
        self.is_running = True
        
        # Start monitoring task
        self._monitoring_task = asyncio.create_task(self._monitoring_loop())
        
        logger.info("SEI DLP Engine started")
    
    async def stop(self) -> None:
        """Stop the engine and cleanup resources"""
        self.is_running = False
        
        if self._monitoring_task:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass
        
        if self.elizaos_client:
            await self.elizaos_client.disconnect()
        
        logger.info("SEI DLP Engine stopped")
    
    def _register_message_handlers(self) -> None:
        """Register handlers for ElizaOS messages"""
        if not self.elizaos_client:
            return
        
        self.elizaos_client.register_handler("MARKET_DATA_UPDATE", self._handle_market_data_update)
        self.elizaos_client.register_handler("POSITION_UPDATE", self._handle_position_update)
        self.elizaos_client.register_handler("REBALANCE_REQUEST", self._handle_rebalance_request)
    
    async def _monitoring_loop(self) -> None:
        """Main monitoring loop for the engine"""
        while self.is_running:
            try:
                # Monitor market conditions
                await self._monitor_market_conditions()
                
                # Check for arbitrage opportunities
                await self._check_arbitrage_opportunities()
                
                # Assess portfolio risk
                await self._assess_portfolio_risk()
                
                # Sleep for next iteration
                await asyncio.sleep(30)  # Monitor every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Back off on error
    
    async def _monitor_market_conditions(self) -> None:
        """Monitor market conditions and generate signals"""
        if not self.elizaos_client:
            return
        
        try:
            # Get market data for key assets
            assets = [AssetSymbol.SEI, AssetSymbol.USDC, AssetSymbol.ETH]
            market_data = await self.elizaos_client.get_market_data(assets)
            
            # Analyze market conditions and generate signals if needed
            for data in market_data:
                if abs(float(data.price_change_24h)) > 0.05:  # 5% change threshold
                    signal = await self._generate_trading_signal(data, market_data)
                    if signal:
                        await self.elizaos_client.send_trading_signal(signal)
                        
        except Exception as e:
            logger.warning(f"Error monitoring market conditions: {e}")
    
    async def _check_arbitrage_opportunities(self) -> None:
        """Check for funding rate arbitrage opportunities"""
        if not self.elizaos_client:
            return
        
        try:
            opportunities = await self.elizaos_client.get_arbitrage_opportunities()
            
            for opp in opportunities:
                if opp.potential_profit > Decimal('100') and opp.risk_score < 0.3:
                    logger.info(f"High-value arbitrage opportunity detected: {opp.asset} - ${opp.potential_profit}")
                    
        except Exception as e:
            logger.warning(f"Error checking arbitrage opportunities: {e}")
    
    async def _assess_portfolio_risk(self) -> None:
        """Assess overall portfolio risk"""
        try:
            # This would typically fetch actual portfolio data
            # For now, we'll use placeholder logic
            portfolio_data = {
                'volatility': 0.4,
                'correlation': 0.6,
                'liquidity': 50000,
                'position_size': 10000,
                'total_pool_size': 100000
            }
            
            risk_assessment = self.risk_manager.assess_vault_risk(portfolio_data)
            
            if risk_assessment.get('risk_level') == 'high':
                logger.warning(f"High risk detected: {risk_assessment}")
                
                # Send risk alert via ElizaOS if client is available
                if self.elizaos_client:
                    risk_metrics = RiskMetrics(
                        portfolio_var_95=Decimal('1000'),
                        max_leverage=3.0,
                        concentration_risk=0.7,
                        liquidity_risk=0.3,
                        counterparty_risk=0.2,
                        overall_risk_score=risk_assessment['overall_risk_score'],
                        recommended_max_position_size=Decimal('5000'),
                        timestamp=datetime.now(timezone.utc)
                    )
                    await self.elizaos_client.send_risk_alert(risk_metrics, 'high')
                    
        except Exception as e:
            logger.warning(f"Error assessing portfolio risk: {e}")
    
    async def _generate_trading_signal(
        self, 
        market_data: MarketData, 
        all_market_data: List[MarketData]
    ) -> Optional[TradingSignal]:
        """Generate trading signal based on market conditions"""
        try:
            confidence = min(0.9, market_data.confidence_score + 0.1)
            
            # Simple signal generation logic
            if float(market_data.price_change_24h) > 0.05:
                action = "BUY"
            elif float(market_data.price_change_24h) < -0.05:
                action = "SELL"
            else:
                return None
            
            return TradingSignal(
                asset=market_data.symbol,
                action=action,
                confidence=confidence,
                target_price=market_data.price * Decimal('1.02'),
                reasoning=f"Market {action.lower()} signal based on {market_data.price_change_24h:.2%} price movement",
                model_version="v1.0.0",
                timestamp=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            logger.error(f"Error generating trading signal: {e}")
            return None
    
    async def _handle_market_data_update(self, message) -> None:
        """Handle market data update messages from ElizaOS"""
        try:
            logger.debug(f"Received market data update: {message.content}")
            # Process market data update
        except Exception as e:
            logger.error(f"Error handling market data update: {e}")
    
    async def _handle_position_update(self, message) -> None:
        """Handle position update messages from ElizaOS"""
        try:
            logger.debug(f"Received position update: {message.content}")
            # Process position update
        except Exception as e:
            logger.error(f"Error handling position update: {e}")
    
    async def _handle_rebalance_request(self, message) -> None:
        """Handle portfolio rebalance requests from ElizaOS"""
        try:
            logger.info(f"Received rebalance request: {message.content}")
            # Process rebalance request
        except Exception as e:
            logger.error(f"Error handling rebalance request: {e}")
    
    async def predict_optimal_liquidity_range(
        self,
        pool: LiquidityPool,
        market_data: List[MarketData],
        historical_data: pd.DataFrame,
        position_size: Decimal,
        risk_tolerance: float = 0.5
    ) -> LiquidityRange:
        """
        Predict optimal liquidity range for a position
        
        Args:
            pool: Liquidity pool information
            market_data: Current market data
            historical_data: Historical price/volume data
            position_size: Size of the position
            risk_tolerance: Risk tolerance (0-1)
            
        Returns:
            LiquidityRange with optimal price bounds
        """
        return await self.liquidity_optimizer.predict_optimal_range(
            pool, market_data, historical_data, position_size, risk_tolerance
        )
    
    async def generate_rebalance_signal(
        self,
        position: Position,
        pool: LiquidityPool,
        market_data: List[MarketData],
        threshold: float = 0.1
    ) -> Optional[TradingSignal]:
        """
        Generate rebalance signal for a position
        
        Args:
            position: Current position
            pool: Liquidity pool information
            market_data: Current market data
            threshold: Rebalance threshold
            
        Returns:
            TradingSignal if rebalance is needed
        """
        return await self.liquidity_optimizer.generate_rebalance_signal(
            position, pool, market_data, threshold
        )
    
    def assess_vault_risk(self, vault_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess risk for a vault position
        
        Args:
            vault_data: Vault data including position size, volatility, etc.
            
        Returns:
            Risk assessment with score and recommendations
        """
        return self.risk_manager.assess_vault_risk(vault_data)
    
    async def execute_dragonswap_trade(
        self,
        from_asset: AssetSymbol,
        to_asset: AssetSymbol,
        amount: Decimal,
        max_slippage: float = 0.005
    ) -> Dict[str, Any]:
        """Execute trade via DragonSwap integration"""
        if not self.elizaos_client:
            raise ConnectionError("ElizaOS client not connected")
        
        return await self.elizaos_client.execute_dragonswap_trade(
            from_asset, to_asset, amount, max_slippage
        )
    
    async def execute_perp_trade(
        self,
        asset: AssetSymbol,
        side: str,
        size: Decimal,
        leverage: float,
        order_type: str = "market"
    ) -> Dict[str, Any]:
        """Execute perpetual futures trade"""
        if not self.elizaos_client:
            raise ConnectionError("ElizaOS client not connected")
        
        return await self.elizaos_client.execute_perp_trade(
            asset, side, size, leverage, order_type
        )
    
    def train_liquidity_model(self, training_data: pd.DataFrame) -> None:
        """Train the liquidity optimization ML model"""
        self.liquidity_optimizer.train_model(training_data)
        logger.info("Liquidity optimization model trained successfully")
    
    def load_onnx_model(self, model_path: str) -> None:
        """Load ONNX model for production inference"""
        self.liquidity_optimizer.load_onnx_model(model_path)
        logger.info(f"ONNX model loaded from {model_path}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.stop()
