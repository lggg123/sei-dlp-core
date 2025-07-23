"""
Test utilities and fixtures for SEI DLP AI Engine tests
"""

import pytest
from decimal import Decimal
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from sei_dlp_ai.types import (
    AssetSymbol, MarketData, TradingSignal, RiskMetrics, 
    Portfolio, Position, StrategyType
)
from sei_dlp_ai.integrations.elizaos_client import ElizaOSClient, ElizaOSConfig


@pytest.fixture
def mock_market_data():
    """Create valid MarketData with all required fields"""
    return MarketData(
        symbol=AssetSymbol.SEI,
        price=Decimal("0.45"),
        volume_24h=Decimal("1000000"),
        price_change_24h=Decimal("0.05"),
        funding_rate=Decimal("0.0001"),
        confidence_score=0.95,  # Required field
        timestamp=datetime.now(timezone.utc),
        source="pyth"
    )


@pytest.fixture
def mock_trading_signal():
    """Create valid TradingSignal with all required fields"""
    return TradingSignal(
        asset=AssetSymbol.SEI,
        action="BUY",
        confidence=0.85,
        target_price=Decimal("0.50"),
        stop_loss=Decimal("0.40"),
        reasoning="AI model predicts upward movement based on volume analysis",  # Required field
        model_version="v1.2.3",
        timestamp=datetime.now(timezone.utc)
    )


@pytest.fixture
def mock_risk_metrics():
    """Create valid RiskMetrics with all required fields"""
    return RiskMetrics(
        portfolio_var_95=Decimal("850.00"),
        max_leverage=3.5,
        concentration_risk=0.25,
        liquidity_risk=0.15,
        counterparty_risk=0.10,
        overall_risk_score=0.35,  # Required field
        recommended_max_position_size=Decimal("5000"),  # Required field
        timestamp=datetime.now(timezone.utc)
    )


@pytest.fixture
def mock_position():
    """Create valid Position"""
    return Position(
        asset=AssetSymbol.SEI,
        size=Decimal("1000"),
        entry_price=Decimal("0.40"),
        current_price=Decimal("0.45"),
        unrealized_pnl=Decimal("50"),
        timestamp=datetime.now(timezone.utc)
    )


@pytest.fixture
def mock_portfolio(mock_position):
    """Create valid Portfolio"""
    return Portfolio(
        strategy=StrategyType.BALANCED,
        total_value_usd=Decimal("6500"),
        positions=[mock_position],
        target_allocations={AssetSymbol.SEI: Decimal("0.6"), AssetSymbol.USDC: Decimal("0.4")},
        current_allocations={AssetSymbol.SEI: Decimal("0.65"), AssetSymbol.USDC: Decimal("0.35")},
        rebalance_threshold=Decimal("0.05"),
        last_rebalance=datetime.now(timezone.utc)
    )


@pytest.fixture
def elizaos_config():
    """Create test ElizaOS configuration"""
    return ElizaOSConfig(
        base_url="http://test-server",
        websocket_url="test://mock-ws",  # Use test:// to skip real websocket
        api_key="test-key",
        agent_id="test-agent",
        room_id="test-room"
    )


@pytest.fixture
def elizaos_client(elizaos_config):
    """Create ElizaOS client for testing"""
    return ElizaOSClient(elizaos_config)


@pytest.fixture
def mock_aiohttp_session():
    """Create properly mocked aiohttp session"""
    session = AsyncMock()
    
    # Create context manager mock for GET
    get_context = AsyncMock()
    get_context.__aenter__ = AsyncMock()
    get_context.__aexit__ = AsyncMock(return_value=None)
    session.get.return_value = get_context
    
    # Create context manager mock for POST
    post_context = AsyncMock()
    post_context.__aenter__ = AsyncMock()
    post_context.__aexit__ = AsyncMock(return_value=None)
    session.post.return_value = post_context
    
    return session


@pytest.fixture
def mock_websocket():
    """Create properly mocked websocket"""
    websocket = AsyncMock()
    websocket.send = AsyncMock()
    websocket.close = AsyncMock()
    return websocket


def create_mock_response(json_data, status=200):
    """Helper to create mock HTTP response"""
    mock_response = AsyncMock()
    mock_response.status = status
    mock_response.json = AsyncMock(return_value=json_data)
    mock_response.raise_for_status = AsyncMock()
    if status >= 400:
        mock_response.raise_for_status.side_effect = Exception(f"HTTP {status}")
    return mock_response
