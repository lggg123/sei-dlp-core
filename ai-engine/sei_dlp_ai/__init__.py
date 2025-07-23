"""
SEI DLP AI Engine - Core Module

Machine learning-driven liquidity optimization for SEI DLP vaults.
Integrates with ElizaOS for real-time trading and risk management.
"""

__version__ = "0.1.0"
__author__ = "SEI DLP Team"

from .core.engine import SEIDLPEngine
from .models.liquidity_optimizer import LiquidityOptimizer
from .models.risk_manager import RiskManager
from .integrations.elizaos_client import ElizaOSClient

__all__ = [
    "SEIDLPEngine",
    "LiquidityOptimizer", 
    "RiskManager",
    "ElizaOSClient",
]
