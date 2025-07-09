#!/usr/bin/env node

// Simple test script to demonstrate the agent builder without interactive prompts

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Testing Agent Builder System\n');

// Set environment variable to bypass API key prompt for testing
process.env.REQUESTY_API_KEY = 'test-key-for-demo';

// Start the CLI
const cli = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: path.dirname(__filename)
});

cli.on('close', (code) => {
  console.log(`\n✅ Agent Builder test completed with code ${code}`);
});

// Handle interruption
process.on('SIGINT', () => {
  cli.kill('SIGINT');
  process.exit(0);
});

console.log('📝 Instructions:');
console.log('1. When the menu appears, select: 🤖 Agent Builder');
console.log('2. Choose: 🆕 Create New Agent');
console.log('3. Try creating a Code Review Agent');
console.log('4. Use Ctrl+C to exit when done testing\n');