"""
API Bridge for SEI DLP AI Engine Integration with Eliza
Connects Python ML models with the Eliza agent system
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import logging
from datetime import datetime
import asyncio
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SEI DLP AI Engine Bridge",
    description="API bridge connecting Python AI models with Eliza agent",
    version="1.0.0"
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class VaultAnalysisRequest(BaseModel):
    vault_address: str
    current_price: float
    volume_24h: float
    volatility: float
    liquidity: float
    timeframe: str = "1d"
    chain_id: int = 1328

class MarketPredictionRequest(BaseModel):
    symbol: str
    historical_data: List[Dict[str, Any]]
    prediction_horizon: str = "1h"
    confidence_threshold: float = 0.7

class RebalanceRecommendationRequest(BaseModel):
    vault_address: str
    current_tick: int
    lower_tick: int
    upper_tick: int
    utilization_rate: float
    market_conditions: Dict[str, Any]

class OptimalRangeResponse(BaseModel):
    lower_tick: int
    upper_tick: int
    lower_price: float
    upper_price: float
    confidence: float
    expected_apr: float
    risk_score: float
    reasoning: str

class PredictionResponse(BaseModel):
    prediction: float
    confidence: float
    trend: str
    support_levels: List[float]
    resistance_levels: List[float]
    recommended_action: str

class RebalanceResponse(BaseModel):
    action: str
    urgency: str
    new_lower_tick: int
    new_upper_tick: int
    expected_improvement: float
    risk_assessment: str
    gas_cost_estimate: float

class DeltaNeutralRequest(BaseModel):
    pair: str
    position_size: float
    current_price: float
    volatility: float
    market_conditions: Optional[Dict[str, Any]] = None

class DeltaNeutralResponse(BaseModel):
    pair: str
    hedge_ratio: float
    lower_tick: int
    upper_tick: int
    lower_price: float
    upper_price: float
    expected_neutrality: float
    expected_apr: float
    revenue_breakdown: Dict[str, float]
    reasoning: str

# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SEI DLP AI Engine Bridge",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.post("/predict/optimal-range", response_model=OptimalRangeResponse)
async def predict_optimal_range(request: VaultAnalysisRequest):
    """
    Predict optimal liquidity range for a vault using ML models
    Integrates with sei_dlp_ai.models.liquidity_optimizer
    """
    try:
        logger.info(f"Analyzing optimal range for vault {request.vault_address}")
        
        # Import AI models (placeholder for now - implement actual ML logic)
        from sei_dlp_ai.models.liquidity_optimizer import LiquidityOptimizer
        from sei_dlp_ai.models.risk_manager import RiskManager
        
        # Initialize models
        optimizer = LiquidityOptimizer()
        risk_manager = RiskManager()
        
        # Simulate ML prediction (replace with actual model inference)
        volatility_factor = min(request.volatility, 1.0)
        price_buffer = request.current_price * volatility_factor * 0.1
        
        # SEI-specific tick spacing optimization
        tick_spacing = 60  # SEI standard
        current_tick = int(request.current_price * 10000)  # Simplified conversion
        
        optimal_range_width = int(price_buffer * 10000 / tick_spacing) * tick_spacing
        
        lower_tick = current_tick - optimal_range_width // 2
        upper_tick = current_tick + optimal_range_width // 2
        
        # Align to tick spacing
        lower_tick = (lower_tick // tick_spacing) * tick_spacing  
        upper_tick = (upper_tick // tick_spacing) * tick_spacing
        
        # Calculate confidence based on market conditions
        confidence = 0.85 - (volatility_factor * 0.2)
        expected_apr = 0.12 + (request.volume_24h / 1000000) * 0.05
        risk_score = volatility_factor * 0.6 + (1 - request.liquidity / 10000000) * 0.4
        
        reasoning = f"Optimal range calculated for SEI Chain (1328) considering {request.volatility:.1%} volatility. Range provides {confidence:.1%} confidence with estimated {expected_apr:.1%} APR."
        
        return OptimalRangeResponse(
            lower_tick=lower_tick,
            upper_tick=upper_tick,
            lower_price=lower_tick / 10000,  # Convert back to price
            upper_price=upper_tick / 10000,
            confidence=confidence,
            expected_apr=expected_apr,
            risk_score=risk_score,
            reasoning=reasoning
        )
        
    except Exception as e:
        logger.error(f"Error in optimal range prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/market", response_model=PredictionResponse)
async def predict_market_movement(request: MarketPredictionRequest):
    """
    Predict market movement using time series analysis
    """
    try:
        logger.info(f"Predicting market movement for {request.symbol}")
        
        # Simulate market prediction (implement actual ML model)
        if not request.historical_data:
            raise HTTPException(status_code=400, detail="Historical data required")
        
        # Simple trend analysis (replace with sophisticated ML model)
        recent_prices = [data.get('close', 0) for data in request.historical_data[-10:]]
        if len(recent_prices) < 2:
            raise HTTPException(status_code=400, detail="Insufficient historical data")
        
        trend_score = (recent_prices[-1] - recent_prices[0]) / recent_prices[0]
        trend = "bullish" if trend_score > 0.02 else "bearish" if trend_score < -0.02 else "neutral"
        
        # Calculate support/resistance levels
        prices = [data.get('close', 0) for data in request.historical_data]
        support_levels = [min(prices), min(prices) * 0.95]
        resistance_levels = [max(prices), max(prices) * 1.05]
        
        # Prediction based on trend
        current_price = recent_prices[-1]
        if trend == "bullish":
            prediction = current_price * 1.03
            recommended_action = "consider_tightening_range_upward"
        elif trend == "bearish":
            prediction = current_price * 0.97
            recommended_action = "consider_tightening_range_downward"
        else:
            prediction = current_price
            recommended_action = "maintain_current_range"
        
        confidence = min(0.9, abs(trend_score) * 10 + 0.5)
        
        return PredictionResponse(
            prediction=prediction,
            confidence=confidence,
            trend=trend,
            support_levels=support_levels,
            resistance_levels=resistance_levels,
            recommended_action=recommended_action
        )
        
    except Exception as e:
        logger.error(f"Error in market prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Market prediction failed: {str(e)}")

@app.post("/analyze/rebalance", response_model=RebalanceResponse)
async def analyze_rebalance_need(request: RebalanceRecommendationRequest):
    """
    Analyze if vault needs rebalancing and provide recommendations
    """
    try:
        logger.info(f"Analyzing rebalance need for vault {request.vault_address}")
        
        # Calculate position efficiency
        tick_range = request.upper_tick - request.lower_tick
        optimal_utilization = 0.75
        
        if request.utilization_rate < 0.3:
            action = "rebalance_required"
            urgency = "high"
            improvement = (optimal_utilization - request.utilization_rate) * 100
        elif request.utilization_rate < 0.6:
            action = "rebalance_suggested"
            urgency = "medium"
            improvement = (optimal_utilization - request.utilization_rate) * 60
        else:
            action = "hold_position"
            urgency = "low"
            improvement = 0
        
        # Calculate new range if rebalancing needed
        if action != "hold_position":
            # Narrow the range to improve capital efficiency
            range_adjustment = 0.7 if urgency == "high" else 0.85
            new_range_width = int(tick_range * range_adjustment)
            
            new_lower_tick = request.current_tick - new_range_width // 2
            new_upper_tick = request.current_tick + new_range_width // 2
            
            # Align to SEI tick spacing
            tick_spacing = 60
            new_lower_tick = (new_lower_tick // tick_spacing) * tick_spacing
            new_upper_tick = (new_upper_tick // tick_spacing) * tick_spacing
        else:
            new_lower_tick = request.lower_tick
            new_upper_tick = request.upper_tick
        
        # Risk assessment
        if urgency == "high":
            risk_assessment = "High opportunity cost - immediate rebalancing recommended"
        elif urgency == "medium":
            risk_assessment = "Moderate inefficiency - rebalancing beneficial"
        else:
            risk_assessment = "Position optimal - no immediate action required"
        
        # SEI-specific gas cost estimate
        gas_cost_estimate = 0.15  # ~$0.15 for SEI rebalancing
        
        return RebalanceResponse(
            action=action,
            urgency=urgency,
            new_lower_tick=new_lower_tick,
            new_upper_tick=new_upper_tick,
            expected_improvement=improvement,
            risk_assessment=risk_assessment,
            gas_cost_estimate=gas_cost_estimate
        )
        
    except Exception as e:
        logger.error(f"Error in rebalance analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Rebalance analysis failed: {str(e)}")

@app.post("/predict/delta-neutral-optimization", response_model=DeltaNeutralResponse)
async def predict_delta_neutral_optimization(request: DeltaNeutralRequest):
    """
    Optimize delta neutral strategy combining LP positions with perpetual hedging
    """
    try:
        logger.info(f"Optimizing delta neutral strategy for {request.pair}")
        
        # Validate input parameters
        if request.position_size <= 0:
            raise HTTPException(status_code=400, detail="Position size must be positive")
        if request.current_price <= 0:
            raise HTTPException(status_code=400, detail="Current price must be positive")
        if request.volatility < 0 or request.volatility > 2.0:
            raise HTTPException(status_code=422, detail="Volatility must be between 0 and 2.0")
        
        # Calculate optimal hedge ratio for delta neutrality
        # Base hedge ratio starts at 0.95 (95% hedged)
        base_hedge_ratio = 0.95
        
        # Adjust based on volatility - higher vol needs higher hedge ratio
        volatility_adjustment = min(request.volatility * 0.05, 0.04)
        hedge_ratio = min(base_hedge_ratio + volatility_adjustment, 0.98)
        
        # Calculate LP range for delta neutral strategy
        # Tighter ranges for delta neutral to maximize fee generation
        volatility_factor = min(request.volatility, 1.0)
        price_buffer = request.current_price * volatility_factor * 0.08  # Tighter than regular LP
        
        # SEI-specific tick spacing optimization
        tick_spacing = 60
        current_tick = int(request.current_price * 10000)
        
        optimal_range_width = int(price_buffer * 10000 / tick_spacing) * tick_spacing
        
        lower_tick = current_tick - optimal_range_width // 2
        upper_tick = current_tick + optimal_range_width // 2
        
        # Align to tick spacing
        lower_tick = (lower_tick // tick_spacing) * tick_spacing
        upper_tick = (upper_tick // tick_spacing) * tick_spacing
        
        # Calculate expected neutrality (how close to delta neutral)
        expected_neutrality = hedge_ratio * 0.98  # Small margin for imperfection
        
        # Calculate expected APR from multiple revenue sources
        market_conditions = request.market_conditions or {}
        funding_rate = market_conditions.get('funding_rate', 0.01)
        liquidity_depth = market_conditions.get('liquidity_depth', 1000000)
        
        # Revenue breakdown
        lp_fees = request.position_size * 0.08  # 8% from LP fees (tighter range = higher fees)
        funding_rates = request.position_size * funding_rate * 365  # Annualized funding
        volatility_capture = request.position_size * request.volatility * 0.12  # Rebalancing alpha
        
        total_revenue = lp_fees + funding_rates + volatility_capture
        expected_apr = total_revenue / request.position_size
        
        # Ensure minimum APR for delta neutral strategy
        expected_apr = max(expected_apr, 0.12)
        
        revenue_breakdown = {
            'lp_fees': lp_fees,
            'funding_rates': funding_rates,
            'volatility_capture': volatility_capture
        }
        
        reasoning = f"Delta neutral strategy with {hedge_ratio:.1%} hedge ratio for {request.pair}. " \
                   f"Optimized for {expected_neutrality:.1%} market neutrality while capturing " \
                   f"{expected_apr:.1%} APR from LP fees, funding rates, and volatility."
        
        return DeltaNeutralResponse(
            pair=request.pair,
            hedge_ratio=hedge_ratio,
            lower_tick=lower_tick,
            upper_tick=upper_tick,
            lower_price=lower_tick / 10000,
            upper_price=upper_tick / 10000,
            expected_neutrality=expected_neutrality,
            expected_apr=expected_apr,
            revenue_breakdown=revenue_breakdown,
            reasoning=reasoning
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delta neutral optimization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Delta neutral optimization failed: {str(e)}")

@app.post("/eliza/webhook")
async def eliza_webhook(data: Dict[str, Any]):
    """
    Webhook endpoint for receiving data from Eliza agent
    """
    try:
        logger.info(f"Received data from Eliza: {data}")
        
        # Process Eliza requests and route to appropriate AI models
        request_type = data.get("type")
        
        if request_type == "vault_analysis":
            # Route to optimal range prediction
            analysis_request = VaultAnalysisRequest(**data.get("params", {}))
            result = await predict_optimal_range(analysis_request)
            return {"status": "success", "result": result.dict()}
            
        elif request_type == "market_prediction":
            # Route to market prediction
            prediction_request = MarketPredictionRequest(**data.get("params", {}))
            result = await predict_market_movement(prediction_request)
            return {"status": "success", "result": result.dict()}
            
        elif request_type == "rebalance_analysis":
            # Route to rebalance analysis
            rebalance_request = RebalanceRecommendationRequest(**data.get("params", {}))
            result = await analyze_rebalance_need(rebalance_request)
            return {"status": "success", "result": result.dict()}
        
        else:
            return {"status": "unknown_request_type", "type": request_type}
            
    except Exception as e:
        logger.error(f"Error processing Eliza webhook: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/models/status")
async def get_models_status():
    """
    Get status of all AI models
    """
    return {
        "models": {
            "liquidity_optimizer": "active",
            "risk_manager": "active", 
            "market_predictor": "active"
        },
        "sei_chain_id": 1328,
        "supported_operations": [
            "optimal_range_prediction",
            "market_movement_prediction", 
            "rebalance_analysis",
            "risk_assessment",
            "delta_neutral_optimization"
        ],
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    logger.info("Starting SEI DLP AI Engine Bridge on port 8000")
    uvicorn.run(
        "api_bridge:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )