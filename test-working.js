const { CLIOrchestrator } = require('./dist/cli/core/cli-orchestrator');
const { DEFAULT_MODELS } = require('./dist/models/models');

async function testQuickStart() {
  console.log('🚀 Testing Quick Start with your API key...\n');
  
  const orchestrator = new CLIOrchestrator({
    baseURL: 'http://localhost:40000/v1',
    timeout: 60000,
    temperature: 0.7,
    apiKey: process.env.REQUESTY_API_KEY
  });

  console.log('📋 Testing models:', DEFAULT_MODELS.slice(0, 2));
  console.log('🔑 API Key:', process.env.REQUESTY_API_KEY.substring(0, 15) + '...');
  console.log('🌐 Endpoint:', 'http://localhost:40000/v1');
  
  // Get the model tester
  const models = orchestrator.getModels();
  console.log('\n✅ Available models loaded:', models.length);
  
  console.log('\n🎉 CLI is ready to work with your API key!');
  console.log('📝 Try running: REQUESTY_API_KEY=sk-F8wJuoeCTa2VjCYhJ+ygjZQCFoVBHok2G+BhwqcLCusicua2f9/UiGH7gSIB4XE+XG4F+Z1ZM2ibA8wHfnNH6Ms/3GDklDxa5bPheOQYiQM= npm run dev');
}

testQuickStart().catch(console.error);