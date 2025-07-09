const { RequestyAPI } = require('./dist/core/api');

async function testDirectAPI() {
  console.log('🚀 Testing Direct API call...\n');
  
  const config = {
    baseURL: 'http://localhost:40000/v1',
    timeout: 60000,
    temperature: 0.7,
    apiKey: 'sk-F8wJuoeCTa2VjCYhJ+ygjZQCFoVBHok2G+BhwqcLCusicua2f9/UiGH7gSIB4XE+XG4F+Z1ZM2ibA8wHfnNH6Ms/3GDklDxa5bPheOQYiQM='
  };

  const api = new RequestyAPI(config);
  
  console.log('🔑 API Key:', config.apiKey.substring(0, 20) + '...');
  console.log('🌐 Endpoint:', config.baseURL);
  
  try {
    console.log('\n📋 Testing single model: gpt-4o-mini (should map to openai/gpt-4o-mini)');
    const result = await api.testModel('gpt-4o-mini', 'Hello world', false);
    
    console.log('\n✅ Result:', {
      success: result.success,
      error: result.error,
      duration: result.duration,
      response: result.response ? 'Got response' : 'No response'
    });
    
    if (result.error) {
      console.log('❌ Full error message:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Set debug mode
process.env.DEBUG = 'true';

testDirectAPI().catch(console.error);