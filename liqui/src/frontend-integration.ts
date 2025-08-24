/**
 * Frontend Integration for SEI DLP Multi-Frontend Architecture
 * Coordinates between Next.js Main App (3001) and Eliza Agent Interface (3000)
 */

export interface FrontendConfig {
  mainApp: {
    url: string;
    name: string;
    description: string;
  };
  elizaAgent: {
    url: string;
    name: string;
    description: string;
  };
  pythonAI: {
    url: string;
    name: string;
    description: string;
  };
}

export const frontendConfig: FrontendConfig = {
  mainApp: {
    url: process.env.MAIN_PROJECT_API || 'http://localhost:3001',
    name: 'SEI DLP Core Dashboard',
    description: 'Main SEI DLP analytics and vault management interface'
  },
  elizaAgent: {
    url: process.env.ELIZA_AGENT_URL || 'http://localhost:3000',
    name: 'Liqui AI Agent',
    description: 'Chat interface for AI-powered SEI DLP optimization'
  },
  pythonAI: {
    url: process.env.AI_ENGINE_URL || 'http://localhost:8000',
    name: 'AI Engine API',
    description: 'Python-based machine learning prediction engine'
  }
};

/**
 * Cross-frontend communication utilities
 */
export class FrontendBridge {
  private config: FrontendConfig;

  constructor(config: FrontendConfig = frontendConfig) {
    this.config = config;
  }

  /**
   * Send data from Eliza agent to main dashboard
   */
  async sendToMainDashboard(data: any, endpoint: string = '/api/eliza-integration') {
    try {
      const response = await fetch(`${this.config.mainApp.url}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'eliza-agent'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'liqui-agent',
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Dashboard integration failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send data to main dashboard:', error);
      throw error;
    }
  }

  /**
   * Receive commands from main dashboard
   */
  async receiveFromMainDashboard(endpoint: string = '/api/dashboard-commands') {
    try {
      const response = await fetch(`${this.config.elizaAgent.url}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Command reception failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to receive commands from dashboard:', error);
      throw error;
    }
  }

  /**
   * Sync vault operations between frontends
   */
  async syncVaultOperation(operation: {
    type: 'rebalance' | 'deposit' | 'withdraw' | 'analyze';
    vaultAddress: string;
    params?: any;
    initiatedBy: 'dashboard' | 'agent';
  }) {
    const targetUrl = operation.initiatedBy === 'dashboard' 
      ? this.config.elizaAgent.url 
      : this.config.mainApp.url;

    try {
      const response = await fetch(`${targetUrl}/api/vault-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Source': operation.initiatedBy
        },
        body: JSON.stringify({
          operation,
          timestamp: new Date().toISOString(),
          chainId: 1328
        })
      });

      if (!response.ok) {
        throw new Error(`Vault sync failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to sync vault operation:', error);
      throw error;
    }
  }

  /**
   * Create iframe embed for dashboard integration
   */
  generateEmbedCode(component: 'agent' | 'dashboard', width = '100%', height = '600px') {
    const url = component === 'agent' 
      ? this.config.elizaAgent.url 
      : this.config.mainApp.url;

    return `
      <iframe 
        src="${url}" 
        width="${width}" 
        height="${height}"
        frameborder="0"
        style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
        allow="clipboard-write; microphone"
        title="${component === 'agent' ? 'Liqui AI Agent' : 'SEI DLP Dashboard'}"
      ></iframe>
    `;
  }

  /**
   * Get system status across all frontends
   */
  async getSystemStatus() {
    const checks = [
      { name: 'Main Dashboard', url: `${this.config.mainApp.url}/api/health` },
      { name: 'Eliza Agent', url: `${this.config.elizaAgent.url}/api/health` },
      { name: 'Python AI Engine', url: `${this.config.pythonAI.url}/health` }
    ];

    const results = await Promise.allSettled(
      checks.map(async (check) => {
        try {
          const response = await fetch(check.url, { 
            method: 'GET',
            timeout: 5000 
          } as any);
          
          return {
            name: check.name,
            url: check.url,
            status: response.ok ? 'healthy' : 'error',
            responseTime: Date.now() // Simplified
          };
        } catch (error) {
          return {
            name: check.name,
            url: check.url,
            status: 'offline',
            error: error.message
          };
        }
      })
    );

    return results.map((result, index) => ({
      ...checks[index],
      ...(result.status === 'fulfilled' ? result.value : { status: 'failed', error: result.reason })
    }));
  }
}

// Global frontend bridge instance
export const frontendBridge = new FrontendBridge();

/**
 * Character configuration updates for frontend integration
 */
export const frontendAwareCharacterUpdates = {
  // Add frontend-aware message examples
  additionalMessageExamples: [
    [
      {
        name: '{{user1}}',
        content: {
          text: 'Open the main dashboard to see vault analytics',
        },
      },
      {
        name: 'Liqui',
        content: {
          text: '🚀 You can view detailed analytics on our dashboard: http://localhost:3001/vault?address=0x6F4cF61bBf63dCe0094CA1fba25545f8c03cd8E6&tab=analytics',
          actions: ['OPEN_DASHBOARD']
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: 'How do I switch between the chat and dashboard?',
        },
      },
      {
        name: 'Liqui',
        content: {
          text: '💡 You have two powerful interfaces: Chat with me here for AI guidance, or use the visual dashboard: http://localhost:3001/vault?address=0x6F4cF61bBf63dCe0094CA1fba25545f8c03cd8E6&tab=analytics for detailed analytics. Both sync automatically via our SEI DLP API!',
        },
      },
    ]
  ],

  // Add frontend-aware system prompt additions
  systemPromptAdditions: `

Frontend Integration Context:
- Main SEI DLP Dashboard: ${frontendConfig.mainApp.url} - Visual analytics, vault management
- Liqui AI Agent Interface: ${frontendConfig.elizaAgent.url} - Conversational AI guidance
- Python AI Engine: ${frontendConfig.pythonAI.url} - ML predictions and analysis

Always mention both interfaces are available and explain when to use each:
- Use dashboard for visual analytics, detailed vault metrics, and manual operations
- Use chat interface for AI insights, natural language queries, and automated suggestions
- Both interfaces share the same SEI DLP API backend for consistent data`
};

/**
 * Export configuration for use in character.ts
 */
export const integrationConfig = {
  frontendConfig,
  frontendBridge,
  frontendAwareCharacterUpdates
};