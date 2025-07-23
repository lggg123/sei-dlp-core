"""Tests for Liquidity Optimizer ML model"""

import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import MagicMock, patch

from sei_dlp_ai.models.liquidity_optimizer import LiquidityOptimizer, LiquidityRange, VolatilityFeatures
from sei_dlp_ai.types import (
    MarketData, AssetSymbol, ChainId, TradingSignal, 
    Position, Portfolio, StrategyType
)


class TestLiquidityOptimizer:
    """Test LiquidityOptimizer functionality"""
    
    @pytest.fixture
    def optimizer(self):
        """Create liquidity optimizer for testing"""
        return LiquidityOptimizer()
        
    @pytest.fixture
    def historical_data(self):
        """Create mock historical price data"""
        dates = pd.date_range(
            start=datetime.now(timezone.utc) - timedelta(days=7),
            end=datetime.now(timezone.utc),
            freq='5min'
        )
        
        # Generate realistic price data with volatility
        np.random.seed(42)
        base_price = 0.45
        returns = np.random.normal(0, 0.02, len(dates))
        prices = [base_price]
        
        for ret in returns[1:]:
            prices.append(prices[-1] * (1 + ret))
            
        volumes = np.random.lognormal(15, 0.5, len(dates))
        funding_rates = np.random.normal(0.0001, 0.00005, len(dates))
        
        return pd.DataFrame({
            'timestamp': dates,
            'price': prices,
            'volume': volumes,
            'funding_rate': funding_rates
        })
        
    def test_optimizer_initialization(self, optimizer):
        """Test optimizer initializes correctly"""
        assert optimizer.sei_chain_id == ChainId.SEI_MAINNET
        assert optimizer.sei_finality_ms == 400
        assert optimizer.min_tick_spacing == 60
        assert optimizer.gas_optimization_factor == 0.95
        assert not optimizer.is_trained
        assert optimizer.ml_model is None
        assert optimizer.onnx_session is None
        
    def test_validate_sei_chain(self, optimizer):
        """Test SEI chain validation"""
        assert optimizer.validate_sei_chain() is True
        
        # Test with invalid chain
        optimizer.sei_chain_id = "invalid_chain"
        assert optimizer.validate_sei_chain() is False
        
    def test_extract_market_features(self, optimizer, mock_market_data):
        """Test market feature extraction"""
        features = optimizer._extract_market_features(mock_market_data)
        
        assert len(features) == 15  # Fixed length
        assert all(isinstance(f, float) for f in features)
        
        # Should include price, volume, price_change, confidence, funding_rate
        assert features[0] == float(mock_market_data[0].price)  # SEI price
        assert features[1] == float(mock_market_data[0].volume_24h)  # SEI volume
        
    def test_extract_market_features_insufficient_data(self, optimizer):
        """Test feature extraction with insufficient market data"""
        # Test with empty data
        features = optimizer._extract_market_features([])
        assert len(features) == 15
        assert all(f == 0.0 for f in features)
        
    def test_calculate_volatility_features(self, optimizer, historical_data):
        """Test volatility feature calculation"""
        features = optimizer._calculate_volatility_features(historical_data)
        
        expected_keys = [
            "price_volatility_1h",
            "price_volatility_24h", 
            "volume_volatility_24h",
            "funding_rate_volatility",
            "cross_correlation"
        ]
        
        assert all(key in features for key in expected_keys)
        assert all(isinstance(features[key], float) for key in expected_keys)
        assert features["price_volatility_24h"] > 0  # Should have some volatility
        
    def test_calculate_volatility_features_empty_data(self, optimizer):
        """Test volatility calculation with empty data"""
        empty_df = pd.DataFrame()
        features = optimizer._calculate_volatility_features(empty_df)
        
        assert all(features[key] == 0.0 for key in features.keys())
        
    def test_extract_sei_features(self, optimizer, mock_liquidity_pool, mock_market_data):
        """Test SEI-specific feature extraction"""
        features = optimizer._extract_sei_features(mock_liquidity_pool, mock_market_data)
        
        assert len(features) == 4
        assert all(isinstance(f, float) for f in features)
        
        # Check finality factor
        expected_finality_factor = 1.0 - (400 / 12000)
        assert abs(features[0] - expected_finality_factor) < 0.001
        
        # Check gas efficiency
        assert features[1] == 0.95
        
    def test_align_to_tick_spacing(self, optimizer, mock_liquidity_pool):
        """Test price alignment to tick spacing"""
        price = Decimal("0.45")
        aligned_price = optimizer._align_to_tick_spacing(price, mock_liquidity_pool)
        
        assert isinstance(aligned_price, Decimal)
        assert aligned_price > 0
        
    @pytest.mark.asyncio
    async def test_extract_features(self, optimizer, mock_liquidity_pool, mock_market_data, historical_data):
        """Test complete feature extraction"""
        position_size = Decimal("1000")
        
        features = await optimizer._extract_features(
            mock_liquidity_pool, mock_market_data, historical_data, position_size
        )
        
        assert features.shape[0] == 1  # Single sample
        assert features.shape[1] > 10  # Multiple features
        assert not np.isnan(features).any()  # No NaN values
        
    @pytest.mark.asyncio
    async def test_predict_statistical_fallback(
        self, optimizer, mock_liquidity_pool, mock_market_data, historical_data
    ):
        """Test statistical prediction fallback method"""
        risk_tolerance = 0.5
        
        prediction = await optimizer._predict_statistical(
            mock_liquidity_pool, mock_market_data, historical_data, risk_tolerance
        )
        
        assert "lower_price" in prediction
        assert "upper_price" in prediction
        assert "confidence" in prediction
        assert "reasoning" in prediction
        
        assert prediction["lower_price"] < prediction["upper_price"]
        assert 0 <= prediction["confidence"] <= 1
        assert "Statistical" in prediction["reasoning"]
        
    @pytest.mark.asyncio
    async def test_predict_statistical_no_historical_data(
        self, optimizer, mock_liquidity_pool, mock_market_data
    ):
        """Test statistical prediction with no historical data"""
        empty_df = pd.DataFrame()
        
        prediction = await optimizer._predict_statistical(
            mock_liquidity_pool, mock_market_data, empty_df, 0.5
        )
        
        assert prediction["lower_price"] < prediction["upper_price"]
        assert prediction["confidence"] == 0.6
        
    def test_optimize_for_sei(self, optimizer, mock_liquidity_pool):
        """Test SEI-specific optimization"""
        range_prediction = {
            "lower_price": Decimal("0.40"),
            "upper_price": Decimal("0.50"),
            "confidence": 0.8,
            "reasoning": "Test prediction"
        }
        
        optimized = optimizer._optimize_for_sei(range_prediction, mock_liquidity_pool)
        
        assert "lower_price" in optimized
        assert "upper_price" in optimized
        assert "SEI gas optimization" in optimized["reasoning"]
        
        # Range should be slightly tighter due to gas optimization
        original_range = range_prediction["upper_price"] - range_prediction["lower_price"]
        optimized_range = optimized["upper_price"] - optimized["lower_price"]
        assert optimized_range <= original_range
        
    @pytest.mark.asyncio
    async def test_calculate_performance_metrics(
        self, optimizer, mock_liquidity_pool, mock_market_data
    ):
        """Test performance metrics calculation"""
        range_prediction = {
            "lower_price": Decimal("0.40"),
            "upper_price": Decimal("0.50"),
            "confidence": 0.8
        }
        position_size = Decimal("1000")
        
        metrics = await optimizer._calculate_performance_metrics(
            range_prediction, mock_liquidity_pool, mock_market_data, position_size
        )
        
        assert "expected_fees" in metrics
        assert "il_risk" in metrics
        assert "capital_efficiency" in metrics
        
        assert metrics["expected_fees"] >= 0
        assert 0 <= metrics["il_risk"] <= 0.5
        assert 0 <= metrics["capital_efficiency"] <= 1
        
    @pytest.mark.asyncio
    async def test_predict_optimal_range_invalid_chain(self, optimizer, mock_liquidity_pool, mock_market_data, historical_data):
        """Test prediction with invalid chain ID"""
        optimizer.sei_chain_id = "invalid"
        position_size = Decimal("1000")
        
        with pytest.raises(ValueError, match="Invalid chain ID"):
            await optimizer.predict_optimal_range(
                mock_liquidity_pool, mock_market_data, historical_data, position_size
            )
            
    @pytest.mark.asyncio
    async def test_predict_optimal_range_statistical(
        self, optimizer, mock_liquidity_pool, mock_market_data, historical_data
    ):
        """Test complete optimal range prediction using statistical method"""
        position_size = Decimal("1000")
        
        result = await optimizer.predict_optimal_range(
            mock_liquidity_pool, mock_market_data, historical_data, position_size
        )
        
        assert isinstance(result, LiquidityRange)
        assert result.lower_price < result.upper_price
        assert 0 <= result.confidence <= 1
        assert result.expected_fees >= 0
        assert 0 <= result.impermanent_loss_risk <= 1
        assert 0 <= result.capital_efficiency <= 1
        assert len(result.reasoning) > 0
        
    @pytest.mark.asyncio
    async def test_generate_rebalance_signal_no_rebalance(
        self, optimizer, mock_liquidity_pool, mock_market_data
    ):
        """Test rebalance signal generation when no rebalance needed"""
        position = Position(
            asset=AssetSymbol.SEI,
            size=Decimal("1000"),
            entry_price=Decimal("2.20"),  # Close to current pool price (~2.22)
            current_price=Decimal("2.22"),
            unrealized_pnl=Decimal("10"),
            timestamp=datetime.now(timezone.utc)
        )
        
        signal = await optimizer.generate_rebalance_signal(
            position, mock_liquidity_pool, mock_market_data, threshold=0.1
        )
        
        assert signal is None  # No rebalance needed
        
    @pytest.mark.asyncio
    async def test_generate_rebalance_signal_with_rebalance(
        self, optimizer, mock_liquidity_pool, mock_market_data
    ):
        """Test rebalance signal generation when rebalance needed"""
        position = Position(
            asset=AssetSymbol.SEI,
            size=Decimal("1000"),
            entry_price=Decimal("0.35"),  # Significant price change
            current_price=Decimal("0.45"),
            unrealized_pnl=Decimal("100"),
            timestamp=datetime.now(timezone.utc)
        )
        
        signal = await optimizer.generate_rebalance_signal(
            position, mock_liquidity_pool, mock_market_data, threshold=0.1
        )
        
        assert isinstance(signal, TradingSignal)
        assert signal.asset == AssetSymbol.SEI
        assert signal.action == "REBALANCE"
        assert signal.confidence > 0
        assert "400ms finality" in signal.reasoning
        
    def test_train_model(self, optimizer):
        """Test ML model training"""
        # Mock the components to avoid pandas/numpy compatibility issues
        mock_model = MagicMock()
        mock_scaler = MagicMock()
        
        with patch('sei_dlp_ai.models.liquidity_optimizer.RandomForestRegressor', return_value=mock_model):
            with patch.object(optimizer, 'scaler', mock_scaler):
                # Create a mock DataFrame that properly mimics feature columns
                mock_df = MagicMock()
                mock_df.columns = ['feature_0', 'feature_1', 'feature_2', 'lower_bound', 'upper_bound', 'confidence']
                
                # Mock the column access operations
                feature_data = MagicMock()
                feature_data.values = np.array([[1.0, 0.1, 0.2], [2.0, 0.2, 0.3], [3.0, 0.3, 0.4]])
                
                target_data = MagicMock()
                target_data.values = np.array([[0.9, 1.1, 0.8], [0.8, 1.2, 0.9], [0.7, 1.3, 0.7]])
                
                # Mock the getitem calls to return our mock data
                mock_df.__getitem__.side_effect = [feature_data, target_data]
                
                # Mock scaler operations
                mock_scaler.fit_transform.return_value = np.array([[1.0, 0.1, 0.2], [2.0, 0.2, 0.3], [3.0, 0.3, 0.4]])
                
                # Mock model operations
                mock_model.fit.return_value = None
                
                # Train the model
                optimizer.train_model(mock_df)
                
                # Verify the expected calls were made
                mock_scaler.fit_transform.assert_called_once()
                mock_model.fit.assert_called_once()
                assert optimizer.is_trained
                assert optimizer.ml_model is not None
        
    def test_train_model_invalid_data(self, optimizer):
        """Test model training with invalid data"""
        # Missing required columns
        invalid_data = pd.DataFrame({'invalid_col': [1, 2, 3]})
        
        with pytest.raises(Exception):  # Should raise some kind of error
            optimizer.train_model(invalid_data)
            
    @pytest.mark.asyncio
    async def test_predict_with_sklearn(self, optimizer):
        """Test prediction with trained sklearn model"""
        # Mock the sklearn model and components
        mock_model = MagicMock()
        mock_model.predict.return_value = np.array([[0.35, 0.55, 0.8, 100.0, 0.2, 0.9]])
        
        mock_scaler = MagicMock()
        mock_scaler.transform.return_value = np.array([[1.0, 2.0, 3.0, 4.0, 5.0]])
        
        # Set up the optimizer with mocked components
        optimizer.ml_model = mock_model
        optimizer.scaler = mock_scaler
        optimizer.is_trained = True
        optimizer.feature_columns = [f'feature_{i}' for i in range(5)]
        
        # Test prediction
        features = np.array([[1.0, 2.0, 3.0, 4.0, 5.0]])
        prediction = await optimizer._predict_with_sklearn(features)
        
        assert "lower_price" in prediction
        assert "upper_price" in prediction
        assert "confidence" in prediction
        assert "reasoning" in prediction
        
        assert isinstance(prediction["lower_price"], Decimal)
        assert isinstance(prediction["upper_price"], Decimal)
        assert 0.1 <= prediction["confidence"] <= 0.9
        
    @pytest.mark.asyncio
    async def test_predict_with_sklearn_no_model(self, optimizer):
        """Test sklearn prediction without trained model"""
        features = np.random.randn(1, 5)
        
        with pytest.raises(ValueError, match="ML model not initialized"):
            await optimizer._predict_with_sklearn(features)
            
    def test_load_onnx_model_file_not_found(self, optimizer):
        """Test loading non-existent ONNX model"""
        with pytest.raises(Exception):  # Should raise file not found or similar
            optimizer.load_onnx_model("non_existent_model.onnx")
            
    @pytest.mark.asyncio
    async def test_predict_with_onnx_no_session(self, optimizer):
        """Test ONNX prediction without initialized session"""
        features = np.random.randn(1, 5)
        
        with pytest.raises(ValueError, match="ONNX session not initialized"):
            await optimizer._predict_with_onnx(features)


class TestLiquidityRange:
    """Test LiquidityRange model"""
    
    def test_liquidity_range_creation(self):
        """Test creating valid liquidity range"""
        range_obj = LiquidityRange(
            lower_price=Decimal("0.40"),
            upper_price=Decimal("0.50"),
            confidence=0.85,
            expected_fees=Decimal("12.50"),
            impermanent_loss_risk=0.15,
            capital_efficiency=0.90,
            reasoning="ML model prediction with high confidence"
        )
        
        assert range_obj.lower_price == Decimal("0.40")
        assert range_obj.upper_price == Decimal("0.50")
        assert range_obj.confidence == 0.85
        assert range_obj.expected_fees == Decimal("12.50")
        assert range_obj.impermanent_loss_risk == 0.15
        assert range_obj.capital_efficiency == 0.90
        assert "ML model" in range_obj.reasoning


class TestLiquidityOptimizerAdditional:
    """Additional test cases for better coverage"""
    
    def test_validate_sei_chain(self):
        """Test SEI chain validation"""
        optimizer = LiquidityOptimizer()
        assert optimizer.validate_sei_chain() is True
    
    def test_volatility_features_empty_dict(self):
        """Test volatility features with empty input"""
        optimizer = LiquidityOptimizer()
        empty_df = pd.DataFrame()
        
        features = optimizer._calculate_volatility_features(empty_df)
        
        # Should return dict with default values
        assert isinstance(features, dict)
        assert "price_volatility_1h" in features
        assert "price_volatility_24h" in features
        assert features["price_volatility_1h"] == 0.0
        assert features["price_volatility_24h"] == 0.0
    
    def test_onnx_session_initialization(self):
        """Test ONNX session initialization attempt"""
        # This tests the exception handling in __init__
        with patch('sei_dlp_ai.models.liquidity_optimizer.ort.InferenceSession', side_effect=Exception("ONNX error")):
            optimizer = LiquidityOptimizer()
            # Should initialize successfully even if ONNX fails
            assert optimizer.onnx_session is None
    
    def test_sei_optimization_parameters(self):
        """Test SEI-specific optimization parameters"""
        optimizer = LiquidityOptimizer()
        
        assert optimizer.sei_finality_ms == 400
        assert optimizer.min_tick_spacing == 60
        assert optimizer.gas_optimization_factor == 0.95
        assert optimizer.sei_chain_id == ChainId.SEI_MAINNET


class TestLiquidityRangeValidation:
    """Test LiquidityRange model validation"""
    
    def test_liquidity_range_creation(self):
        """Test creating LiquidityRange instance"""
        range_obj = LiquidityRange(
            lower_price=Decimal("0.9"),
            upper_price=Decimal("1.1"),
            confidence=0.8,
            expected_fees=Decimal("10.0"),
            impermanent_loss_risk=0.2,
            capital_efficiency=0.85,
            reasoning="Test reasoning"
        )
        
        assert range_obj.lower_price == Decimal("0.9")
        assert range_obj.upper_price == Decimal("1.1")
        assert range_obj.confidence == 0.8
        assert range_obj.expected_fees == Decimal("10.0")
        assert range_obj.impermanent_loss_risk == 0.2
        assert range_obj.capital_efficiency == 0.85
        assert range_obj.reasoning == "Test reasoning"


class TestVolatilityFeatures:
    """Test VolatilityFeatures model"""
    
    def test_volatility_features_creation(self):
        """Test creating VolatilityFeatures instance"""
        features = VolatilityFeatures(
            price_volatility_1h=0.05,
            price_volatility_24h=0.15,
            volume_volatility_24h=0.25,
            funding_rate_volatility=0.01,
            cross_correlation=0.75
        )
        
        assert features.price_volatility_1h == 0.05
        assert features.price_volatility_24h == 0.15
        assert features.volume_volatility_24h == 0.25
        assert features.funding_rate_volatility == 0.01
        assert features.cross_correlation == 0.75


class TestLiquidityOptimizerMLPrediction:
    """Test ML prediction methods and paths"""
    
    @pytest.mark.asyncio
    async def test_predict_with_onnx_model(self, mock_market_data):
        """Test prediction using ONNX model"""
        optimizer = LiquidityOptimizer()
        
        # Mock ONNX session
        mock_onnx_session = MagicMock()
        mock_onnx_session.run.return_value = [np.array([[0.9, 1.1, 0.85]])]
        optimizer.onnx_session = mock_onnx_session
        
        # Mock scaler
        mock_scaler = MagicMock()
        mock_scaler.transform.return_value = np.array([[0.1, 0.2, 0.3, 0.4, 0.5]])
        optimizer.scaler = mock_scaler
        
        # Mock liquidity pool
        mock_pool = MagicMock()
        mock_pool.reserve_0 = Decimal("1000")
        mock_pool.reserve_1 = Decimal("2000")
        mock_pool.fee_tier = Decimal("0.003")
        mock_pool.price_token0_in_token1 = Decimal("1.0")
        
        # Create historical data
        historical_data = pd.DataFrame({
            'price': [1.0, 1.1, 0.9, 1.05],
            'volume': [1000, 1100, 900, 1050]
        })
        
        # Test ONNX prediction path
        range_result = await optimizer.predict_optimal_range(
            pool=mock_pool,
            market_data=mock_market_data,
            historical_data=historical_data,
            position_size=Decimal("1000")
        )
        
        assert isinstance(range_result, LiquidityRange)
        assert range_result.lower_price > 0
        assert range_result.upper_price > range_result.lower_price
    
    @pytest.mark.asyncio
    async def test_predict_with_sklearn_model(self, mock_market_data):
        """Test prediction using sklearn model"""
        optimizer = LiquidityOptimizer()
        
        # Mock sklearn model (no ONNX)
        mock_ml_model = MagicMock()
        mock_ml_model.predict.return_value = np.array([[0.9, 1.1, 0.85]])
        optimizer.ml_model = mock_ml_model
        optimizer.onnx_session = None  # Ensure ONNX is not used
        
        # Mock scaler
        mock_scaler = MagicMock()
        mock_scaler.transform.return_value = np.array([[1, 2, 3, 4, 5]])
        optimizer.scaler = mock_scaler
        
        # Mock liquidity pool
        mock_pool = MagicMock()
        mock_pool.reserve_0 = Decimal("1000")
        mock_pool.reserve_1 = Decimal("2000")
        mock_pool.fee_tier = Decimal("0.003")
        mock_pool.price_token0_in_token1 = Decimal("1.0")
        
        # Create historical data
        historical_data = pd.DataFrame({
            'price': [1.0, 1.1, 0.9, 1.05],
            'volume': [1000, 1100, 900, 1050]
        })
        
        # Test sklearn prediction path
        range_result = await optimizer.predict_optimal_range(
            pool=mock_pool,
            market_data=mock_market_data,
            historical_data=historical_data,
            position_size=Decimal("1000")
        )
        
        assert isinstance(range_result, LiquidityRange)
        mock_ml_model.predict.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_predict_statistical_fallback(self, mock_market_data):
        """Test statistical fallback when no ML models available"""
        optimizer = LiquidityOptimizer()
        
        # Ensure no models are available
        optimizer.onnx_session = None
        optimizer.ml_model = None
        
        # Mock liquidity pool
        mock_pool = MagicMock()
        mock_pool.reserve_0 = Decimal("1000")
        mock_pool.reserve_1 = Decimal("2000")
        mock_pool.fee_tier = Decimal("0.003")
        mock_pool.price_token0_in_token1 = Decimal("1.0")
        
        # Create historical data
        historical_data = pd.DataFrame({
            'price': [1.0, 1.1, 0.9, 1.05],
            'volume': [1000, 1100, 900, 1050]
        })
        
        # Test statistical fallback path
        range_result = await optimizer.predict_optimal_range(
            pool=mock_pool,
            market_data=mock_market_data,
            historical_data=historical_data,
            position_size=Decimal("1000")
        )
        
        assert isinstance(range_result, LiquidityRange)
        assert "statistical volatility-based range" in range_result.reasoning.lower()
    
    @pytest.mark.asyncio
    async def test_predict_optimal_range_exception_handling(self, mock_market_data):
        """Test exception handling in predict_optimal_range"""
        optimizer = LiquidityOptimizer()
        
        # Mock ONNX session that throws exception
        mock_onnx_session = MagicMock()
        mock_onnx_session.run.side_effect = Exception("ONNX prediction failed")
        optimizer.onnx_session = mock_onnx_session
        
        # Mock scaler
        mock_scaler = MagicMock()
        mock_scaler.transform.return_value = np.array([[0.1, 0.2, 0.3, 0.4, 0.5]])
        optimizer.scaler = mock_scaler
        
        # Mock liquidity pool
        mock_pool = MagicMock()
        mock_pool.reserve_0 = Decimal("1000")
        mock_pool.reserve_1 = Decimal("2000")
        mock_pool.fee_tier = Decimal("0.003")
        mock_pool.price_token0_in_token1 = Decimal("1.0")
        
        # Create historical data
        historical_data = pd.DataFrame({
            'price': [1.0, 1.1, 0.9, 1.05],
            'volume': [1000, 1100, 900, 1050]
        })
        
        with pytest.raises(Exception, match="ONNX prediction failed"):
            await optimizer.predict_optimal_range(
                pool=mock_pool,
                market_data=mock_market_data,
                historical_data=historical_data,
                position_size=Decimal("1000")
            )


class TestLiquidityOptimizerFeatureExtraction:
    """Test feature extraction methods"""
    
    @pytest.mark.asyncio
    async def test_extract_features_with_position(self, mock_market_data):
        """Test feature extraction with current position"""
        optimizer = LiquidityOptimizer()
        
        # Mock liquidity pool
        mock_pool = MagicMock()
        mock_pool.reserve_0 = Decimal("1000")
        mock_pool.reserve_1 = Decimal("2000")
        mock_pool.fee_tier = Decimal("0.003")
        mock_pool.price = Decimal("1.0")
        
        # Mock position
        mock_position = MagicMock()
        mock_position.size = Decimal("500")
        mock_position.entry_price = Decimal("0.95")
        mock_position.current_price = Decimal("1.0")
        
        features = await optimizer._extract_features(
            pool=mock_pool,
            market_data=mock_market_data,
            historical_data=pd.DataFrame(),
            position_size=Decimal("1000")
        )
        
        assert isinstance(features, np.ndarray)
        assert features.shape[0] == 1  # Single sample
        assert features.shape[1] > 0   # Multiple features
    
    @pytest.mark.asyncio
    async def test_extract_features_no_position(self, mock_market_data):
        """Test feature extraction without current position"""
        optimizer = LiquidityOptimizer()
        
        # Mock liquidity pool
        mock_pool = MagicMock()
        mock_pool.reserve_0 = Decimal("1000")
        mock_pool.reserve_1 = Decimal("2000")
        mock_pool.fee_tier = Decimal("0.003")
        mock_pool.price = Decimal("1.0")
        
        features = await optimizer._extract_features(
            pool=mock_pool,
            market_data=mock_market_data,
            historical_data=pd.DataFrame(),
            position_size=Decimal("1000")
        )
        
        assert isinstance(features, np.ndarray)
        assert features.shape[0] == 1  # Single sample  
        assert features.shape[1] > 0   # Multiple features
    
    def test_calculate_volatility_features_with_data(self, mock_market_data):
        """Test volatility calculation with real data"""
        optimizer = LiquidityOptimizer()
        
        # Convert market data to DataFrame
        historical_data = pd.DataFrame([
            {
                'price': float(md.price),
                'volume': float(md.volume_24h),
                'timestamp': md.timestamp,
                'funding_rate': float(md.funding_rate) if md.funding_rate else 0.0
            }
            for md in mock_market_data
        ])
        
        features = optimizer._calculate_volatility_features(historical_data)
        
        assert isinstance(features, dict)
        assert 'price_volatility_1h' in features
        assert 'price_volatility_24h' in features
        assert 'volume_volatility_24h' in features
        assert 'funding_rate_volatility' in features
        assert 'cross_correlation' in features


class TestLiquidityOptimizerStatisticalMethods:
    """Test statistical analysis methods"""
    
    def test_statistical_range_calculation(self, mock_market_data):
        """Test statistical range calculation"""
        pytest.skip("Helper method _calculate_statistical_range not yet implemented")
        optimizer = LiquidityOptimizer()
        
        # Test with market data
        result = optimizer._calculate_statistical_range(
            current_price=Decimal("1.0"),
            market_data=mock_market_data,
            volatility_adjustment=0.1
        )
        
        assert isinstance(result, dict)
        assert 'lower_price' in result
        assert 'upper_price' in result
        assert 'confidence' in result
        assert result['lower_price'] < result['upper_price']
    
    def test_statistical_range_empty_data(self):
        """Test statistical range with empty market data"""
        pytest.skip("Helper method _calculate_statistical_range not yet implemented")
        optimizer = LiquidityOptimizer()
        
        result = optimizer._calculate_statistical_range(
            current_price=Decimal("1.0"),
            market_data=[],
            volatility_adjustment=0.1
        )
        
        assert isinstance(result, dict)
        assert result['lower_price'] < result['upper_price']
        assert result['confidence'] > 0


class TestLiquidityOptimizerMLModelPaths:
    """Test specific ML model execution paths"""
    
    @pytest.mark.asyncio
    async def test_predict_with_onnx_method(self):
        """Test _predict_with_onnx method"""
        optimizer = LiquidityOptimizer()
        
        # Mock ONNX session
        mock_onnx_session = MagicMock()
        mock_onnx_session.run.return_value = [np.array([[0.9, 1.1, 0.85]])]
        mock_input = MagicMock()
        mock_input.name = "input"
        mock_onnx_session.get_inputs.return_value = [mock_input]
        optimizer.onnx_session = mock_onnx_session
        
        # Mock scaler
        mock_scaler = MagicMock()
        mock_scaler.transform.return_value = np.array([[0.1, 0.2, 0.3, 0.4, 0.5]])
        optimizer.scaler = mock_scaler
        
        features = [1.0, 2.0, 3.0, 4.0, 5.0]
        
        result = await optimizer._predict_with_onnx(features)
        
        assert isinstance(result, dict)
        assert 'lower_price' in result
        assert 'upper_price' in result
        assert 'confidence' in result
        mock_onnx_session.run.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_predict_with_sklearn_method(self):
        """Test _predict_with_sklearn method"""
        optimizer = LiquidityOptimizer()
        
        # Mock sklearn model
        mock_ml_model = MagicMock()
        mock_ml_model.predict.return_value = np.array([[0.9, 1.1, 0.85, 100.0, 0.2, 0.8]])
        optimizer.ml_model = mock_ml_model
        
        # Mock scaler
        mock_scaler = MagicMock()
        mock_scaler.transform.return_value = np.array([[1, 2, 3, 4, 5]])
        optimizer.scaler = mock_scaler
        
        features = [1.0, 2.0, 3.0, 4.0, 5.0]
        
        result = await optimizer._predict_with_sklearn(features)
        
        assert isinstance(result, dict)
        assert 'lower_price' in result
        assert 'upper_price' in result
        assert 'confidence' in result
        mock_ml_model.predict.assert_called_once()


class TestLiquidityOptimizerHelperMethods:
    """Test helper calculation methods"""
    
    def test_calculate_price_impact(self):
        """Test price impact calculation"""
        pytest.skip("Helper method _calculate_price_impact not yet implemented")
        optimizer = LiquidityOptimizer()
        
        impact = optimizer._calculate_price_impact(
            trade_size=Decimal("1000"),
            liquidity=Decimal("10000"),
            price_range=(Decimal("0.9"), Decimal("1.1"))
        )
        
        assert isinstance(impact, float)
        assert 0 <= impact <= 1
    
    def test_estimate_gas_costs(self):
        """Test gas cost estimation"""
        pytest.skip("Helper method _estimate_gas_costs not yet implemented")
        optimizer = LiquidityOptimizer()
        
        gas_cost = optimizer._estimate_gas_costs(
            complexity_score=3,
            sei_gas_price=Decimal("0.1")
        )
        
        assert isinstance(gas_cost, Decimal)
        assert gas_cost >= 0
    
    def test_align_to_tick_spacing(self):
        """Test tick alignment for SEI"""
        optimizer = LiquidityOptimizer()
        
        # Create mock pool
        mock_pool = MagicMock()
        mock_pool.tick_spacing = 60
        
        aligned_price = optimizer._align_to_tick_spacing(
            price=Decimal("1.234567"),
            pool=mock_pool
        )
        
        assert isinstance(aligned_price, Decimal)
        assert aligned_price > 0
