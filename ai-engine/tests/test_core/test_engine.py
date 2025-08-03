"""Tests for SEI DLP Core Engine"""

import pytest
import asyncio
import pandas as pd
from decimal import Decimal
from datetime import datetime, timezone
from unittest.mock import Mock, AsyncMock, patch

from sei_dlp_ai.core.engine import SEIDLPEngine
from sei_dlp_ai.integrations.elizaos_client import ElizaOSConfig
from sei_dlp_ai.types import (
    AssetSymbol, MarketData, Position, LiquidityPool, TradingSignal
)


class TestSEIDLPEngine:
    """Test cases for the main SEI DLP Engine"""
    
    def test_engine_initialization(self):
        """Test that the engine can be initialized"""
        engine = SEIDLPEngine()
        assert engine is not None
        assert isinstance(engine, SEIDLPEngine)
        assert not engine.is_initialized
        assert not engine.is_running
        assert engine.liquidity_optimizer is not None
        assert engine.risk_manager is not None
    
    def test_engine_initialization_with_config(self):
        """Test engine initialization with custom ElizaOS config"""
        config = ElizaOSConfig(
            base_url="http://test.example.com",
            websocket_url="test://localhost",
            api_key="test_key"
        )
        engine = SEIDLPEngine(elizaos_config=config)
        assert engine.elizaos_config == config
    
    def test_engine_multiple_instances(self):
        """Test that multiple engine instances can be created"""
        engine1 = SEIDLPEngine()
        engine2 = SEIDLPEngine()
        
        assert engine1 is not engine2
        assert isinstance(engine1, SEIDLPEngine)
        assert isinstance(engine2, SEIDLPEngine)
    
    @pytest.mark.asyncio
    async def test_engine_lifecycle(self):
        """Test engine start/stop lifecycle"""
        config = ElizaOSConfig(websocket_url="test://localhost")
        engine = SEIDLPEngine(elizaos_config=config)
        
        with patch.object(engine, '_monitoring_loop') as mock_loop:
            mock_loop.return_value = None
            
            # Test start
            await engine.start()
            assert engine.is_initialized
            assert engine.is_running
            
            # Test stop
            await engine.stop()
            assert not engine.is_running
    
    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test async context manager functionality"""
        config = ElizaOSConfig(websocket_url="test://localhost")
        
        with patch('sei_dlp_ai.core.engine.SEIDLPEngine._monitoring_loop'):
            async with SEIDLPEngine(elizaos_config=config) as engine:
                assert engine.is_running
                assert engine.is_initialized
    
    def test_assess_vault_risk(self):
        """Test vault risk assessment"""
        engine = SEIDLPEngine()
        
        vault_data = {
            'volatility': 0.4,
            'correlation': 0.6,
            'liquidity': 50000,
            'position_size': 10000,
            'total_pool_size': 100000
        }
        
        risk_assessment = engine.assess_vault_risk(vault_data)
        
        assert isinstance(risk_assessment, dict)
        assert 'overall_risk_score' in risk_assessment
        assert 'risk_level' in risk_assessment
        assert 'components' in risk_assessment
    
    @pytest.mark.asyncio
    async def test_predict_optimal_liquidity_range(self):
        """Test liquidity range prediction"""
        engine = SEIDLPEngine()
        
        # Create test data
        pool = LiquidityPool(
            address="0x123",
            token0=AssetSymbol.SEI,
            token1=AssetSymbol.USDC,
            reserve0=Decimal('100000'),
            reserve1=Decimal('50000'),
            fee_tier=0.003,
            liquidity=Decimal('75000'),
            sqrt_price_x96=123456789,
            tick=1000,
            timestamp=datetime.now(timezone.utc)
        )
        
        market_data = [
            MarketData(
                symbol=AssetSymbol.SEI,
                price=Decimal('0.5'),
                volume_24h=Decimal('1000000'),
                price_change_24h=Decimal('0.05'),
                confidence_score=0.9,
                timestamp=datetime.now(timezone.utc),
                source="test"
            )
        ]
        
        historical_data = pd.DataFrame({
            'price': [0.45, 0.47, 0.49, 0.51, 0.50],
            'volume': [100000, 110000, 95000, 105000, 100000]
        })
        
        position_size = Decimal('10000')
        
        result = await engine.predict_optimal_liquidity_range(
            pool, market_data, historical_data, position_size
        )
        
        assert hasattr(result, 'lower_price')
        assert hasattr(result, 'upper_price')
        assert hasattr(result, 'confidence')
        assert result.upper_price > result.lower_price
    
    @pytest.mark.asyncio
    async def test_generate_rebalance_signal(self):
        """Test rebalance signal generation"""
        engine = SEIDLPEngine()
        
        position = Position(
            asset=AssetSymbol.SEI,
            size=Decimal('10000'),
            entry_price=Decimal('0.45'),
            current_price=Decimal('0.50'),  # 11% change
            unrealized_pnl=Decimal('500'),
            leverage=2.0,
            timestamp=datetime.now(timezone.utc)
        )
        
        pool = LiquidityPool(
            address="0x123",
            token0=AssetSymbol.SEI,
            token1=AssetSymbol.USDC,
            reserve0=Decimal('100000'),
            reserve1=Decimal('50000'),
            fee_tier=0.003,
            liquidity=Decimal('75000'),
            sqrt_price_x96=123456789,
            tick=1000,
            timestamp=datetime.now(timezone.utc)
        )
        
        market_data = [
            MarketData(
                symbol=AssetSymbol.SEI,
                price=Decimal('0.5'),
                volume_24h=Decimal('1000000'),
                price_change_24h=Decimal('0.05'),
                confidence_score=0.9,
                timestamp=datetime.now(timezone.utc),
                source="test"
            )
        ]
        
        signal = await engine.generate_rebalance_signal(
            position, pool, market_data, threshold=0.1
        )
        
        # Should generate signal since price moved > 10%
        assert signal is not None
        assert signal.action == "REBALANCE"
        assert signal.asset == AssetSymbol.SEI
    
    @pytest.mark.asyncio
    async def test_execute_dragonswap_trade_without_client(self):
        """Test DragonSwap trade execution without connected client"""
        engine = SEIDLPEngine()
        
        with pytest.raises(ConnectionError):
            await engine.execute_dragonswap_trade(
                AssetSymbol.SEI, AssetSymbol.USDC, Decimal('1000')
            )
    
    @pytest.mark.asyncio
    async def test_execute_perp_trade_without_client(self):
        """Test perpetual trade execution without connected client"""
        engine = SEIDLPEngine()
        
        with pytest.raises(ConnectionError):
            await engine.execute_perp_trade(
                AssetSymbol.SEI, "long", Decimal('1000'), 2.0
            )
    
    @pytest.mark.asyncio
    async def test_execute_perp_trade_with_leverage(self):
        """Test perpetual trade execution with different leverage values"""
        config = ElizaOSConfig(websocket_url="test://localhost")
        engine = SEIDLPEngine(elizaos_config=config)
        
        # Mock the elizaos_client
        mock_client = AsyncMock()
        mock_client.execute_perp_trade.return_value = {
            'status': 'success',
            'trade_id': 'test_trade_123',
            'leverage': 3.0
        }
        engine.elizaos_client = mock_client
        
        # Test with different leverage values
        result = await engine.execute_perp_trade(
            AssetSymbol.SEI, "long", Decimal('1000'), 3.0
        )
        
        assert result['status'] == 'success'
        assert result['leverage'] == 3.0
        mock_client.execute_perp_trade.assert_called_once_with(
            AssetSymbol.SEI, "long", Decimal('1000'), 3.0, "market"
        )
    
    def test_train_liquidity_model(self):
        """Test liquidity model training"""
        engine = SEIDLPEngine()
        
        # Create mock training data
        training_data = pd.DataFrame({
            'feature1': [1, 2, 3, 4, 5],
            'feature2': [0.1, 0.2, 0.3, 0.4, 0.5],
            'lower_bound': [0.45, 0.47, 0.49, 0.51, 0.50],
            'upper_bound': [0.55, 0.57, 0.59, 0.61, 0.60],
            'confidence': [0.8, 0.85, 0.9, 0.75, 0.8]
        })
        
        # Should not raise an exception
        engine.train_liquidity_model(training_data)
        assert engine.liquidity_optimizer.is_trained
    
    def test_load_onnx_model_invalid_path(self):
        """Test ONNX model loading with invalid path"""
        engine = SEIDLPEngine()
        
        with pytest.raises(Exception):  # Should raise an exception for invalid path
            engine.load_onnx_model("nonexistent_model.onnx")
