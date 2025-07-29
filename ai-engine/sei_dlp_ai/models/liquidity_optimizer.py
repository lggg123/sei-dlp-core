"""
Liquidity Optimizer - ML Model for SEI DLP

Provides AI-driven price range optimization for concentrated liquidity positions.
Integrates with your ElizaOS infrastructure for real-time decision making.

Based on SEI-specific patterns from copilot instructions:
- SEI chain ID validation (713715)
- 400ms finality optimization
- Cross-protocol yield aggregation
"""

import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Optional, Tuple, Any
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import onnxruntime as ort
from pydantic import BaseModel

from ..types import (
    MarketData, LiquidityPool, Position, AssetSymbol,
    TradingSignal, ChainId
)

logger = logging.getLogger(__name__)


class LiquidityRange(BaseModel):
    """Optimal liquidity range recommendation"""
    lower_price: Decimal
    upper_price: Decimal
    confidence: float
    expected_fees: Decimal
    impermanent_loss_risk: float
    capital_efficiency: float
    reasoning: str


class VolatilityFeatures(BaseModel):
    """Volatility-based features for ML model"""
    price_volatility_1h: float
    price_volatility_24h: float
    volume_volatility_24h: float
    funding_rate_volatility: float
    cross_correlation: float


class LiquidityOptimizer:
    """
    AI-driven liquidity optimization for SEI DLP vaults
    
    Implements machine learning models to optimize concentrated liquidity ranges
    for maximum yield while minimizing impermanent loss and optimizing for SEI's
    400ms finality.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.scaler = StandardScaler()
        self.ml_model: Optional[RandomForestRegressor] = None
        self.onnx_session: Optional[ort.InferenceSession] = None
        self.feature_columns: List[str] = []
        self.is_trained = False
        self.sei_chain_id = ChainId.SEI_MAINNET
        
        # SEI-specific optimization parameters
        self.sei_finality_ms = 400
        self.min_tick_spacing = 60  # SEI concentrated liquidity tick spacing
        self.gas_optimization_factor = 0.95  # SEI gas efficiency
        
    def validate_sei_chain(self) -> bool:
        """Validate SEI chain ID as per copilot instructions"""
        return self.sei_chain_id == ChainId.SEI_MAINNET
        
    async def predict_optimal_range(
        self,
        pool: LiquidityPool,
        market_data: List[MarketData],
        historical_data: pd.DataFrame,
        position_size: Decimal,
        risk_tolerance: float = 0.5
    ) -> LiquidityRange:
        """
        Predict optimal liquidity range using ML models
        
        SEI-specific optimizations:
        - 400ms finality consideration for rebalancing frequency
        - Cross-protocol yield aggregation
        - Gas-optimized range calculations
        """
        if not self.validate_sei_chain():
            raise ValueError(f"Invalid chain ID. Expected {ChainId.SEI_MAINNET}")
            
        try:
            # Extract features from market data and pool state
            features = await self._extract_features(
                pool, market_data, historical_data, position_size
            )
            
            # Generate predictions using ML model
            if self.onnx_session:
                range_prediction = await self._predict_with_onnx(features)
            elif self.ml_model:
                range_prediction = await self._predict_with_sklearn(features)
            else:
                # Fallback to statistical approach
                range_prediction = await self._predict_statistical(
                    pool, market_data, historical_data, risk_tolerance
                )
                
            # Apply SEI-specific optimizations
            optimized_range = self._optimize_for_sei(range_prediction, pool)
            
            # Calculate performance metrics
            performance_metrics = await self._calculate_performance_metrics(
                optimized_range, pool, market_data, position_size
            )
            
            return LiquidityRange(
                lower_price=optimized_range["lower_price"],
                upper_price=optimized_range["upper_price"],
                confidence=optimized_range["confidence"],
                expected_fees=performance_metrics["expected_fees"],
                impermanent_loss_risk=performance_metrics["il_risk"],
                capital_efficiency=performance_metrics["capital_efficiency"],
                reasoning=optimized_range["reasoning"]
            )
            
        except Exception as e:
            logger.error(f"Failed to predict optimal range: {e}")
            raise
            
    async def _extract_features(
        self,
        pool: LiquidityPool,
        market_data: List[MarketData],
        historical_data: pd.DataFrame,
        position_size: Decimal
    ) -> np.ndarray:
        """Extract ML features from market data"""
        
        # Current pool state features
        current_price = pool.price_token0_in_token1
        pool_liquidity = float(pool.liquidity)
        fee_tier = pool.fee_tier
        
        # Market data features
        market_features = self._extract_market_features(market_data)
        
        # Historical volatility features
        volatility_features = self._calculate_volatility_features(historical_data)
        
        # SEI-specific features
        sei_features = self._extract_sei_features(pool, market_data)
        
        # Position size impact
        position_impact = float(position_size) / pool_liquidity if pool_liquidity > 0 else 0
        
        # Combine all features
        feature_vector = np.array([
            float(current_price),
            pool_liquidity,
            fee_tier,
            position_impact,
            *market_features,
            *volatility_features.values(),
            *sei_features
        ])
        
        return feature_vector.reshape(1, -1)
        
    def _extract_market_features(self, market_data: List[MarketData]) -> List[float]:
        """Extract features from current market data"""
        features = []
        
        for data in market_data:
            features.extend([
                float(data.price),
                float(data.volume_24h),
                float(data.price_change_24h),
                data.confidence_score,
                float(data.funding_rate) if data.funding_rate else 0.0
            ])
            
        # Pad with zeros if insufficient data
        while len(features) < 15:  # Expect up to 3 assets * 5 features
            features.append(0.0)
            
        return features[:15]  # Limit to prevent variable feature count
        
    def _calculate_volatility_features(self, historical_data: pd.DataFrame) -> Dict[str, float]:
        """Calculate volatility-based features"""
        if historical_data.empty:
            return {
                "price_volatility_1h": 0.0,
                "price_volatility_24h": 0.0,
                "volume_volatility_24h": 0.0,
                "funding_rate_volatility": 0.0,
                "cross_correlation": 0.0
            }
            
        # Calculate rolling volatilities
        price_1h_vol = historical_data["price"].rolling(12).std().iloc[-1] or 0.0  # 5min intervals
        price_24h_vol = historical_data["price"].rolling(288).std().iloc[-1] or 0.0  # 5min intervals
        volume_24h_vol = historical_data["volume"].rolling(288).std().iloc[-1] or 0.0
        
        # Funding rate volatility if available
        funding_vol = 0.0
        if "funding_rate" in historical_data.columns:
            funding_vol = historical_data["funding_rate"].rolling(24).std().iloc[-1] or 0.0
            
        # Cross-correlation between price and volume
        cross_corr = 0.0
        if len(historical_data) > 10:
            cross_corr = historical_data["price"].corr(historical_data["volume"]) or 0.0
            
        return {
            "price_volatility_1h": float(price_1h_vol),
            "price_volatility_24h": float(price_24h_vol),
            "volume_volatility_24h": float(volume_24h_vol),
            "funding_rate_volatility": float(funding_vol),
            "cross_correlation": float(cross_corr)
        }
        
    def _extract_sei_features(self, pool: LiquidityPool, market_data: List[MarketData]) -> List[float]:
        """Extract SEI-specific features for optimization"""
        
        # SEI finality advantage (faster rebalancing)
        finality_factor = 1.0 - (self.sei_finality_ms / 12000)  # vs 12s Ethereum
        
        # Gas efficiency on SEI
        gas_efficiency = self.gas_optimization_factor
        
        # Cross-protocol yield opportunities
        cross_protocol_yield = 0.0
        sei_market_data = next((d for d in market_data if d.symbol == AssetSymbol.SEI), None)
        if sei_market_data and sei_market_data.funding_rate:
            cross_protocol_yield = float(sei_market_data.funding_rate)
            
        # Liquidity concentration efficiency
        concentration_efficiency = min(float(pool.liquidity) / 1000000, 1.0)  # Normalize to 1M
        
        return [
            finality_factor,
            gas_efficiency,
            cross_protocol_yield,
            concentration_efficiency
        ]
        
    async def _predict_with_onnx(self, features: np.ndarray) -> Dict[str, Any]:
        """Make predictions using ONNX model"""
        if not self.onnx_session:
            raise ValueError("ONNX session not initialized")
            
        try:
            # Normalize features
            features_scaled = self.scaler.transform(features)
            
            # Run inference
            input_name = self.onnx_session.get_inputs()[0].name
            outputs = self.onnx_session.run(None, {input_name: features_scaled.astype(np.float32)})

            output_arr = outputs[0]
            
            # Convert ONNX output to numpy array with proper type handling
            final_output: np.ndarray
            
            # Handle SparseTensor type if available
            try:
                from onnxruntime.capi.onnxruntime_pybind11_state import SparseTensor
                
                # Use hasattr to check for to_dense method instead of isinstance
                if hasattr(output_arr, 'to_dense') and callable(getattr(output_arr, 'to_dense')):
                    # Handle SparseTensor or any object with to_dense method
                    try:
                        dense_output = output_arr.to_dense()  # type: ignore
                        final_output = np.array(dense_output)
                    except Exception as dense_error:
                        logger.warning(f"Failed to call to_dense(): {dense_error}")
                        final_output = np.array(output_arr)
                elif isinstance(output_arr, (list, tuple)):
                    # Convert lists/tuples to numpy arrays
                    final_output = np.array(output_arr)
                elif isinstance(output_arr, np.ndarray):
                    # Already a numpy array
                    final_output = output_arr
                else:
                    # Fallback: try to convert to numpy array
                    final_output = np.array(output_arr)
            except ImportError:
                # onnxruntime SparseTensor not available, handle other types
                if isinstance(output_arr, (list, tuple)):
                    final_output = np.array(output_arr)
                elif isinstance(output_arr, np.ndarray):
                    final_output = output_arr
                else:
                    final_output = np.array(output_arr)
            except Exception as e:
                logger.warning(f"Failed to process ONNX output type {type(output_arr)}: {e}")
                # Fallback: try direct numpy conversion
                final_output = np.array(output_arr)

            # Ensure we have a valid numpy array with expected shape
            if not isinstance(final_output, np.ndarray):
                raise ValueError(f"Failed to convert ONNX output to numpy array, got {type(final_output)}")
            
            if final_output.size == 0:
                raise ValueError("ONNX output is empty")

            # Parse outputs: [lower_bound, upper_bound, confidence]
            if final_output.ndim == 1:
                if len(final_output) < 3:
                    raise ValueError(f"Expected at least 3 output values, got {len(final_output)}")
                lower_bound, upper_bound, confidence = final_output[0], final_output[1], final_output[2]
            elif final_output.ndim == 2:
                if final_output.shape[1] < 3:
                    raise ValueError(f"Expected at least 3 output values, got {final_output.shape[1]}")
                lower_bound, upper_bound, confidence = final_output[0][0], final_output[0][1], final_output[0][2]
            else:
                raise ValueError(f"Unexpected ONNX output shape: {final_output.shape}")

            return {
                "lower_price": Decimal(str(float(lower_bound))),
                "upper_price": Decimal(str(float(upper_bound))),
                "confidence": float(confidence),
                "reasoning": f"ONNX model prediction with confidence {confidence:.2f}"
            }

        except Exception as e:
            logger.error(f"ONNX prediction failed: {e}")
            raise
            
    async def _predict_with_sklearn(self, features: np.ndarray) -> Dict[str, Any]:
        """Make predictions using scikit-learn model"""
        if not self.ml_model:
            raise ValueError("ML model not initialized")
            
        try:
            # Normalize features
            features_scaled = self.scaler.transform(features)
            
            # Predict range bounds
            prediction = self.ml_model.predict(features_scaled)
            
            # Extract bounds and calculate confidence
            lower_bound, upper_bound = prediction[0][:2]
            confidence = min(0.9, max(0.1, prediction[0][2] if len(prediction[0]) > 2 else 0.7))
            
            return {
                "lower_price": Decimal(str(float(lower_bound))),
                "upper_price": Decimal(str(float(upper_bound))),
                "confidence": float(confidence),
                "reasoning": f"Random Forest prediction with {confidence:.2f} confidence"
            }
            
        except Exception as e:
            logger.error(f"Sklearn prediction failed: {e}")
            raise
            
    async def _predict_statistical(
        self,
        pool: LiquidityPool,
        market_data: List[MarketData],
        historical_data: pd.DataFrame,
        risk_tolerance: float
    ) -> Dict[str, Any]:
        """
        Fallback statistical prediction method
        
        Uses volatility-based range calculation with SEI-specific adjustments
        """
        current_price = pool.price_token0_in_token1
        
        # Calculate volatility from historical data
        if not historical_data.empty and "price" in historical_data.columns:
            volatility = historical_data["price"].pct_change().std() * np.sqrt(288)  # 24h vol
        else:
            # Fallback to market data volatility
            volatility = 0.02  # 2% default
            
        # Adjust for risk tolerance
        range_multiplier = 1.0 + (1.0 - risk_tolerance)  # Higher risk = tighter range
        
        # SEI-specific volatility scaling (400ms finality allows tighter ranges)
        sei_volatility_reduction = 0.85  # 15% reduction due to fast finality
        adjusted_volatility = volatility * sei_volatility_reduction * range_multiplier
        
        # Calculate bounds (convert to Decimal for arithmetic)
        vol_factor = Decimal(str(adjusted_volatility))
        lower_bound = current_price * (Decimal('1') - vol_factor)
        upper_bound = current_price * (Decimal('1') + vol_factor)
        
        # Ensure lower bound is always positive
        if lower_bound <= 0:
            lower_bound = current_price * Decimal('0.1')  # Minimum 10% of current price
        
        # Ensure minimum range for fee collection (5% minimum)
        min_range = current_price * Decimal('0.05')
        if upper_bound - lower_bound < min_range:
            center = (upper_bound + lower_bound) / Decimal('2')
            lower_bound = center - min_range / Decimal('2')
            upper_bound = center + min_range / Decimal('2')
            
            # Double-check lower bound is still positive after adjustment
            if lower_bound <= 0:
                lower_bound = current_price * Decimal('0.05')
                upper_bound = lower_bound + min_range
            
        confidence = 0.6  # Statistical method has moderate confidence
        
        return {
            "lower_price": lower_bound,
            "upper_price": upper_bound,
            "confidence": confidence,
            "reasoning": f"Statistical volatility-based range with {adjusted_volatility:.1%} band"
        }
        
    def _optimize_for_sei(
        self, 
        range_prediction: Dict[str, Any], 
        pool: LiquidityPool
    ) -> Dict[str, Any]:
        """Apply SEI-specific optimizations to range prediction"""
        
        lower_price = range_prediction["lower_price"]
        upper_price = range_prediction["upper_price"]
        
        # Align with SEI tick spacing for gas efficiency
        lower_price = self._align_to_tick_spacing(lower_price, pool)
        upper_price = self._align_to_tick_spacing(upper_price, pool)
        
        # Apply gas optimization factor (convert to Decimal)
        range_width = upper_price - lower_price
        optimized_width = range_width * Decimal(str(self.gas_optimization_factor))
        center_price = (upper_price + lower_price) / Decimal('2')
        
        optimized_lower = center_price - optimized_width / Decimal('2')
        optimized_upper = center_price + optimized_width / Decimal('2')
        
        return {
            **range_prediction,
            "lower_price": optimized_lower,
            "upper_price": optimized_upper,
            "reasoning": f"{range_prediction['reasoning']} + SEI gas optimization"
        }
        
    def _align_to_tick_spacing(self, price: Decimal, pool: LiquidityPool) -> Decimal:
        """Align price to SEI tick spacing for optimal gas usage"""
        # Convert price to tick
        tick = int(np.log(float(price)) / np.log(1.0001))
        
        # Align to tick spacing
        aligned_tick = (tick // self.min_tick_spacing) * self.min_tick_spacing
        
        # Convert back to price
        aligned_price = Decimal(str(1.0001 ** aligned_tick))
        
        return aligned_price
        
    async def _calculate_performance_metrics(
        self,
        range_prediction: Dict[str, Any],
        pool: LiquidityPool,
        market_data: List[MarketData],
        position_size: Decimal
    ) -> Dict[str, Any]:
        """Calculate expected performance metrics for the range"""
        
        lower_price = range_prediction["lower_price"]
        upper_price = range_prediction["upper_price"]
        current_price = pool.price_token0_in_token1
        
        # Expected fees based on range width and volume
        range_width_pct = float((upper_price - lower_price) / current_price)
        volume_24h = sum(float(md.volume_24h) for md in market_data) / len(market_data)
        
        # Fee estimation (tighter ranges capture more fees)
        base_fee_rate = pool.fee_tier
        concentration_multiplier = min(5.0, 0.1 / range_width_pct)  # Concentration bonus
        expected_fee_rate = Decimal(str(base_fee_rate)) * Decimal(str(concentration_multiplier))
        expected_fees = Decimal(str(volume_24h)) * expected_fee_rate / 365  # Daily fees
        
        # Impermanent loss risk (based on range width)
        il_risk = min(0.5, range_width_pct * 2)  # Wider range = higher IL risk
        
        # Capital efficiency (how much of capital is active)
        if current_price <= lower_price or current_price >= upper_price:
            capital_efficiency = 0.0  # Out of range
        else:
            # Calculate active capital ratio
            capital_efficiency = min(1.0, 1.0 / range_width_pct)
            
        return {
            "expected_fees": expected_fees * position_size / Decimal("1000"),  # Scale to position
            "il_risk": il_risk,
            "capital_efficiency": capital_efficiency
        }
        
    async def generate_rebalance_signal(
        self,
        current_position: Position,
        pool: LiquidityPool,
        market_data: List[MarketData],
        threshold: float = 0.1
    ) -> Optional[TradingSignal]:
        """
        Generate rebalancing signal for existing position
        
        SEI's 400ms finality enables frequent rebalancing with low cost
        """
        if not self.validate_sei_chain():
            raise ValueError(f"Invalid chain ID. Expected {ChainId.SEI_MAINNET}")
            
        current_price = pool.price_token0_in_token1
        
        # Check if position is still in optimal range
        # For now, use a simple threshold-based approach
        price_change = abs(float(current_price - current_position.entry_price)) / float(current_position.entry_price)
        
        if price_change > threshold:
            # Generate rebalance signal
            signal = TradingSignal(
                asset=current_position.asset,
                action="REBALANCE",  # Custom action for rebalancing
                confidence=min(0.9, price_change * 2),  # Higher price change = higher confidence
                target_price=current_price,
                reasoning=f"Position drift {price_change:.1%} exceeds threshold {threshold:.1%}. SEI's 400ms finality enables cost-effective rebalancing.",
                model_version="statistical_v1.0",
                timestamp=datetime.now(timezone.utc)
            )
            
            return signal
            
        return None
        
    def load_onnx_model(self, model_path: str) -> None:
        """Load ONNX model for inference"""
        try:
            self.onnx_session = ort.InferenceSession(model_path)
            logger.info(f"ONNX model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load ONNX model: {e}")
            raise
            
    def train_model(self, training_data: pd.DataFrame) -> None:
        """Train the ML model on historical data"""
        try:
            # Prepare features and targets
            feature_columns = [col for col in training_data.columns if col.startswith('feature_')]
            if not feature_columns:
                raise ValueError("No feature columns found. Feature columns should start with 'feature_'")
                
            X = training_data[feature_columns].values
            y = training_data[['lower_bound', 'upper_bound', 'confidence']].values
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.ml_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.ml_model.fit(X_scaled, y)
            
            self.feature_columns = feature_columns
            self.is_trained = True
            
            logger.info("ML model trained successfully")
            
        except Exception as e:
            logger.error(f"Model training failed: {e}")
            raise
