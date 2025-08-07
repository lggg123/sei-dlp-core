import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import starterPlugin from './plugin.ts';
import seiYieldDeltaPlugin from '../node_modules/@elizaos/plugin-sei-yield-delta/src/index.ts';
import { character } from './character.ts';
import { pluginOverrides, shouldUseAPIIntegration } from './plugin-overrides.ts';
import { shouldUseSupabase, pluginSupabaseConfig } from './supabase-integration.ts';

// Import Supabase adapter with conditional loading
let supabaseAdapter: any = null;
try {
  // Try to import Supabase adapter
  const supabaseModule = require('@elizaos/adapter-supabase');
  supabaseAdapter = supabaseModule.default || supabaseModule;
  logger.info('✅ Supabase adapter loaded successfully');
} catch (error) {
  logger.warn('⚠️ Supabase adapter not available, continuing without it');
}

const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('Initializing SEI DLP Liqui character');
  logger.info(`Name: ${character.name}`);
  logger.info('SEI Chain ID: 713715');
  logger.info('Optimized for 400ms finality');
  
  // Architectural alignment status
  logger.info('🔧 Architectural Alignment Status:');
  logger.info(`📊 API Integration: ${shouldUseAPIIntegration() ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`🗄️  Supabase Integration: ${shouldUseSupabase() ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`🤖 Python AI Engine: ${process.env.PYTHON_AI_ENGINE_ACTIVE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`🌐 Main Project API: ${process.env.MAIN_PROJECT_API || 'http://localhost:3001'}`);
  logger.info(`🎯 Eliza Agent URL: ${process.env.ELIZA_AGENT_URL || 'http://localhost:3000'}`);
  
  // Configuration warnings
  if (!shouldUseAPIIntegration()) {
    logger.warn('⚠️  API Integration disabled - plugin will use internal logic');
  }
  
  if (!shouldUseSupabase()) {
    logger.warn('⚠️  Supabase integration disabled - check environment variables');
  }
  
  logger.info('✅ SEI DLP Liqui character initialized with architectural alignment');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [
    starterPlugin,
    seiYieldDeltaPlugin,
    ...(supabaseAdapter && shouldUseSupabase() ? [supabaseAdapter] : [])
  ].filter(Boolean), // SEI DLP plugin + conditional Supabase adapter
};
const project: Project = {
  agents: [projectAgent],
};

// Export test suites for the test runner
export { testSuites } from './__tests__/e2e';
export { character } from './character.ts';

export default project;
