"""Liquidity Optimizer ML model for SEI DLP"""

import asyncio
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Union
from numpy.typing import NDArray
from datetime import datetime, timezone
from decimal import Decimal
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import onnxruntime as ort

from sei_dlp_ai.types import (
    ChainId, AssetSymbol, MarketData, Position, LiquidityPool,
    TradingSignal, LiquidityRange, VolatilityFeatures
)

logger = logging.getLogger(__name__)


class LiquidityOptimizer:
    """ML-driven liquidity range optimization for SEI DLP vaults"""
    
    def __init__(self) -> None:
        """Initialize the liquidity optimizer"""
        # SEI-specific parameters
        self.sei_chain_id = ChainId.SEI_MAINNET
        self.sei_finality_ms = 400
        self.min_tick_spacing = 60
        self.gas_optimization_factor = 0.95
        
        # ML model components
        self.is_trained = False
        self.ml_model: Optional[RandomForestRegressor] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_columns: List[str] = []
        
        # ONNX session for production inference
        self.onnx_session: Optional[ort.InferenceSession] = None
        try:
            # Try to initialize ONNX session if model exists
            self.onnx_session = None  # Will be loaded explicitly
        except Exception as e:
            logger.warning(f"ONNX session initialization failed: {e}")
            self.onnx_session = None
    
    def validate_sei_chain(self) -> bool:
        """Validate that we're operating on a valid SEI chain"""
        try:
            return self.sei_chain_id in [ChainId.SEI_MAINNET, ChainId.SEI_TESTNET, ChainId.SEI_DEVNET]
        except Exception:
            return False
    
    def _extract_market_features(self, market_data: List[MarketData]) -> List[float]:
        """Extract market features for ML model"""
        features = [0.0] * 15  # Fixed length feature vector
        
        if not market_data:
            return features
        
        # Extract features from market data
        sei_data = None
        usdc_data = None
        eth_data = None
        
        for data in market_data:
            if data.symbol == AssetSymbol.SEI:
                sei_data = data
            elif data.symbol == AssetSymbol.USDC:
                usdc_data = data
            elif data.symbol == AssetSymbol.ETH:
                eth_data = data
        
        if sei_data:
            features[0] = float(sei_data.price)
            features[1] = float(sei_data.volume_24h)
            features[2] = float(sei_data.price_change_24h)
            features[3] = sei_data.confidence_score
            features[4] = float(sei_data.funding_rate) if sei_data.funding_rate else 0.0
        
        if usdc_data:
            features[5] = float(usdc_data.price)
            features[6] = float(usdc_data.volume_24h)
        
        if eth_data:
            features[7] = float(eth_data.price)
            features[8] = float(eth_data.volume_24h)
        
        # Additional derived features
        if sei_data and usdc_data:
            features[9] = float(sei_data.price) / float(usdc_data.price)  # SEI/USDC ratio
        
        # Fill remaining features with market-derived metrics
        features[10] = float(len(market_data))  # Number of data points
        features[11] = float(sum(data.confidence_score for data in market_data) / len(market_data)) if market_data else 0.0
        features[12] = float(sum(float(data.volume_24h) for data in market_data) / len(market_data)) if market_data else 0.0
        features[13] = float(sum(float(data.price_change_24h) for data in market_data) / len(market_data)) if market_data else 0.0
        features[14] = float(sum(1 for data in market_data if data.funding_rate and data.funding_rate > 0) / len(market_data)) if market_data else 0.0
        
        return features
    
    def _calculate_volatility_features(self, historical_data: pd.DataFrame) -> Dict[str, float]:
        """Calculate volatility-based features"""
        features = {
            "price_volatility_1h": 0.0,
            "price_volatility_24h": 0.0,
            "volume_volatility_24h": 0.0,
            "funding_rate_volatility": 0.0,
            "cross_correlation": 0.0
        }
        
        if historical_data.empty or 'price' not in historical_data.columns:
            return features
        
        try:
            # Calculate price volatility
            if len(historical_data) > 1:
                returns = historical_data['price'].pct_change().dropna()
                if len(returns) > 0:
                    features["price_volatility_24h"] = float(returns.std())
                    
                    # 1-hour volatility (approximate from available data)
                    if len(returns) > 12:  # At least 1 hour of 5-min data
                        features["price_volatility_1h"] = float(returns.tail(12).std())
            
            # Volume volatility
            if 'volume' in historical_data.columns and len(historical_data) > 1:
                volume_changes = historical_data['volume'].pct_change().dropna()
                if len(volume_changes) > 0:
                    features["volume_volatility_24h"] = float(volume_changes.std())
            
            # Funding rate volatility
            if 'funding_rate' in historical_data.columns and len(historical_data) > 1:
                funding_changes = historical_data['funding_rate'].diff().dropna()
                if len(funding_changes) > 0:
                    features["funding_rate_volatility"] = float(funding_changes.std())
            
            # Cross-correlation between price and volume
            if 'volume' in historical_data.columns and len(historical_data) > 2:
                price_returns = historical_data['price'].pct_change().dropna()
                volume_changes = historical_data['volume'].pct_change().dropna()
                if len(price_returns) > 0 and len(volume_changes) > 0:
                    min_len = min(len(price_returns), len(volume_changes))
                    if min_len > 1:
                        # Convert to numpy arrays to ensure compatibility with corrcoef
                        price_array = np.asarray(price_returns.values[-min_len:], dtype=np.float64)
                        volume_array = np.asarray(volume_changes.values[-min_len:], dtype=np.float64)
                        corr_matrix = np.corrcoef(price_array, volume_array)
                        correlation = corr_matrix[0, 1]
                        features["cross_correlation"] = float(correlation) if not np.isnan(correlation) else 0.0
        except Exception as e:
            logger.warning(f"Error calculating volatility features: {e}")
        
        return features
    
    def _extract_sei_features(self, pool: LiquidityPool, market_data: List[MarketData]) -> List[float]:
        """Extract SEI-specific features"""
        features = [0.0] * 4
        
        # SEI finality advantage factor
        features[0] = 1.0 - (self.sei_finality_ms / 12000.0)  # Compared to 12s average
        
        # Gas efficiency factor
        features[1] = self.gas_optimization_factor
        
        # Pool liquidity utilization
        try:
            if hasattr(pool, 'liquidity') and pool.liquidity and float(pool.liquidity) > 0:
                total_reserves = float(getattr(pool, 'reserve0', 0)) + float(getattr(pool, 'reserve1', 0))
                features[2] = float(total_reserves / float(pool.liquidity))
            else:
                features[2] = 0.0
        except (AttributeError, TypeError, ValueError):
            features[2] = 0.0
        
        # Market depth indicator
        if market_data:
            avg_volume = sum(float(data.volume_24h) for data in market_data) / len(market_data)
            features[3] = min(1.0, avg_volume / 10000000.0)  # Normalize to 10M
        
        return features
    
    def _align_to_tick_spacing(self, price: Decimal, pool: LiquidityPool) -> Decimal:
        """Align price to SEI tick spacing"""
        try:
            tick_spacing = getattr(pool, 'tick_spacing', self.min_tick_spacing)
            price_float = float(price)
            
            # Simple tick alignment
            tick_value = price_float * 10000  # Convert to tick representation
            aligned_tick = round(tick_value / tick_spacing) * tick_spacing
            aligned_price = Decimal(str(aligned_tick / 10000))
            
            return max(aligned_price, Decimal('0.001'))  # Minimum price
        except Exception:
            return price
    
    async def _extract_features(
        self, 
        pool: LiquidityPool, 
        market_data: List[MarketData], 
        historical_data: pd.DataFrame, 
        position_size: Decimal
    ) -> NDArray[np.float64]:
        """Extract complete feature set for ML model"""
        # Market features
        market_features = self._extract_market_features(market_data)
        
        # Volatility features
        volatility_dict = self._calculate_volatility_features(historical_data)
        volatility_features = list(volatility_dict.values())
        
        # SEI-specific features
        sei_features = self._extract_sei_features(pool, market_data)
        
        # Position size feature
        position_features = [float(position_size)]
        
        # Pool features
        pool_features = [
            float(getattr(pool, 'reserve0', 0)),
            float(getattr(pool, 'reserve1', 0)),
            float(getattr(pool, 'fee_tier', 0.003)),
            float(getattr(pool, 'liquidity', 0))
        ]
        
        # Combine all features
        all_features = (
            market_features + 
            volatility_features + 
            sei_features + 
            position_features + 
            pool_features
        )
        
        return np.array([all_features])
    
    async def _predict_statistical(
        self,
        pool: LiquidityPool,
        market_data: List[MarketData],
        historical_data: pd.DataFrame,
        risk_tolerance: float
    ) -> Dict[str, Any]:
        """Statistical fallback prediction method"""
        # Get current price from pool or market data
        current_price = float(pool.price_token0_in_token1) if hasattr(pool, 'price_token0_in_token1') else 1.0
        
        if not current_price and market_data:
            sei_data = next((data for data in market_data if data.symbol == AssetSymbol.SEI), None)
            if sei_data:
                current_price = float(sei_data.price)
        
        if not current_price:
            current_price = 1.0
        
        # Calculate volatility from historical data
        volatility = 0.3  # Default
        if not historical_data.empty and 'price' in historical_data.columns:
            returns = historical_data['price'].pct_change().dropna()
            if len(returns) > 0:
                volatility = float(returns.std())
        
        # Risk-adjusted range calculation
        range_multiplier = 1.0 + (risk_tolerance * volatility)
        lower_price = Decimal(str(current_price * (1 - range_multiplier * 0.1)))
        upper_price = Decimal(str(current_price * (1 + range_multiplier * 0.1)))
        
        confidence = 0.6 if historical_data.empty else min(0.8, 0.4 + len(historical_data) / 1000)
        
        return {
            "lower_price": lower_price,
            "upper_price": upper_price,
            "confidence": confidence,
            "reasoning": "Statistical volatility-based range calculation using historical price data"
        }
    
    def _optimize_for_sei(self, range_prediction: Dict[str, Any], pool: LiquidityPool) -> Dict[str, Any]:
        """Apply SEI-specific optimizations"""
        original_lower = range_prediction["lower_price"]
        original_upper = range_prediction["upper_price"]
        original_range = original_upper - original_lower
        
        # Apply gas optimization (slightly tighter range)
        optimized_range = original_range * Decimal(str(self.gas_optimization_factor))
        
        # Center the optimized range
        center_price = (original_lower + original_upper) / 2
        optimized_lower = center_price - (optimized_range / 2)
        optimized_upper = center_price + (optimized_range / 2)
        
        # Align to tick spacing
        optimized_lower = self._align_to_tick_spacing(optimized_lower, pool)
        optimized_upper = self._align_to_tick_spacing(optimized_upper, pool)
        
        return {
            **range_prediction,
            "lower_price": optimized_lower,
            "upper_price": optimized_upper,
            "reasoning": f"{range_prediction.get('reasoning', '')} Enhanced with SEI gas optimization and tick alignment."
        }
    
    async def _calculate_performance_metrics(
        self,
        range_prediction: Dict[str, Any],
        pool: LiquidityPool,
        market_data: List[MarketData],
        position_size: Decimal
    ) -> Dict[str, float]:
        """Calculate expected performance metrics"""
        try:
            lower_price = range_prediction["lower_price"]
            upper_price = range_prediction["upper_price"]
            range_width = float(upper_price - lower_price)
            
            # Expected fees (simplified calculation)
            volume_24h = sum(float(data.volume_24h) for data in market_data) / len(market_data) if market_data else 0
            fee_rate = pool.fee_tier
            expected_fees = float(Decimal(str(volume_24h * fee_rate * 0.01)))  # Rough estimate
            
            # Impermanent loss risk
            center_price = float((lower_price + upper_price) / 2)
            il_risk = min(0.5, range_width / center_price * 0.2) if center_price > 0 else 0.1
            
            # Capital efficiency
            capital_efficiency = min(1.0, center_price / range_width) if range_width > 0 else 0.5
            
            return {
                "expected_fees": expected_fees,
                "il_risk": il_risk,
                "capital_efficiency": capital_efficiency
            }
        except Exception as e:
            logger.warning(f"Error calculating performance metrics: {e}")
            return {
                "expected_fees": 0.0,
                "il_risk": 0.1,
                "capital_efficiency": 0.5
            }
    
    async def predict_optimal_range(
        self,
        pool: LiquidityPool,
        market_data: List[MarketData],
        historical_data: pd.DataFrame,
        position_size: Decimal,
        risk_tolerance: float = 0.5
    ) -> LiquidityRange:
        """Predict optimal liquidity range"""
        if not self.validate_sei_chain():
            raise ValueError("Invalid chain ID for SEI operations")
        
        try:
            # Try ONNX first, then sklearn, then statistical fallback
            if self.onnx_session is not None:
                features = await self._extract_features(pool, market_data, historical_data, position_size)
                prediction = await self._predict_with_onnx(features)
            elif self.ml_model is not None and self.is_trained:
                features = await self._extract_features(pool, market_data, historical_data, position_size)
                prediction = await self._predict_with_sklearn(features)
            else:
                prediction = await self._predict_statistical(pool, market_data, historical_data, risk_tolerance)
            
            # Apply SEI optimizations
            optimized_prediction = self._optimize_for_sei(prediction, pool)
            
            # Calculate performance metrics
            metrics = await self._calculate_performance_metrics(
                optimized_prediction, pool, market_data, position_size
            )
            
            return LiquidityRange(
                lower_price=optimized_prediction["lower_price"],
                upper_price=optimized_prediction["upper_price"],
                confidence=optimized_prediction["confidence"],
                expected_fees=Decimal(str(metrics["expected_fees"])),
                impermanent_loss_risk=metrics["il_risk"],
                capital_efficiency=metrics["capital_efficiency"],
                reasoning=optimized_prediction["reasoning"]
            )
        
        except Exception as e:
            logger.error(f"Error in predict_optimal_range: {e}")
            raise
    
    async def generate_rebalance_signal(
        self,
        position: Position,
        pool: LiquidityPool,
        market_data: List[MarketData],
        threshold: float = 0.1
    ) -> Optional[TradingSignal]:
        """Generate rebalance signal if needed"""
        try:
            # Validate chain
            if not self.validate_sei_chain():
                raise ValueError("Invalid chain ID")
            
            # Calculate price deviation from entry
            current_price = float(position.current_price)
            entry_price = float(position.entry_price)
            price_change = abs(current_price - entry_price) / entry_price
            
            # Check if rebalance is needed
            if price_change < threshold:
                return None
            
            # Generate rebalance signal
            confidence = min(0.9, price_change / threshold)
            
            return TradingSignal(
                asset=position.asset,
                action="REBALANCE",
                confidence=confidence,
                target_price=position.current_price,
                reasoning=f"Position moved {price_change:.1%} from entry. SEI 400ms finality enables efficient rebalancing.",
                model_version="v1.0.0",
                timestamp=datetime.now(timezone.utc)
            )
        
        except ValueError as e:
            # Re-raise ValueError for chain validation errors
            logger.error(f"Validation error generating rebalance signal: {e}")
            raise
        except Exception as e:
            logger.warning(f"Error generating rebalance signal: {e}")
            return None
    
    def train_model(self, training_data: pd.DataFrame) -> None:
        """Train the ML model"""
        try:
            # Identify feature columns (exclude target columns)
            target_columns = ['lower_bound', 'upper_bound', 'confidence']
            feature_columns = [col for col in training_data.columns if col not in target_columns]
            
            if len(feature_columns) == 0:
                raise ValueError("No feature columns found in training data")
            
            # Extract features and targets
            X = training_data[feature_columns].values
            y = training_data[target_columns].values
            
            # Ensure X is 2D
            if X.ndim == 1:
                X = X.reshape(-1, 1)
            
            # Convert to proper numpy arrays
            X = np.asarray(X, dtype=np.float64)
            y = np.asarray(y, dtype=np.float64)
            
            # Validate data shapes
            if X.shape[0] == 0:
                raise ValueError("Training data cannot be empty")
            if y.shape[0] == 0:
                raise ValueError("Target data cannot be empty")
            if X.shape[0] != y.shape[0]:
                raise ValueError("Features and targets must have the same number of samples")
            
            # Initialize components
            self.scaler = StandardScaler()
            self.ml_model = RandomForestRegressor(n_estimators=100, random_state=42)
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.ml_model.fit(X_scaled, y)
            
            # Store feature columns and mark as trained
            self.feature_columns = feature_columns
            self.is_trained = True
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            raise
    
    async def _predict_with_sklearn(self, features: NDArray[np.float64]) -> Dict[str, Any]:
        """Predict using trained sklearn model"""
        if self.ml_model is None or not self.is_trained:
            raise ValueError("ML model not initialized or not trained")
        
        try:
            # Scale features
            if self.scaler is None:
                raise ValueError("Scaler not initialized")
            features_scaled = self.scaler.transform(features)
            
            # Make prediction
            prediction = self.ml_model.predict(features_scaled)
            pred = prediction[0]  # First (and only) prediction
            
            return {
                "lower_price": Decimal(str(max(0.01, pred[0]))),
                "upper_price": Decimal(str(max(pred[0] + 0.01, pred[1]))),
                "confidence": max(0.1, min(0.9, pred[2])),
                "reasoning": "ML model prediction using trained Random Forest"
            }
        
        except Exception as e:
            logger.error(f"Error in sklearn prediction: {e}")
            raise
    
    def load_onnx_model(self, model_path: str) -> None:
        """Load ONNX model for inference"""
        try:
            self.onnx_session = ort.InferenceSession(model_path)
        except Exception as e:
            logger.error(f"Error loading ONNX model: {e}")
            raise
    
    async def _predict_with_onnx(self, features: NDArray[np.float64]) -> Dict[str, Any]:
        """Predict using ONNX model"""
        if self.onnx_session is None:
            raise ValueError("ONNX session not initialized")
        
        try:
            # Scale features if scaler is available
            if self.scaler is not None:
                features_scaled = self.scaler.transform(features)
            else:
                features_scaled = features
            
            # Get input name
            input_name = self.onnx_session.get_inputs()[0].name
            
            # Run inference
            result = self.onnx_session.run(None, {input_name: features_scaled.astype(np.float32)})
            output_tensor = np.asarray(result[0])
            pred = output_tensor[0]  # First prediction
            
            return {
                "lower_price": Decimal(str(max(0.01, pred[0]))),
                "upper_price": Decimal(str(max(pred[0] + 0.01, pred[1]))),
                "confidence": max(0.1, min(0.9, pred[2])),
                "reasoning": "ONNX model prediction with optimized inference"
            }
        
        except Exception as e:
            logger.error(f"Error in ONNX prediction: {e}")
            raise