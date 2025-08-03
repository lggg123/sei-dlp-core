"""Risk Manager module for SEI DLP"""

import numpy as np
from typing import Dict, Any, List
from datetime import datetime

class RiskManager:
    """Risk management for SEI DLP vaults"""
    
    def __init__(self):
        self.risk_thresholds = {
            'impermanent_loss': 0.05,  # 5% max IL
            'volatility': 0.8,         # 80% max volatility
            'concentration': 0.7,      # 70% max concentration
            'liquidity_depth': 10000   # Min $10k liquidity
        }
    
    def assess_vault_risk(self, vault_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess overall risk for a vault position
        """
        try:
            # Calculate individual risk components
            il_risk = self._calculate_impermanent_loss_risk(vault_data)
            volatility_risk = self._calculate_volatility_risk(vault_data)
            liquidity_risk = self._calculate_liquidity_risk(vault_data)
            concentration_risk = self._calculate_concentration_risk(vault_data)
            
            # Aggregate risk score (weighted average)
            weights = {'il': 0.3, 'volatility': 0.25, 'liquidity': 0.25, 'concentration': 0.2}
            
            overall_risk = (
                il_risk * weights['il'] +
                volatility_risk * weights['volatility'] +
                liquidity_risk * weights['liquidity'] +
                concentration_risk * weights['concentration']
            )
            
            # Risk level classification
            if overall_risk < 0.3:
                risk_level = 'low'
            elif overall_risk < 0.6:
                risk_level = 'medium'
            else:
                risk_level = 'high'
            
            return {
                'overall_risk_score': overall_risk,
                'risk_level': risk_level,
                'components': {
                    'impermanent_loss_risk': il_risk,
                    'volatility_risk': volatility_risk,
                    'liquidity_risk': liquidity_risk,
                    'concentration_risk': concentration_risk
                },
                'recommendations': self._generate_risk_recommendations(overall_risk, risk_level),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': f'Risk assessment failed: {str(e)}',
                'overall_risk_score': 0.5,  # Default to medium risk
                'risk_level': 'unknown'
            }

    def _calculate_impermanent_loss_risk(self, vault_data: Dict[str, Any]) -> float:
        """Calculate impermanent loss risk based on price correlation and volatility"""
        try:
            volatility = vault_data.get('volatility', 0.3)
            correlation = vault_data.get('correlation', 0.5)  # Asset correlation
            
            # Higher volatility and lower correlation = higher IL risk
            il_risk = (volatility * (1 - correlation)) * 1.5
            return min(il_risk, 1.0)
        except:
            return 0.4  # Default medium IL risk

    def _calculate_volatility_risk(self, vault_data: Dict[str, Any]) -> float:
        """Calculate volatility-based risk"""
        try:
            volatility = vault_data.get('volatility', 0.3)
            return min(volatility / self.risk_thresholds['volatility'], 1.0)
        except:
            return 0.3  # Default medium volatility risk

    def _calculate_liquidity_risk(self, vault_data: Dict[str, Any]) -> float:
        """Calculate liquidity depth risk"""
        try:
            liquidity = vault_data.get('liquidity', 0)
            if liquidity < self.risk_thresholds['liquidity_depth']:
                return 0.8  # High risk for low liquidity
            elif liquidity < self.risk_thresholds['liquidity_depth'] * 5:
                return 0.4  # Medium risk
            else:
                return 0.1  # Low risk for high liquidity
        except:
            return 0.5  # Default medium liquidity risk

    def _calculate_concentration_risk(self, vault_data: Dict[str, Any]) -> float:
        """Calculate concentration risk based on position size vs total pool"""
        try:
            position_size = vault_data.get('position_size', 0)
            total_pool_size = vault_data.get('total_pool_size', 1)
            
            concentration = position_size / total_pool_size if total_pool_size > 0 else 0
            return min(concentration / self.risk_thresholds['concentration'], 1.0)
        except:
            return 0.2  # Default low concentration risk

    def _generate_risk_recommendations(self, risk_score: float, risk_level: str) -> List[str]:
        """Generate risk mitigation recommendations"""
        recommendations = []
        
        if risk_level == 'high':
            recommendations.extend([
                'Consider reducing position size to limit exposure',
                'Implement tighter stop-loss mechanisms',
                'Increase rebalancing frequency to minimize IL',
                'Consider hedging strategies using perp futures'
            ])
        elif risk_level == 'medium':
            recommendations.extend([
                'Monitor position closely for volatility spikes',
                'Consider partial position reduction if conditions worsen',
                'Maintain regular rebalancing schedule'
            ])
        else:  # low risk
            recommendations.extend([
                'Current position within acceptable risk parameters',
                'Continue monitoring market conditions',
                'Consider position size increase if opportunities arise'
            ])
        
        # SEI-specific recommendations
        recommendations.append('Leverage SEI\'s 400ms finality for rapid risk response')
        
        return recommendations
