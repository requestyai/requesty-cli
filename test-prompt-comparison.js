#!/usr/bin/env node

// Test the new prompt comparison feature
const { spawn } = require('child_process');

console.log('⚡ Testing Prompt Comparison Feature');
console.log('═'.repeat(50));
console.log('');

console.log('🎯 NEW FEATURE: Compare 2 Prompts');
console.log('');

console.log('✨ What it does:');
console.log('  📝 Enter 2 different prompts');
console.log('  🚀 Tests both against 5 default models');
console.log('  ⚡ All requests run concurrently (10 total)');
console.log('  📊 Real-time comparison table');
console.log('  📈 Shows speed, cost, and token differences');
console.log('  🏆 Overall winner statistics');
console.log('');

console.log('📋 Test Example:');
console.log('  Prompt 1: "Explain quantum computing"');
console.log('  Prompt 2: "Explain quantum computing in simple terms"');
console.log('  → See which is faster, cheaper, more efficient');
console.log('');

console.log('🎛️ Menu Path:');
console.log('  1. Select: ⚡ Compare 2 Prompts');
console.log('  2. Enter Prompt 1 (Baseline)');
console.log('  3. Enter Prompt 2 (Comparison)');
console.log('  4. Choose streaming mode');
console.log('  5. Watch real-time comparison!');
console.log('');

console.log('🚀 Starting CLI...');
console.log('');

const cli = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit'
});

cli.on('error', (error) => {
  console.error('Error:', error);
});

process.on('SIGINT', () => {
  console.log('\n\n⚡ Prompt comparison feature ready!');
  cli.kill('SIGINT');
  process.exit(0);
});