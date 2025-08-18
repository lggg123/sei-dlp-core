import { logger, type IAgentRuntime, type Project, type ProjectAgent } from '@elizaos/core';
import bootstrapPlugin from '@elizaos/plugin-bootstrap';
import sqlPlugin from '@elizaos/plugin-sql';
import starterPlugin from './plugin.ts';
import seiYieldDeltaPlugin from '../node_modules/@elizaos/plugin-sei-yield-delta/src/index.ts';
import { character } from './character.ts';
import { pluginOverrides, shouldUseAPIIntegration } from './plugin-overrides.ts';
// PostgreSQL is now handled directly by ElizaOS via DATABASE_URL environment variable

const initCharacter = async (runtime: IAgentRuntime) => {
  logger.info('Initializing SEI DLP Liqui character');
  logger.info(`Name: ${character.name}`);
  logger.info('SEI Chain ID: 713715');
  logger.info('Optimized for 400ms finality');
  
  // Architectural alignment status
  logger.info('🔧 Architectural Alignment Status:');
  logger.info(`📊 API Integration: ${shouldUseAPIIntegration() ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`🗄️  Database: ${process.env.POSTGRES_URL ? 'PostgreSQL ENABLED' : 'SQLite DEFAULT'}`);
  logger.info(`🤖 Python AI Engine: ${process.env.PYTHON_AI_ENGINE_ACTIVE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  logger.info(`🌐 Main Project API: ${process.env.MAIN_PROJECT_API || 'http://localhost:3001'}`);
  logger.info(`🎯 Eliza Agent URL: ${process.env.ELIZA_AGENT_URL || 'http://localhost:3000'}`);
  
  // Configuration warnings
  if (!shouldUseAPIIntegration()) {
    logger.warn('⚠️  API Integration disabled - plugin will use internal logic');
  }
  
  // SQL plugin handles world/server management automatically
  logger.info('✅ Using SQL plugin for world and server management');
  
  logger.info('✅ SEI DLP Liqui character initialized with architectural alignment');
};

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => {
    await initCharacter(runtime);
  },
  plugins: [
    sqlPlugin,        // SQL plugin for world/server management - MUST be first
    bootstrapPlugin,
    starterPlugin,
    seiYieldDeltaPlugin,
  ].filter(Boolean), // SEI DLP plugin without Supabase adapter
};
const project: Project = {
  agents: [projectAgent],
};

// Export test suites for the test runner
export { testSuites } from './__tests__/e2e';
export { character } from './character.ts';

export default project;
