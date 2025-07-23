"""
Additional tests for LiquidityOptimizer to achieve 100% coverage
Focus on specific uncovered lines: 304-306, 348-355, 460, 488, 502-519
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from decimal import Decimal
from datetime import datetime, timezone
import numpy as np
import pandas as pd

from sei_dlp_ai.models.liquidity_optimizer import LiquidityOptimizer
from sei_dlp_ai.types import (
    MarketData, LiquidityPool, Position, AssetSymbol, ChainId
)


@pytest.fixture
def mock_market_data():
    """Create mock market data for testing"""
    return MarketData(
        symbol=AssetSymbol.ETH,
        price=Decimal("2000.0"),
        volume_24h=Decimal("1000000.0"),
        price_change_24h=Decimal("50.0"),
        confidence_score=0.95,
        timestamp=datetime.now(timezone.utc),
        source="test"
    )


@pytest.fixture
def mock_liquidity_pool():
    """Create mock liquidity pool for testing"""
    return LiquidityPool(
        address="0x123abc",
        token0="ETH",
        token1="USDC",
        fee_tier=0.003,
        reserve0=Decimal("1000"),
        reserve1=Decimal("2000000"),
        liquidity=Decimal("1000000.0"),
        sqrt_price_x96=1000000,
        tick=0,
        timestamp=datetime.now(timezone.utc)
    )


@pytest.fixture
def mock_position():
    """Create mock position for testing"""
    return Position(
        asset="ETH",
        size=Decimal("10.0"),
        entry_price=Decimal("2000.0"),
        current_price=Decimal("2100.0"),
        unrealized_pnl=Decimal("1000.0"),
        timestamp=datetime.now(timezone.utc)
    )


class TestLiquidityOptimizerCoverage:
    """Test class focusing on achieving 100% coverage for LiquidityOptimizer"""

    @pytest.mark.asyncio
    async def test_sklearn_prediction_exception_handling(self):
        """Test sklearn prediction exception handling (lines 304-306)"""
        optimizer = LiquidityOptimizer()
        
        # Mock the sklearn model to raise an exception
        mock_model = MagicMock()
        mock_model.predict.side_effect = Exception("Sklearn prediction failed")
        
        optimizer.ml_model = mock_model
        optimizer.scaler = MagicMock()
        optimizer.scaler.transform.return_value = np.array([[1.0, 2.0]])
        
        # Mock the data preparation
        features = np.array([[1.0, 2.0]])
        
        # This should trigger the exception handling in _predict_with_sklearn (lines 304-306)
        # The exception should be caught, logged, and re-raised
        with pytest.raises(Exception, match="Sklearn prediction failed"):
            await optimizer._predict_with_sklearn(features)

    @pytest.mark.asyncio
    async def test_statistical_minimum_range_adjustment(self, mock_liquidity_pool):
        """Test statistical prediction minimum range adjustment (lines 348-355)"""
        optimizer = LiquidityOptimizer()
        
        # Mock data that would result in a very small range that needs adjustment
        with patch.object(optimizer, '_calculate_volatility_features') as mock_vol:
            # Set very low volatility to trigger minimum range adjustment
            mock_vol.return_value = {'volatility': 0.001}  # 0.1% volatility
            
            # Create mock historical data
            mock_historical = pd.DataFrame({
                'price': [1.0, 1.1, 0.9],
                'volume': [100, 200, 150]
            })
            
            # This should trigger the minimum range adjustment on lines 348-355
            result = await optimizer._predict_statistical(
                mock_liquidity_pool,
                [],  # empty market data
                mock_historical,
                0.5  # risk tolerance
            )
            
            lower_price = Decimal(str(result["lower_price"]))
            upper_price = Decimal(str(result["upper_price"]))
            
            # Check that minimum range was applied
            current_price = mock_liquidity_pool.price_token0_in_token1
            min_range = current_price * Decimal('0.05')
            actual_range = upper_price - lower_price
            
            # The range should be at least the minimum
            assert actual_range >= min_range

    @pytest.mark.asyncio
    async def test_statistical_negative_lower_bound_adjustment(self, mock_liquidity_pool):
        """Test statistical prediction negative lower bound adjustment (lines 354-355)"""
        optimizer = LiquidityOptimizer()
        
        # Create a pool with very low reserves to potentially get negative lower bound
        low_reserve_pool = LiquidityPool(
            address="0x123abc",
            token0="ETH",
            token1="USDC", 
            fee_tier=0.003,
            reserve0=Decimal("0.01"),  # Very low reserve
            reserve1=Decimal("0.01"),  # Very low reserve
            liquidity=Decimal("100.0"),
            sqrt_price_x96=1000000,
            tick=0,
            timestamp=datetime.now(timezone.utc)
        )
        
        with patch.object(optimizer, '_calculate_volatility_features') as mock_vol:
            # Set high volatility that could cause negative lower bound
            mock_vol.return_value = {'volatility': 2.0}  # 200% volatility
            
            # Create mock historical data
            mock_historical = pd.DataFrame({
                'price': [1.0, 1.1, 0.9],
                'volume': [100, 200, 150]
            })
            
            result = await optimizer._predict_statistical(
                low_reserve_pool,
                [],
                mock_historical,
                0.5  # risk tolerance
            )
            
            lower_price = Decimal(str(result["lower_price"]))
            
            # Lower bound should never be negative, should be adjusted to 5% of current price
            current_price = low_reserve_pool.price_token0_in_token1
            expected_min_lower = current_price * Decimal('0.05')
            assert lower_price >= expected_min_lower

    @pytest.mark.asyncio
    async def test_rebalance_signal_invalid_chain(self, mock_liquidity_pool, mock_position, mock_market_data):
        """Test rebalance signal with invalid chain (line 460)"""
        optimizer = LiquidityOptimizer()
        
        # Mock the validate_sei_chain to return False to trigger line 460
        with patch.object(optimizer, 'validate_sei_chain', return_value=False):
            with pytest.raises(ValueError, match="Invalid chain ID"):
                await optimizer.generate_rebalance_signal(mock_position, mock_liquidity_pool, [mock_market_data])

    def test_onnx_loading_exception(self):
        """Test ONNX model loading exception handling (line 488)"""
        optimizer = LiquidityOptimizer()
        
        # Mock onnxruntime to raise an exception during session creation
        with patch('sei_dlp_ai.models.liquidity_optimizer.ort') as mock_ort:
            mock_ort.InferenceSession.side_effect = Exception("ONNX loading failed")
            
            # This should trigger the exception handling on line 488
            # The exception should be caught, logged, and re-raised
            with pytest.raises(Exception, match="ONNX loading failed"):
                optimizer.load_onnx_model("fake_model_path.onnx")

    def test_train_model_successful(self):
        """Test successful model training (lines 502-519)"""
        optimizer = LiquidityOptimizer()
        
        # Mock all the components completely
        mock_model = MagicMock()
        mock_scaler = MagicMock()
        
        with patch('sei_dlp_ai.models.liquidity_optimizer.RandomForestRegressor', return_value=mock_model):
            with patch.object(optimizer, 'scaler', mock_scaler):
                # Create a mock DataFrame that properly mimics feature columns
                mock_df = MagicMock()
                mock_df.columns = ['feature_price', 'feature_volume', 'lower_bound', 'upper_bound', 'confidence']
                
                # Mock the column access operations that happen on lines 500-501
                feature_data = MagicMock()
                feature_data.values = np.array([[1.0, 0.1], [2.0, 0.2], [3.0, 0.3]])
                
                target_data = MagicMock()
                target_data.values = np.array([[0.9, 1.1, 0.8], [0.8, 1.2, 0.9], [0.7, 1.3, 0.7]])
                
                # Mock the getitem calls to return our mock data
                mock_df.__getitem__.side_effect = [feature_data, target_data]
                
                # Mock scaler operations
                mock_scaler.fit_transform.return_value = np.array([[1.0, 0.1], [2.0, 0.2], [3.0, 0.3]])
                
                # Mock model operations
                mock_model.fit.return_value = None
                
                # This should cover lines 502-519 successfully
                optimizer.train_model(mock_df)
                
                # Verify the expected calls were made
                mock_scaler.fit_transform.assert_called_once()
                mock_model.fit.assert_called_once()

    def test_train_model_no_feature_columns(self):
        """Test training model with no feature columns (lines 498-499)"""
        optimizer = LiquidityOptimizer()
        
        # Create a DataFrame with no feature columns
        mock_df = MagicMock()
        mock_df.columns = ['price', 'volume']  # No columns starting with 'feature_'
        
        # This should trigger the ValueError due to no feature columns
        with pytest.raises(ValueError, match="No feature columns found"):
            optimizer.train_model(mock_df)
                
    def test_train_model_exception_handling(self):
        """Test model training exception handling (lines 521-523)"""
        optimizer = LiquidityOptimizer()
        
        # Mock all the components
        mock_scaler = MagicMock()
        
        with patch.object(optimizer, 'scaler', mock_scaler):
            # Create a mock DataFrame with proper feature columns
            mock_df = MagicMock()
            mock_df.columns = ['feature_price', 'feature_volume', 'lower_bound', 'upper_bound', 'confidence']
            
            # Mock the column access to trigger the first part successfully
            feature_data = MagicMock()
            feature_data.values = np.array([[1.0, 0.1], [2.0, 0.2], [3.0, 0.3]])
            
            target_data = MagicMock()
            target_data.values = np.array([[0.9, 1.1, 0.8], [0.8, 1.2, 0.9], [0.7, 1.3, 0.7]])
            
            mock_df.__getitem__.side_effect = [feature_data, target_data]
            mock_scaler.fit_transform.return_value = np.array([[1.0, 0.1], [2.0, 0.2], [3.0, 0.3]])
            
            # Mock RandomForestRegressor to raise an exception during instantiation
            with patch('sei_dlp_ai.models.liquidity_optimizer.RandomForestRegressor') as mock_rf:
                mock_rf.side_effect = Exception("Training failed")
                
                # This should trigger the exception handling on lines 521-523
                with pytest.raises(Exception, match="Training failed"):
                    optimizer.train_model(mock_df)
