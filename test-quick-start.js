const { CLIOrchestrator } = require('./dist/cli/core/cli-orchestrator');

async function testQuickStart() {
  console.log('🚀 Testing Quick Start with simulated input...\n');
  
  // Set up the orchestrator with the user's API key
  const orchestrator = new CLIOrchestrator({
    baseURL: 'http://localhost:40000/v1',
    timeout: 60000,
    temperature: 0.7,
    apiKey: process.env.REQUESTY_API_KEY
  });

  console.log('🔑 API Key:', process.env.REQUESTY_API_KEY.substring(0, 20) + '...');
  console.log('🌐 Endpoint:', 'http://localhost:40000/v1');
  
  // Initialize the orchestrator
  await orchestrator.run();
}

// Set up environment and run
process.env.REQUESTY_API_KEY = 'sk-F8wJuoeCTa2VjCYhJ+ygjZQCFoVBHok2G+BhwqcLCusicua2f9/UiGH7gSIB4XE+XG4F+Z1ZM2ibA8wHfnNH6Ms/3GDklDxa5bPheOQYiQM=';
process.env.DEBUG = 'true';

testQuickStart().catch(console.error);