#!/usr/bin/env node

/**
 * Test environment setup script
 * Prepares test environment and mock data
 */

const fs = require('fs');
const path = require('path');

const testEnv = `# Test Environment Variables
REQUESTY_API_KEY=test_key_12345
REQUESTY_API_BASE_URL=http://localhost:3000
REQUESTY_MASTER_KEY=test_master_key_67890
NODE_ENV=test
DEBUG=requesty:*
`;

const mockModels = {
  "models": [
    {
      "id": "test-model-1",
      "object": "model",
      "created": 1234567890,
      "owned_by": "test-provider",
      "permission": [],
      "root": "test-model-1",
      "parent": null
    },
    {
      "id": "test-model-2", 
      "object": "model",
      "created": 1234567891,
      "owned_by": "test-provider",
      "permission": [],
      "root": "test-model-2",
      "parent": null
    }
  ]
};

const mockPdfText = `# Test PDF Document

This is a test PDF document used for testing the PDF chat functionality.

## Section 1: Introduction
This document contains sample content for testing PDF parsing and chat features.

## Section 2: Content
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Section 3: Conclusion
This concludes the test document.
`;

async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');

  // Create test env file
  fs.writeFileSync('.env.test', testEnv);
  console.log('✅ Created .env.test');

  // Create mock models file
  fs.writeFileSync('tests/fixtures/mock-models.json', JSON.stringify(mockModels, null, 2));
  console.log('✅ Created mock models data');

  // Create mock PDF text
  fs.writeFileSync('tests/fixtures/mock-pdf-content.txt', mockPdfText);
  console.log('✅ Created mock PDF content');

  // Create test coverage directory
  if (!fs.existsSync('coverage')) {
    fs.mkdirSync('coverage');
  }
  console.log('✅ Created coverage directory');

  // Create test results directory
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  console.log('✅ Created test results directory');

  console.log('\n🎉 Test environment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run tests: node scripts/test-runner.js');
  console.log('2. Or run specific suite: node scripts/test-runner.js unit');
  console.log('3. Generate reports: node scripts/test-runner.js all --report');
}

setupTestEnvironment();