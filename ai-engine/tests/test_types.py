"""Tests for SEI DLP AI Engine data types"""

import pytest
from datetime import datetime, timezone
from decimal import Decimal
from pydantic import ValidationError

from sei_dlp_ai.types import (
    AssetSymbol, ChainId, MarketData, Position, Portfolio,
    StrategyType, RiskLevel, LiquidityPool, ArbitrageOpportunity,
    TradingSignal, RiskMetrics, ElizaOSMessage
)


class TestMarketData:
    """Test MarketData validation and properties"""
    
    def test_valid_market_data_creation(self):
        """Test creating valid market data"""
        data = MarketData(
            symbol=AssetSymbol.SEI,
            price=Decimal("0.45"),
            volume_24h=Decimal("1000000"),
            price_change_24h=Decimal("0.02"),
            funding_rate=Decimal("0.0001"),
            confidence_score=0.95,
            timestamp=datetime.now(timezone.utc),
            source="pyth"
        )
        
        assert data.symbol == AssetSymbol.SEI
        assert data.price == Decimal("0.45")
        assert data.confidence_score == 0.95
        
    def test_invalid_price_validation(self):
        """Test that negative prices are rejected"""
        with pytest.raises(ValidationError) as exc_info:
            MarketData(
                symbol=AssetSymbol.ETH,
                price=Decimal("-100"),  # Invalid negative price
                volume_24h=Decimal("1000"),
                price_change_24h=Decimal("0"),
                confidence_score=0.9,
                timestamp=datetime.now(timezone.utc),
                source="chainlink"
            )
        
        assert "greater than 0" in str(exc_info.value)
        
    def test_invalid_confidence_score_validation(self):
        """Test confidence score must be between 0 and 1"""
        with pytest.raises(ValidationError):
            MarketData(
                symbol=AssetSymbol.BTC,
                price=Decimal("45000"),
                volume_24h=Decimal("1000"),
                price_change_24h=Decimal("0"),
                confidence_score=1.5,  # Invalid > 1
                timestamp=datetime.now(timezone.utc),
                source="pyth"
            )


class TestPosition:
    """Test Position model and calculations"""
    
    def test_position_value_calculation(self):
        """Test position value USD calculation"""
        position = Position(
            asset=AssetSymbol.SEI,
            size=Decimal("1000"),
            entry_price=Decimal("0.40"),
            current_price=Decimal("0.45"),
            unrealized_pnl=Decimal("50"),
            timestamp=datetime.now(timezone.utc)
        )
        
        expected_value = Decimal("1000") * Decimal("0.45")
        assert position.value_usd == expected_value
        
    def test_leveraged_position(self):
        """Test position with leverage"""
        position = Position(
            asset=AssetSymbol.ETH,
            size=Decimal("10"),
            entry_price=Decimal("2800"),
            current_price=Decimal("2850"),
            unrealized_pnl=Decimal("500"),
            leverage=2.0,
            liquidation_price=Decimal("2400"),
            timestamp=datetime.now(timezone.utc)
        )
        
        assert position.leverage == 2.0
        assert position.liquidation_price == Decimal("2400")
        
    def test_invalid_leverage_validation(self):
        """Test leverage validation (1x to 10x)"""
        with pytest.raises(ValidationError):
            Position(
                asset=AssetSymbol.BTC,
                size=Decimal("1"),
                entry_price=Decimal("45000"),
                current_price=Decimal("46000"),
                unrealized_pnl=Decimal("1000"),
                leverage=15.0,  # Invalid > 10x
                timestamp=datetime.now(timezone.utc)
            )


class TestPortfolio:
    """Test Portfolio model and validation"""
    
    def test_valid_portfolio_creation(self, mock_portfolio):
        """Test creating valid portfolio"""
        assert mock_portfolio.strategy == StrategyType.BALANCED
        assert mock_portfolio.total_value_usd == Decimal("6500")
        assert len(mock_portfolio.positions) == 2
        
    def test_allocation_validation_sum_to_one(self):
        """Test that allocations must sum to 1.0"""
        with pytest.raises(ValidationError) as exc_info:
            Portfolio(
                strategy=StrategyType.CONSERVATIVE,
                total_value_usd=Decimal("1000"),
                positions=[],
                target_allocations={
                    AssetSymbol.SEI: 0.4,
                    AssetSymbol.USDC: 0.4,  # Sum = 0.8, should fail
                },
                current_allocations={
                    AssetSymbol.SEI: 0.5,
                    AssetSymbol.USDC: 0.5,
                }
            )
        
        assert "sum to 1.0" in str(exc_info.value)
        
    def test_rebalance_threshold_validation(self):
        """Test rebalance threshold must be reasonable"""
        with pytest.raises(ValidationError):
            Portfolio(
                strategy=StrategyType.AGGRESSIVE,
                total_value_usd=Decimal("1000"),
                positions=[],
                target_allocations={AssetSymbol.SEI: 1.0},
                current_allocations={AssetSymbol.SEI: 1.0},
                rebalance_threshold=0.5  # 50% is too high
            )


class TestLiquidityPool:
    """Test LiquidityPool model and price calculations"""
    
    def test_pool_price_calculation(self, mock_liquidity_pool):
        """Test pool price calculation"""
        # SEI/USDC pool: 1,000,000 SEI / 450,000 USDC
        expected_price = Decimal("1000000") / Decimal("450000")
        assert abs(mock_liquidity_pool.price_token0_in_token1 - expected_price) < Decimal("0.001")
        
    def test_pool_with_zero_reserves(self):
        """Test pool price calculation with zero reserves"""
        pool = LiquidityPool(
            address="0x1234567890abcdef1234567890abcdef12345678",
            token0=AssetSymbol.SEI,
            token1=AssetSymbol.USDC,
            reserve0=Decimal("1000"),
            reserve1=Decimal("0"),  # Zero reserves
            fee_tier=0.003,
            liquidity=Decimal("0"),
            sqrt_price_x96=0,
            tick=0,
            timestamp=datetime.now(timezone.utc)
        )
        
        assert pool.price_token0_in_token1 == Decimal("0")


class TestArbitrageOpportunity:
    """Test ArbitrageOpportunity validation"""
    
    def test_valid_arbitrage_opportunity(self, mock_arbitrage_opportunity):
        """Test valid arbitrage opportunity creation"""
        assert len(mock_arbitrage_opportunity.exchanges) >= 2
        assert mock_arbitrage_opportunity.spread > 0
        assert 0 <= mock_arbitrage_opportunity.risk_score <= 1
        
    def test_insufficient_exchanges_validation(self):
        """Test that at least 2 exchanges are required"""
        with pytest.raises(ValidationError) as exc_info:
            ArbitrageOpportunity(
                asset=AssetSymbol.BTC,
                exchanges=["binance"],  # Only 1 exchange
                funding_rates={"binance": Decimal("0.0001")},
                spread=Decimal("0"),
                potential_profit=Decimal("0"),
                risk_score=0.5,
                execution_complexity=1,
                timestamp=datetime.now(timezone.utc)
            )
        
        assert "At least 2 exchanges required for arbitrage" in str(exc_info.value)

    def test_exchanges_validator_error_message(self):
        """Test specific validation error message for exchanges"""
        with pytest.raises(ValidationError) as exc_info:
            ArbitrageOpportunity(
                asset=AssetSymbol.ETH,
                exchanges=["binance"],  # Single exchange to trigger custom validator
                funding_rates={"binance": Decimal("0.0001")},
                spread=Decimal("0.001"),
                potential_profit=Decimal("50.0"),
                risk_score=0.2,
                execution_complexity=1,
                timestamp=datetime.now(timezone.utc)
            )
        
        # This should trigger the custom validator error message
        error_message = str(exc_info.value)
        assert "At least 2 exchanges required for arbitrage" in error_message
    
    def test_valid_arbitrage_opportunity_validator(self):
        """Test valid arbitrage opportunity with correct number of exchanges"""
        arb_opportunity = ArbitrageOpportunity(
            asset=AssetSymbol.BTC,
            exchanges=["binance", "coinbase", "kraken"],  # 3 exchanges - valid
            funding_rates={
                "binance": Decimal("0.0001"),
                "coinbase": Decimal("0.0002"),
                "kraken": Decimal("0.0003")
            },
            spread=Decimal("0.0002"),
            potential_profit=Decimal("100.0"),
            risk_score=0.3,
            execution_complexity=2,
            timestamp=datetime.now(timezone.utc)
        )
        
        # Validator should pass and return the exchanges list unchanged
        assert len(arb_opportunity.exchanges) == 3
        assert "binance" in arb_opportunity.exchanges
        assert "coinbase" in arb_opportunity.exchanges
        assert "kraken" in arb_opportunity.exchanges


class TestTradingSignal:
    """Test TradingSignal validation"""
    
    def test_valid_trading_signal(self, mock_trading_signal):
        """Test valid trading signal creation"""
        assert mock_trading_signal.action in ["BUY", "SELL", "HOLD"]
        assert 0 <= mock_trading_signal.confidence <= 1
        assert mock_trading_signal.reasoning
        
    def test_invalid_action_validation(self):
        """Test invalid trading action is rejected"""
        with pytest.raises(ValidationError):
            TradingSignal(
                asset=AssetSymbol.SEI,
                action="MAYBE",  # Invalid action
                confidence=0.8,
                reasoning="Test signal",
                model_version="v1.0.0",
                timestamp=datetime.now(timezone.utc)
            )


class TestRiskMetrics:
    """Test RiskMetrics validation"""
    
    def test_valid_risk_metrics(self, mock_risk_metrics):
        """Test valid risk metrics creation"""
        assert mock_risk_metrics.max_leverage >= 1
        assert mock_risk_metrics.max_leverage <= 10
        assert 0 <= mock_risk_metrics.overall_risk_score <= 1
        
    def test_invalid_leverage_bounds(self):
        """Test leverage must be between 1 and 10"""
        with pytest.raises(ValidationError):
            RiskMetrics(
                portfolio_var_95=Decimal("1000"),
                max_leverage=0.5,  # Invalid < 1
                concentration_risk=0.2,
                liquidity_risk=0.1,
                counterparty_risk=0.1,
                overall_risk_score=0.3,
                recommended_max_position_size=Decimal("1000"),
                timestamp=datetime.now(timezone.utc)
            )


class TestElizaOSMessage:
    """Test ElizaOS message format"""
    
    def test_valid_message_creation(self):
        """Test creating valid ElizaOS message"""
        message = ElizaOSMessage(
            id="msg_12345",
            room_id="room_sei_dlp",
            agent_id="agent_ai_engine",
            user_id="user_trader",
            content="Market analysis complete",
            message_type="ANALYSIS_RESULT",
            timestamp=datetime.now(timezone.utc),
            metadata={"model_version": "v1.2.3"}
        )
        
        assert message.id == "msg_12345"
        assert message.message_type == "ANALYSIS_RESULT"
        assert isinstance(message.metadata, dict)
        
    def test_message_with_dict_content(self):
        """Test message with structured content"""
        signal_data = {
            "asset": "SEI",
            "action": "BUY",
            "confidence": 0.85
        }
        
        message = ElizaOSMessage(
            id="msg_signal_001",
            room_id="room_signals",
            agent_id="agent_ai",
            user_id="user_1",
            content=signal_data,
            message_type="TRADING_SIGNAL",
            timestamp=datetime.now(timezone.utc)
        )
        
        assert isinstance(message.content, dict)
        assert message.content["asset"] == "SEI"
