/**
 * Supabase Integration Configuration for SEI DLP
 * Ensures unified database access across all components
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  schemas: {
    core: string;
    analytics: string;
    ai_predictions: string;
    vaults: string;
  };
}

export const supabaseConfig: SupabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  schemas: {
    core: 'public',
    analytics: 'analytics',
    ai_predictions: 'ai_predictions',
    vaults: 'vaults'
  }
};

/**
 * Database table configurations for SEI DLP
 */
export const tableConfigurations = {
  // Vault-related tables
  vaults: {
    name: 'sei_dlp_vaults',
    schema: 'vaults',
    columns: {
      id: 'uuid PRIMARY KEY',
      address: 'text UNIQUE NOT NULL',
      name: 'text NOT NULL',
      strategy: 'text NOT NULL',
      token_a: 'text NOT NULL',
      token_b: 'text NOT NULL',
      fee_tier: 'integer NOT NULL',
      chain_id: 'integer DEFAULT 1328',
      created_at: 'timestamp DEFAULT NOW()',
      updated_at: 'timestamp DEFAULT NOW()',
      active: 'boolean DEFAULT true'
    }
  },

  // Position tracking
  positions: {
    name: 'vault_positions',
    schema: 'vaults',
    columns: {
      id: 'uuid PRIMARY KEY',
      vault_id: 'uuid REFERENCES vaults.sei_dlp_vaults(id)',
      lower_tick: 'integer NOT NULL',
      upper_tick: 'integer NOT NULL',
      liquidity: 'numeric NOT NULL',
      tokens_owed_0: 'numeric DEFAULT 0',
      tokens_owed_1: 'numeric DEFAULT 0',
      current_tick: 'integer NOT NULL',
      utilization_rate: 'numeric DEFAULT 0',
      created_at: 'timestamp DEFAULT NOW()',
      updated_at: 'timestamp DEFAULT NOW()'
    }
  },

  // AI predictions and recommendations
  ai_predictions: {
    name: 'ml_predictions',
    schema: 'ai_predictions',
    columns: {
      id: 'uuid PRIMARY KEY',
      vault_address: 'text NOT NULL',
      prediction_type: 'text NOT NULL',
      model_version: 'text NOT NULL',
      input_features: 'jsonb NOT NULL',
      prediction_result: 'jsonb NOT NULL',
      confidence_score: 'numeric NOT NULL',
      execution_status: 'text DEFAULT \'pending\'',
      created_at: 'timestamp DEFAULT NOW()',
      expires_at: 'timestamp NOT NULL'
    }
  },

  // Rebalance history
  rebalances: {
    name: 'rebalance_history',
    schema: 'analytics',
    columns: {
      id: 'uuid PRIMARY KEY',
      vault_id: 'uuid REFERENCES vaults.sei_dlp_vaults(id)',
      old_lower_tick: 'integer',
      old_upper_tick: 'integer',
      new_lower_tick: 'integer NOT NULL',
      new_upper_tick: 'integer NOT NULL',
      transaction_hash: 'text',
      gas_used: 'numeric',
      gas_cost_sei: 'numeric',
      ai_recommended: 'boolean DEFAULT false',
      trigger_reason: 'text',
      performance_impact: 'jsonb',
      executed_at: 'timestamp DEFAULT NOW()'
    }
  },

  // Market data cache
  market_data: {
    name: 'market_data_cache',
    schema: 'analytics',
    columns: {
      id: 'uuid PRIMARY KEY',
      symbol: 'text NOT NULL',
      price: 'numeric NOT NULL',
      volume_24h: 'numeric NOT NULL',
      volatility: 'numeric NOT NULL',
      liquidity_depth: 'numeric NOT NULL',
      timestamp: 'timestamp DEFAULT NOW()',
      source: 'text NOT NULL'
    }
  },

  // Agent interactions
  agent_interactions: {
    name: 'agent_interactions',
    schema: 'public',
    columns: {
      id: 'uuid PRIMARY KEY',
      user_id: 'text',
      session_id: 'text',
      message_type: 'text NOT NULL',
      user_message: 'text',
      agent_response: 'text',
      action_taken: 'text',
      vault_address: 'text',
      metadata: 'jsonb',
      created_at: 'timestamp DEFAULT NOW()'
    }
  }
};

/**
 * Plugin configuration for Supabase integration
 */
export const pluginSupabaseConfig = {
  // Configuration to pass to @elizaos/adapter-supabase
  supabaseUrl: supabaseConfig.url,
  supabaseAnonKey: supabaseConfig.anonKey,
  supabaseServiceRoleKey: supabaseConfig.serviceRoleKey,
  
  // SEI DLP specific settings
  enableVaultTracking: true,
  enableAIPredictionLogging: true,
  enableRebalanceHistory: true,
  enableMarketDataCache: true,
  enableAgentInteractionLogging: true,
  
  // Schema preferences
  defaultSchema: 'public',
  vaultSchema: 'vaults',
  analyticsSchema: 'analytics',
  aiPredictionsSchema: 'ai_predictions',
  
  // Performance settings
  connectionPoolSize: 10,
  queryTimeout: 30000, // 30 seconds
  enableRowLevelSecurity: true,
  enableRealtimeSubscriptions: true
};

/**
 * SQL commands for setting up SEI DLP schemas and tables
 */
export const setupSQL = {
  // Create schemas
  createSchemas: `
    CREATE SCHEMA IF NOT EXISTS vaults;
    CREATE SCHEMA IF NOT EXISTS analytics;
    CREATE SCHEMA IF NOT EXISTS ai_predictions;
  `,

  // Create tables (simplified - full implementation would be more complex)
  createTables: Object.entries(tableConfigurations).map(([tableName, config]) => {
    const columnDefs = Object.entries(config.columns)
      .map(([colName, colDef]) => `${colName} ${colDef}`)
      .join(',\n  ');
    
    return `
      CREATE TABLE IF NOT EXISTS ${config.schema}.${config.name} (
        ${columnDefs}
      );
    `;
  }).join('\n'),

  // Create indexes for performance
  createIndexes: `
    CREATE INDEX IF NOT EXISTS idx_vaults_address ON vaults.sei_dlp_vaults(address);
    CREATE INDEX IF NOT EXISTS idx_vaults_chain_id ON vaults.sei_dlp_vaults(chain_id);
    CREATE INDEX IF NOT EXISTS idx_positions_vault_id ON vaults.vault_positions(vault_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_vault ON ai_predictions.ml_predictions(vault_address);
    CREATE INDEX IF NOT EXISTS idx_predictions_created ON ai_predictions.ml_predictions(created_at);
    CREATE INDEX IF NOT EXISTS idx_rebalances_vault ON analytics.rebalance_history(vault_id);
    CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON analytics.market_data_cache(symbol);
    CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON analytics.market_data_cache(timestamp);
    CREATE INDEX IF NOT EXISTS idx_agent_interactions_session ON public.agent_interactions(session_id);
  `,

  // Enable Row Level Security
  enableRLS: `
    ALTER TABLE vaults.sei_dlp_vaults ENABLE ROW LEVEL SECURITY;
    ALTER TABLE vaults.vault_positions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ai_predictions.ml_predictions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics.rebalance_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analytics.market_data_cache ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;
  `
};

/**
 * Data access layer for SEI DLP operations
 */
export class SEIDLPDatabase {
  private config: SupabaseConfig;

  constructor(config: SupabaseConfig = supabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize database with SEI DLP schema
   */
  async initializeDatabase(): Promise<void> {
    // This would typically be done via Supabase dashboard or migration scripts
    console.log('Database initialization would be handled by Supabase migrations');
    console.log('Schemas required:', this.config.schemas);
    console.log('Tables required:', Object.keys(tableConfigurations));
  }

  /**
   * Store vault data
   */
  async storeVaultData(vaultData: any): Promise<string> {
    // Implementation would use Supabase client
    console.log('Storing vault data:', vaultData);
    return 'vault-id-placeholder';
  }

  /**
   * Store AI prediction
   */
  async storePrediction(prediction: any): Promise<string> {
    // Implementation would use Supabase client
    console.log('Storing AI prediction:', prediction);
    return 'prediction-id-placeholder';
  }

  /**
   * Log agent interaction
   */
  async logAgentInteraction(interaction: any): Promise<void> {
    // Implementation would use Supabase client
    console.log('Logging agent interaction:', interaction);
  }

  /**
   * Get vault analytics
   */
  async getVaultAnalytics(vaultAddress: string): Promise<any> {
    // Implementation would query analytics tables
    console.log('Fetching analytics for vault:', vaultAddress);
    return {
      vault_address: vaultAddress,
      total_rebalances: 0,
      avg_utilization: 0.75,
      total_fees_earned: 0,
      ai_recommendations_followed: 0
    };
  }
}

/**
 * Export unified database instance
 */
export const seiDLPDatabase = new SEIDLPDatabase();

/**
 * Validation function for Supabase configuration
 */
export function validateSupabaseConfig(config: SupabaseConfig = supabaseConfig): boolean {
  const required = ['url', 'anonKey', 'serviceRoleKey'];
  const missing = required.filter(key => !config[key as keyof SupabaseConfig]);
  
  if (missing.length > 0) {
    console.error('Missing Supabase configuration:', missing);
    return false;
  }

  // Validate URL format
  try {
    new URL(config.url);
  } catch (error) {
    console.error('Invalid Supabase URL:', config.url);
    return false;
  }

  return true;
}

/**
 * Environment-based configuration
 */
export const isSupabaseConfigured = () => validateSupabaseConfig();

export const shouldUseSupabase = () => {
  return process.env.ENABLE_SUPABASE_UNIFIED === 'true' && isSupabaseConfigured();
};