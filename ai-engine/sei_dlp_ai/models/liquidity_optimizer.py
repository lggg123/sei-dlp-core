"""Liquidity Optimizer module for SEI DLP"""

import numpy as np
from typing import Dict, Any, Tuple, List
from datetime import datetime
import math

class LiquidityOptimizer:
    """ML-driven liquidity range optimization for SEI DLP vaults"""
    
    def __init__(self):
        self.sei_tick_spacing = 60  # SEI standard tick spacing
        self.model_confidence_threshold = 0.7
        
        # SEI-specific optimization parameters
        self.sei_params = {
            'finality_ms': 400,  # 400ms finality advantage
            'gas_cost_sei': 0.15,  # ~$0.15 gas cost
            'chain_id': 713715,
            'optimal_utilization': 0.75
        }
    
    def optimize_range(self, market_data: Dict[str, Any], vault_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize liquidity range using ML-driven approach
        """
        try:
            current_price = market_data.get('current_price', 0)
            volatility = market_data.get('volatility', 0.3)
            volume_24h = market_data.get('volume_24h', 0)
            liquidity = market_data.get('liquidity', 0)
            
            # Current vault position
            current_tick = vault_state.get('current_tick', 0)
            utilization_rate = vault_state.get('utilization_rate', 0.5)
            
            # ML-based range prediction
            optimal_range = self._predict_optimal_range(
                current_price, volatility, volume_24h, liquidity
            )
            
            # SEI-specific optimizations
            sei_optimized_range = self._apply_sei_optimizations(optimal_range, current_tick)
            
            # Calculate expected performance metrics
            performance_metrics = self._calculate_performance_metrics(
                sei_optimized_range, market_data, vault_state
            )
            
            return {
                'recommended_range': {
                    'lower_tick': sei_optimized_range['lower_tick'],
                    'upper_tick': sei_optimized_range['upper_tick'],
                    'lower_price': sei_optimized_range['lower_price'],
                    'upper_price': sei_optimized_range['upper_price'],
                },
                'performance_forecast': performance_metrics,
                'confidence_score': sei_optimized_range['confidence'],
                'optimization_factors': {
                    'volatility_adjustment': sei_optimized_range['volatility_factor'],
                    'volume_weighting': sei_optimized_range['volume_factor'],
                    'liquidity_consideration': sei_optimized_range['liquidity_factor'],
                    'sei_finality_advantage': True
                },
                'execution_plan': self._generate_execution_plan(sei_optimized_range),
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'error': f'Range optimization failed: {str(e)}',
                'recommended_range': self._fallback_range(market_data),
                'confidence_score': 0.3
            }
    
    def _predict_optimal_range(self, price: float, volatility: float, volume: float, liquidity: float) -> Dict[str, Any]:
        """
        Core ML prediction logic for optimal range
        """
        # Volatility-based range calculation
        volatility_factor = min(volatility, 1.0)
        base_range_width = price * volatility_factor * 0.2  # 20% of price * volatility
        
        # Volume adjustment - higher volume = tighter ranges for more fees
        volume_factor = min(volume / 1000000, 2.0)  # Normalize to millions
        volume_adjusted_width = base_range_width * (1 + volume_factor * 0.1)
        
        # Liquidity consideration - lower liquidity = wider ranges for safety
        liquidity_factor = max(0.5, min(liquidity / 10000000, 2.0))  # Normalize to 10M
        final_range_width = volume_adjusted_width * liquidity_factor
        
        # Calculate price bounds
        lower_price = price - (final_range_width * 0.5)
        upper_price = price + (final_range_width * 0.5)
        
        # Convert to ticks (simplified conversion)
        price_to_tick_multiplier = 10000  # Simplified conversion factor
        lower_tick = int((lower_price * price_to_tick_multiplier) / self.sei_tick_spacing) * self.sei_tick_spacing
        upper_tick = int((upper_price * price_to_tick_multiplier) / self.sei_tick_spacing) * self.sei_tick_spacing
        
        # Confidence based on data quality and market conditions
        confidence = self._calculate_prediction_confidence(volatility, volume, liquidity)
        
        return {
            'lower_tick': lower_tick,
            'upper_tick': upper_tick,
            'lower_price': lower_tick / price_to_tick_multiplier,
            'upper_price': upper_tick / price_to_tick_multiplier,
            'confidence': confidence,
            'volatility_factor': volatility_factor,
            'volume_factor': volume_factor,
            'liquidity_factor': liquidity_factor
        }
    
    def _apply_sei_optimizations(self, base_range: Dict[str, Any], current_tick: int) -> Dict[str, Any]:
        """
        Apply SEI-specific optimizations leveraging 400ms finality
        """
        # SEI allows for more frequent rebalancing due to fast finality
        # This means we can use slightly tighter ranges with confidence
        sei_tightening_factor = 0.95  # 5% tighter than other chains
        
        range_width = base_range['upper_tick'] - base_range['lower_tick']
        optimized_width = int(range_width * sei_tightening_factor)
        
        # Ensure minimum viable range
        min_range_width = self.sei_tick_spacing * 10  # Minimum 10 tick spacings
        optimized_width = max(optimized_width, min_range_width)
        
        # Center around current price/tick with slight bias based on trend
        center_tick = current_tick  # Could add trend bias here
        
        optimized_lower = center_tick - (optimized_width // 2)
        optimized_upper = center_tick + (optimized_width // 2)
        
        # Align to tick spacing
        optimized_lower = (optimized_lower // self.sei_tick_spacing) * self.sei_tick_spacing
        optimized_upper = (optimized_upper // self.sei_tick_spacing) * self.sei_tick_spacing
        
        return {
            **base_range,
            'lower_tick': optimized_lower,
            'upper_tick': optimized_upper,
            'lower_price': optimized_lower / 10000,  # Convert back
            'upper_price': optimized_upper / 10000,
            'sei_optimized': True
        }
    
    def _calculate_performance_metrics(self, range_data: Dict[str, Any], market_data: Dict[str, Any], vault_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate expected performance metrics for the optimized range
        """
        # Fee APR estimation based on range width and volume
        range_width = range_data['upper_price'] - range_data['lower_price']
        price = market_data.get('current_price', range_data['lower_price'] + range_width/2)
        volume_24h = market_data.get('volume_24h', 0)
        
        # Capital efficiency - narrower ranges = higher efficiency
        capital_efficiency = min(2.0, price / range_width) if range_width > 0 else 1.0
        
        # Fee capture rate - estimated based on range vs price volatility
        volatility = market_data.get('volatility', 0.3)
        fee_capture_rate = min(0.9, (range_width / price) / volatility) if volatility > 0 else 0.5
        
        # APR estimation (simplified)
        base_fee_rate = 0.003  # 0.3% fee tier
        volume_factor = min(volume_24h / 10000000, 1.0)  # Normalize volume
        estimated_apr = base_fee_rate * volume_factor * fee_capture_rate * capital_efficiency * 365
        
        # Impermanent loss risk
        il_risk = self._estimate_il_risk(range_width, price, volatility)
        
        # Net APR (APR - IL risk)
        net_apr = max(0, estimated_apr - il_risk)
        
        return {
            'estimated_apr': estimated_apr,
            'capital_efficiency': capital_efficiency,
            'fee_capture_rate': fee_capture_rate,
            'impermanent_loss_risk': il_risk,
            'net_apr': net_apr,
            'rebalance_frequency_estimate': self._estimate_rebalance_frequency(volatility),
            'sei_gas_cost_annual': self._estimate_annual_gas_costs(volatility)
        }
    
    def _calculate_prediction_confidence(self, volatility: float, volume: float, liquidity: float) -> float:
        """Calculate confidence score for the prediction"""
        # Higher confidence with:
        # - Moderate volatility (not too high/low)
        # - Good volume data
        # - Sufficient liquidity
        
        vol_score = 1.0 - abs(volatility - 0.3) / 0.7  # Optimal around 30% volatility
        volume_score = min(volume / 1000000, 1.0)  # Good volume = higher confidence
        liq_score = min(liquidity / 5000000, 1.0)  # Sufficient liquidity
        
        confidence = (vol_score * 0.4 + volume_score * 0.3 + liq_score * 0.3)
        return max(0.1, min(0.95, confidence))
    
    def _estimate_il_risk(self, range_width: float, price: float, volatility: float) -> float:
        """Estimate impermanent loss risk for the range"""
        if price == 0:
            return 0.05  # Default 5% IL risk
        
        range_ratio = range_width / price
        # Wider ranges = lower IL risk, higher volatility = higher IL risk
        il_risk = (volatility * 0.1) / (range_ratio + 0.1)
        return min(0.2, il_risk)  # Cap at 20% IL risk
    
    def _estimate_rebalance_frequency(self, volatility: float) -> str:
        """Estimate how often rebalancing will be needed"""
        if volatility < 0.2:
            return "weekly"
        elif volatility < 0.5:
            return "every_few_days"
        else:
            return "daily"
    
    def _estimate_annual_gas_costs(self, volatility: float) -> float:
        """Estimate annual gas costs for rebalancing on SEI"""
        if volatility < 0.2:
            rebalances_per_year = 52  # Weekly
        elif volatility < 0.5:
            rebalances_per_year = 120  # Every few days
        else:
            rebalances_per_year = 365  # Daily
        
        return rebalances_per_year * self.sei_params['gas_cost_sei']
    
    def _generate_execution_plan(self, range_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate execution plan for the optimization"""
        return {
            'immediate_action_required': range_data['confidence'] > 0.8,
            'optimal_execution_time': 'immediate' if range_data['confidence'] > 0.8 else 'next_hour',
            'gas_estimate_sei': self.sei_params['gas_cost_sei'],
            'estimated_execution_time': '400ms',  # SEI finality
            'slippage_tolerance_recommended': 0.005,  # 0.5%
            'sei_advantages': [
                '400ms finality for rapid execution',
                'Low gas costs (~$0.15)',
                'High frequency rebalancing feasible'
            ]
        }
    
    def _fallback_range(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback range calculation if main optimization fails"""
        price = market_data.get('current_price', 100)
        # Conservative 10% range around current price
        return {
            'lower_tick': int((price * 0.9) * 10000),
            'upper_tick': int((price * 1.1) * 10000),
            'lower_price': price * 0.9,
            'upper_price': price * 1.1,
        }
