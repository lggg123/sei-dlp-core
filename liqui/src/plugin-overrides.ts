import type { Plugin } from '@elizaos/core';

/**
 * Plugin Overrides for SEI DLP Architectural Alignment
 * This module configures the yield-delta plugin to use existing SEI DLP infrastructure
 */

// API integration endpoints
const API_BASE = process.env.MAIN_PROJECT_API || 'http://localhost:3001';
const ELIZA_AGENT_URL = process.env.ELIZA_AGENT_URL || 'http://localhost:3000';
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// API client for existing endpoints
export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async callRebalanceAPI(vaultAddress: string, strategy: string, parameters?: any) {
    const response = await fetch(`${this.baseUrl}/api/ai/rebalance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vaultAddress,
        strategy,
        parameters,
        chainId: 713715
      })
    });
    
    if (!response.ok) {
      throw new Error(`Rebalance API failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async callPredictAPI(vaultAddress: string, marketData: any, timeframe: string) {
    const response = await fetch(`${this.baseUrl}/api/ai/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vaultAddress,
        marketData,
        timeframe,
        chainId: 713715
      })
    });
    
    if (!response.ok) {
      throw new Error(`Predict API failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async callVaultsAPI(address?: string) {
    const endpoint = address ? `/api/vaults/${address}` : '/api/vaults';
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Vaults API failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async callMarketDataAPI(symbols: string) {
    const response = await fetch(`${this.baseUrl}/api/market/data?symbols=${symbols}`);
    
    if (!response.ok) {
      throw new Error(`Market Data API failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async callPythonAI(endpoint: string, data: any) {
    const response = await fetch(`${AI_ENGINE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Python AI Engine failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Global API client instance
export const apiClient = new ApiClient();

/**
 * Plugin override configuration for yield-delta plugin
 * Routes plugin calls through existing SEI DLP APIs
 */
export const pluginOverrides = {
  // Route rebalancing through existing API
  rebalanceAction: {
    async handler(runtime: any, message: any, state: any, options: any, callback: any) {
      try {
        const vaultAddress = extractVaultAddress(message.content.text);
        if (!vaultAddress) {
          throw new Error('No vault address found in message');
        }
        
        const strategy = extractStrategy(message.content.text) || 'threshold_based';
        
        // Call existing rebalance API instead of plugin's internal logic
        const result = await apiClient.callRebalanceAPI(vaultAddress, strategy) as any;
        
        await callback({
          text: `🎯 SEI DLP Rebalance executed via existing API: ${result?.data?.status || 'Pending'}. Transaction: ${result?.data?.transactionHash || 'Scheduled'}`,
          source: message.content.source,
        });

        return {
          text: 'Rebalance completed via SEI DLP API integration',
          success: true,
          data: result?.data || {}
        };
      } catch (error: any) {
        console.error('Rebalance override error:', error);
        return {
          text: 'Rebalance failed - check API connection',
          success: false,
          error: error?.message || 'Unknown error'
        };
      }
    }
  },

  // Route wallet queries through existing API
  walletProvider: {
    async get(runtime: any, message: any, state: any) {
      try {
        const vaultAddress = extractVaultAddress(message.content.text);
        if (vaultAddress) {
          const vaultData = await apiClient.callVaultsAPI(vaultAddress) as any;
          return {
            text: `📊 Vault data via SEI DLP API: TVL $${vaultData?.data?.tvl || 'N/A'}, APY ${vaultData?.data?.apy || 'N/A'}%`,
            values: vaultData?.data || {},
            data: vaultData?.data || {}
          };
        }
        
        // Fallback to general market data
        const marketData = await apiClient.callMarketDataAPI('SEI-USDC') as any;
        return {
          text: `⚡ SEI Network Status: Price $${marketData?.data?.[0]?.price || 'N/A'}, 400ms finality active`,
          values: marketData?.data?.[0] || {},
          data: marketData?.data?.[0] || {}
        };
      } catch (error) {
        console.error('Wallet provider override error:', error);
        return {
          text: 'Unable to fetch wallet data - check API connection',
          values: {},
          data: {}
        };
      }
    }
  },

  // Route oracle queries through existing market data API
  oracleProvider: {
    async get(runtime: any, message: any, state: any) {
      try {
        const symbols = extractSymbols(message.content.text) || 'SEI-USDC,SEI-ETH';
        const marketData = await apiClient.callMarketDataAPI(symbols) as any;
        
        return {
          text: `📈 Market data via SEI DLP API: ${marketData?.data?.length || 0} pairs updated`,
          values: { marketData: marketData?.data || [] },
          data: marketData?.data || []
        };
      } catch (error) {
        console.error('Oracle provider override error:', error);
        return {
          text: 'Unable to fetch oracle data - using plugin fallback',
          values: {},
          data: {}
        };
      }
    }
  }
};

// Helper functions for text parsing
function extractVaultAddress(text: string): string | null {
  const match = text.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

function extractStrategy(text: string): string | null {
  if (text.includes('immediate')) return 'immediate';
  if (text.includes('scheduled')) return 'scheduled';
  if (text.includes('threshold')) return 'threshold_based';
  return null;
}

function extractSymbols(text: string): string | null {
  const patterns = ['SEI-USDC', 'SEI-ETH', 'SEI-BTC'];
  const found = patterns.filter(pattern => text.toUpperCase().includes(pattern));
  return found.length > 0 ? found.join(',') : null;
}

/**
 * Environment-based plugin configuration
 */
export const shouldUseAPIIntegration = () => {
  return process.env.YIELD_DELTA_USE_EXISTING_APIS === 'true' ||
         process.env.ENABLE_API_INTEGRATION === 'true';
};

export const shouldUsePythonAI = () => {
  return process.env.PYTHON_AI_ENGINE_ACTIVE === 'true';
};