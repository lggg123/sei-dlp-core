"""
Data types for SEI DLP AI Engine

These types mirror the ElizaOS TypeScript interfaces for seamless integration.
Based on your yield delta st    action: str = Field(..., pattern=r"^(BUY|SELL|HOLD|REBALANCE)$")ategy system architecture.
"""

from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator, ConfigDict


class ChainId(str, Enum):
    """SEI Chain identifiers"""
    SEI_MAINNET = "713715"
    SEI_TESTNET = "713716" 
    SEI_DEVNET = "713717"


class AssetSymbol(str, Enum):
    """Supported asset symbols"""
    SEI = "SEI"
    USDC = "USDC" 
    ETH = "ETH"
    BTC = "BTC"
    ATOM = "ATOM"
    OSMO = "OSMO"


class RiskLevel(str, Enum):
    """Risk level classifications"""
    LOW = "Low"
    MEDIUM = "Medium" 
    HIGH = "High"


class StrategyType(str, Enum):
    """Portfolio strategy types"""
    CONSERVATIVE = "Conservative"
    BALANCED = "Balanced"
    AGGRESSIVE = "Aggressive"
    YIELD_FOCUSED = "YieldFocused"


class MarketData(BaseModel):
    """Market data from SEI Oracle Provider"""
    symbol: AssetSymbol
    price: Decimal = Field(..., gt=0)
    volume_24h: Decimal = Field(..., ge=0)
    price_change_24h: Decimal
    funding_rate: Optional[Decimal] = None
    confidence_score: float = Field(..., ge=0, le=1)
    timestamp: datetime
    source: str = Field(..., description="Data source (pyth, chainlink, etc)")

    @field_validator('price', 'volume_24h', mode='before')
    @classmethod
    def validate_decimals(cls, v):
        return Decimal(str(v))


class Position(BaseModel):
    """Trading position data"""
    asset: AssetSymbol
    size: Decimal
    entry_price: Decimal
    current_price: Decimal
    unrealized_pnl: Decimal
    leverage: Optional[float] = Field(None, ge=1, le=10)
    liquidation_price: Optional[Decimal] = None
    timestamp: datetime

    @property
    def value_usd(self) -> Decimal:
        return self.size * self.current_price


class LiquidityPool(BaseModel):
    """Liquidity pool information"""
    address: str = Field(..., description="Pool contract address")
    token0: AssetSymbol
    token1: AssetSymbol
    reserve0: Decimal = Field(..., ge=0)
    reserve1: Decimal = Field(..., ge=0)
    fee_tier: float = Field(..., ge=0, le=1)
    liquidity: Decimal = Field(..., ge=0)
    sqrt_price_x96: int
    tick: int
    timestamp: datetime

    @property
    def price_token0_in_token1(self) -> Decimal:
        """Price of token0 in terms of token1"""
        if self.reserve1 == 0:
            return Decimal('0')
        return self.reserve0 / self.reserve1


class ArbitrageOpportunity(BaseModel):
    """Funding rate arbitrage opportunity"""
    asset: AssetSymbol
    exchanges: List[str] = Field(...)
    funding_rates: Dict[str, Decimal]
    spread: Decimal = Field(..., description="Spread between highest and lowest rates")
    potential_profit: Decimal = Field(..., ge=0)
    risk_score: float = Field(..., ge=0, le=1)
    execution_complexity: int = Field(..., ge=1, le=5)
    timestamp: datetime

    @field_validator('exchanges', mode='after')
    @classmethod
    def validate_exchanges(cls, v):
        if len(v) < 2:
            raise ValueError("At least 2 exchanges required for arbitrage")
        return v


class Portfolio(BaseModel):
    """Portfolio allocation and performance"""
    strategy: StrategyType
    total_value_usd: Decimal = Field(..., ge=0)
    positions: List[Position]
    target_allocations: Dict[AssetSymbol, float] = Field(
        ..., description="Target allocation percentages"
    )
    current_allocations: Dict[AssetSymbol, float] = Field(
        ..., description="Current allocation percentages" 
    )
    rebalance_threshold: float = Field(0.05, ge=0.01, le=0.2)
    performance_30d: Optional[Decimal] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    last_rebalance: Optional[datetime] = None

    @field_validator('target_allocations', 'current_allocations')
    @classmethod
    def validate_allocations_sum_to_one(cls, v):
        total = sum(v.values())
        if abs(total - 1.0) > 0.01:  # Allow small rounding errors
            raise ValueError(f"Allocations must sum to 1.0, got {total}")
        return v


class TradingSignal(BaseModel):
    """AI-generated trading signal"""
    asset: AssetSymbol
    action: str = Field(..., pattern="^(BUY|SELL|HOLD|REBALANCE)$")
    confidence: float = Field(..., ge=0, le=1)
    target_price: Optional[Decimal] = None
    stop_loss: Optional[Decimal] = None
    take_profit: Optional[Decimal] = None
    reasoning: str = Field(..., description="AI model reasoning")
    model_version: str
    timestamp: datetime


class RiskMetrics(BaseModel):
    """Risk assessment metrics"""
    portfolio_var_95: Decimal = Field(..., description="95% Value at Risk")
    max_leverage: float = Field(..., ge=1, le=10)
    concentration_risk: float = Field(..., ge=0, le=1)
    liquidity_risk: float = Field(..., ge=0, le=1)
    counterparty_risk: float = Field(..., ge=0, le=1)
    overall_risk_score: float = Field(..., ge=0, le=1)
    recommended_max_position_size: Decimal = Field(..., ge=0)
    timestamp: datetime


class ElizaOSMessage(BaseModel):
    """Message format for ElizaOS communication"""
    id: str = Field(..., description="Deterministic UUID")
    room_id: str = Field(..., description="Room/Channel identifier")
    agent_id: str = Field(..., description="Agent identifier")
    user_id: str = Field(..., description="User identifier") 
    content: Union[str, Dict] = Field(..., description="Message content")
    message_type: str = Field(..., description="Message type identifier")
    timestamp: datetime
    metadata: Optional[Dict] = None

    model_config = ConfigDict()
