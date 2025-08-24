import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Chat request schema
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  vaultAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid vault address').optional(),
  context: z.object({
    currentPage: z.string().optional(),
    vaultData: z.any().optional(),
    userPreferences: z.any().optional()
  }).optional(),
  chainId: z.number().refine(id => id === 1328, 'Must be SEI testnet (1328)').default(1328)
})

/**
 * Chat with Eliza AI agent
 * POST /api/eliza/chat - Send message to Eliza agent and get AI response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = ChatRequestSchema.parse(body)
    
    // Call Eliza agent
    const elizaResponse = await callElizaAgent(validatedData)
    
    return NextResponse.json({
      success: true,
      data: elizaResponse,
      timestamp: new Date().toISOString(),
      chainId: 13289
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid chat request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error in Eliza chat:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to communicate with AI agent',
        chainId: 13289
      },
      { status: 500 }
    )
  }
}

/**
 * Call Eliza agent with user message
 */
async function callElizaAgent(data: z.infer<typeof ChatRequestSchema>) {
  const ELIZA_AGENT_URL = process.env.ELIZA_AGENT_URL || 'http://localhost:3000'
  
  try {
    // First check if the agent is reachable
    const healthCheck = await fetch(`${ELIZA_AGENT_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout for health check
    })
    
    if (!healthCheck.ok) {
      throw new Error(`Eliza agent health check failed: ${healthCheck.status}`)
    }

    // Format message for Eliza (correct UIMessage format)
    const elizaMessage = {
      content: {
        text: data.message,
        source: 'sei-dlp-dashboard'
      },
      user: 'dashboard-user',
      room: data.vaultAddress ? `vault-${data.vaultAddress}` : 'general-chat',
      context: {
        chainId: data.chainId,
        vaultAddress: data.vaultAddress,
        currentPage: data.context?.currentPage || 'vaults',
        timestamp: new Date().toISOString(),
        ...data.context
      }
    }

    // Send to Eliza agent
    const response = await fetch(`${ELIZA_AGENT_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'sei-dlp-dashboard'
      },
      body: JSON.stringify(elizaMessage),
      signal: AbortSignal.timeout(15000) // 15 second timeout for AI processing
    })

    if (!response.ok) {
      throw new Error(`Eliza agent error: ${response.status} ${response.statusText}`)
    }

    const elizaData = await response.json()
    
    return {
      message: elizaData.response || elizaData.content?.text || 'No response from AI agent',
      confidence: elizaData.confidence || 0.8,
      actions: elizaData.actions || [],
      suggestions: elizaData.suggestions || [],
      metadata: {
        model: 'liqui-ai-agent',
        responseTime: elizaData.responseTime || '~1s',
        processingSource: 'eliza-agent',
        chainOptimized: 'SEI'
      }
    }
  } catch (error) {
    console.error('Failed to call Eliza agent, using fallback response:', error)
    
    // Fallback response if Eliza is unavailable
    return {
      message: generateFallbackResponse(data.message, data.vaultAddress),
      confidence: 0.6,
      actions: [],
      suggestions: [
        'Check vault analytics on the dashboard',
        'Review AI predictions for optimal ranges',
        'Consider rebalancing if utilization is low'
      ],
      metadata: {
        model: 'fallback-responses',
        responseTime: 'instant',
        processingSource: 'ui-fallback',
        chainOptimized: 'SEI',
        fallbackReason: error instanceof Error ? error.message : 'Eliza agent unavailable'
      }
    }
  }
}

/**
 * Generate fallback response when Eliza is unavailable
 */
function generateFallbackResponse(message: string, vaultAddress?: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('rebalance')) {
    return `🎯 For rebalancing ${vaultAddress ? `vault ${vaultAddress}` : 'your vault'}, I recommend checking the current utilization rate. If it's below 60%, rebalancing could improve fee capture. SEI's 400ms finality makes rebalancing cost-effective at ~$0.15 per transaction.`
  }
  
  if (lowerMessage.includes('predict') || lowerMessage.includes('range')) {
    return `📊 For optimal range predictions, consider current market volatility and liquidity depth. SEI's fast finality allows for frequent adjustments. Check the AI predictions tab for detailed range recommendations.`
  }
  
  if (lowerMessage.includes('gas') || lowerMessage.includes('cost')) {
    return `⚡ SEI's advantages: 400ms finality, ~$0.15 gas costs, and parallel execution make it ideal for active liquidity management compared to Ethereum's $50+ rebalancing costs.`
  }
  
  if (lowerMessage.includes('apy') || lowerMessage.includes('yield')) {
    return `💰 Vault APY depends on fee capture efficiency, range tightness, and rebalancing frequency. Concentrated liquidity can achieve 15-25% APY in optimal conditions on SEI.`
  }
  
  return `🤖 I'm a SEI DLP AI assistant running in fallback mode. I can help with basic vault optimization questions. For advanced AI analysis, please ensure the Eliza agent is running at localhost:3000 or set the ELIZA_AGENT_URL environment variable.`
}

/**
 * Get agent status
 * GET /api/eliza/chat - Check if Eliza agent is available
 */
export async function GET() {
  const ELIZA_AGENT_URL = process.env.ELIZA_AGENT_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${ELIZA_AGENT_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // Reduced timeout for faster fallback
    })
    
    return NextResponse.json({
      success: true,
      agentStatus: response.ok ? 'online' : 'error',
      agentUrl: ELIZA_AGENT_URL,
      capabilities: [
        'vault_analysis',
        'rebalance_recommendations', 
        'market_predictions',
        'sei_optimizations'
      ],
      fallbackMode: !response.ok,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      agentStatus: 'offline',
      agentUrl: ELIZA_AGENT_URL,
      error: error instanceof Error ? error.message : 'Connection failed',
      fallbackMode: true,
      fallbackCapabilities: [
        'basic_vault_questions',
        'rebalancing_guidance',
        'gas_cost_info',
        'apy_calculations'
      ],
      timestamp: new Date().toISOString()
    })
  }
}