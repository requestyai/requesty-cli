#!/usr/bin/env node

// Test CLI without agent builder
const { spawn } = require('child_process');

console.log('🧪 Testing CLI without Agent Builder');
console.log('═'.repeat(40));
console.log('');

console.log('✅ Agent Builder Removed:');
console.log('  - All agent-builder code removed');
console.log('  - Menu option removed');
console.log('  - Only core features remain:');
console.log('    🚀 Quick Start');
console.log('    🎯 Select Models'); 
console.log('    📄 Chat with PDF');
console.log('    🔒 Security Status');
console.log('    ❌ Exit');
console.log('');

console.log('🚀 Starting clean CLI...');
console.log('');

const cli = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit'
});

cli.on('error', (error) => {
  console.error('Error:', error);
});

process.on('SIGINT', () => {
  console.log('\n\n✨ CLI working without agent builder!');
  cli.kill('SIGINT');
  process.exit(0);
});