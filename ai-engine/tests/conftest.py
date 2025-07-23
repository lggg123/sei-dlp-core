"""Test configuration and fixtures"""
import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List
import pytest
from unittest.mock import AsyncMock, MagicMock

from sei_dlp_ai.types import (
    AssetSymbol, ChainId, MarketData, Position, Portfolio, 
    StrategyType, RiskLevel, LiquidityPool, ArbitrageOpportunity,
    TradingSignal, RiskMetrics
)


@pytest.fixture
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_market_data() -> List[MarketData]:
    """Mock market data for testing"""
    base_time = datetime.now(timezone.utc)
    return [
        MarketData(
            symbol=AssetSymbol.SEI,
            price=Decimal("0.45"),
            volume_24h=Decimal("1250000"),
            price_change_24h=Decimal("0.032"),
            funding_rate=Decimal("0.0001"),
            confidence_score=0.95,
            timestamp=base_time,
            source="pyth"
        ),
        MarketData(
            symbol=AssetSymbol.USDC,
            price=Decimal("1.0"),
            volume_24h=Decimal("50000000"),
            price_change_24h=Decimal("0.001"),
            confidence_score=0.99,
            timestamp=base_time,
            source="chainlink"
        ),
        MarketData(
            symbol=AssetSymbol.ETH,
            price=Decimal("2850.75"),
            volume_24h=Decimal("15000000"),
            price_change_24h=Decimal("-45.25"),
            funding_rate=Decimal("0.0002"),
            confidence_score=0.92,
            timestamp=base_time,
            source="pyth"
        )
    ]


@pytest.fixture
def mock_portfolio() -> Portfolio:
    """Mock portfolio for testing"""
    positions = [
        Position(
            asset=AssetSymbol.SEI,
            size=Decimal("10000"),
            entry_price=Decimal("0.42"),
            current_price=Decimal("0.45"),
            unrealized_pnl=Decimal("300"),
            timestamp=datetime.now(timezone.utc)
        ),
        Position(
            asset=AssetSymbol.USDC,
            size=Decimal("2000"),
            entry_price=Decimal("1.0"),
            current_price=Decimal("1.0"),
            unrealized_pnl=Decimal("0"),
            timestamp=datetime.now(timezone.utc)
        )
    ]
    
    return Portfolio(
        strategy=StrategyType.BALANCED,
        total_value_usd=Decimal("6500"),
        positions=positions,
        target_allocations={
            AssetSymbol.SEI: 0.4,
            AssetSymbol.USDC: 0.3,
            AssetSymbol.ETH: 0.2,
            AssetSymbol.BTC: 0.1
        },
        current_allocations={
            AssetSymbol.SEI: 0.45,
            AssetSymbol.USDC: 0.35,
            AssetSymbol.ETH: 0.15,
            AssetSymbol.BTC: 0.05
        },
        rebalance_threshold=0.05,
        performance_30d=Decimal("0.125"),
        last_rebalance=datetime.now(timezone.utc) - timedelta(days=3)
    )


@pytest.fixture
def mock_liquidity_pool() -> LiquidityPool:
    """Mock liquidity pool for testing"""
    return LiquidityPool(
        address="0x1234567890abcdef1234567890abcdef12345678",
        token0=AssetSymbol.SEI,
        token1=AssetSymbol.USDC,
        reserve0=Decimal("1000000"),
        reserve1=Decimal("450000"),
        fee_tier=0.003,
        liquidity=Decimal("670820"),
        sqrt_price_x96=1771595571142957166399062016,
        tick=85176,
        timestamp=datetime.now(timezone.utc)
    )


@pytest.fixture
def mock_arbitrage_opportunity() -> ArbitrageOpportunity:
    """Mock arbitrage opportunity for testing"""
    return ArbitrageOpportunity(
        asset=AssetSymbol.ETH,
        exchanges=["binance", "bybit", "bitget"],
        funding_rates={
            "binance": Decimal("0.0001"),
            "bybit": Decimal("0.0005"), 
            "bitget": Decimal("0.0003")
        },
        spread=Decimal("0.0004"),
        potential_profit=Decimal("120.50"),
        risk_score=0.3,
        execution_complexity=2,
        timestamp=datetime.now(timezone.utc)
    )


@pytest.fixture
def mock_trading_signal() -> TradingSignal:
    """Mock trading signal for testing"""
    return TradingSignal(
        asset=AssetSymbol.SEI,
        action="BUY",
        confidence=0.85,
        target_price=Decimal("0.52"),
        stop_loss=Decimal("0.42"),
        take_profit=Decimal("0.58"),
        reasoning="ML model predicts upward momentum based on funding rate convergence and volume patterns",
        model_version="v1.2.3",
        timestamp=datetime.now(timezone.utc)
    )


@pytest.fixture
def mock_risk_metrics() -> RiskMetrics:
    """Mock risk metrics for testing"""
    return RiskMetrics(
        portfolio_var_95=Decimal("850.00"),
        max_leverage=3.5,
        concentration_risk=0.25,
        liquidity_risk=0.15,
        counterparty_risk=0.10,
        overall_risk_score=0.35,
        recommended_max_position_size=Decimal("5000"),
        timestamp=datetime.now(timezone.utc)
    )


@pytest.fixture
def mock_elizaos_client():
    """Mock ElizaOS client for testing"""
    client = AsyncMock()
    client.send_message = AsyncMock()
    client.subscribe_to_events = AsyncMock()
    client.get_market_data = AsyncMock()
    client.execute_trade = AsyncMock()
    return client


@pytest.fixture
def mock_sei_provider():
    """Mock SEI provider for testing"""
    provider = MagicMock()
    provider.get_prices = AsyncMock()
    provider.get_funding_rates = AsyncMock()
    provider.get_liquidity_pools = AsyncMock()
    return provider
