const { ModelTester } = require('./dist/cli/core/model-tester');
const { RequestyAPI } = require('./dist/core/api');
const { StreamingClient } = require('./dist/core/streaming');
const { InteractiveUI } = require('./dist/ui/interactive-ui');

// Mock the UI to simulate user input
class MockUI {
  async getPrompt() {
    return 'Hello world test';
  }
  
  async getStreamingChoice() {
    return false;
  }
}

async function testSessionFix() {
  console.log('🚀 Testing session fix...\n');
  
  const config = {
    baseURL: 'http://localhost:40000/v1',
    timeout: 60000,
    temperature: 0.7,
    apiKey: 'sk-F8wJuoeCTa2VjCYhJ+ygjZQCFoVBHok2G+BhwqcLCusicua2f9/UiGH7gSIB4XE+XG4F+Z1ZM2ibA8wHfnNH6Ms/3GDklDxa5bPheOQYiQM='
  };

  const api = new RequestyAPI(config);
  const streaming = new StreamingClient(config);
  const ui = new MockUI();
  
  const modelTester = new ModelTester(api, streaming, ui);
  
  try {
    await modelTester.runQuickStart([]);
    console.log('\n✅ Session fix successful!');
  } catch (error) {
    console.error('\n❌ Session fix failed:', error.message);
  }
}

testSessionFix();