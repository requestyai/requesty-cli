/**
 * Global Jest setup - runs once before all tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export default async function globalSetup() {
  console.log('🔧 Setting up global test environment...');
  
  try {
    // Build the project first
    console.log('Building TypeScript project...');
    await execAsync('npm run build');
    console.log('✅ Project built successfully');
    
    // Create test directories
    const testDirs = [
      'coverage',
      'test-results',
      'tests/fixtures',
      'tests/temp'
    ];
    
    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
    
    // Create test environment file
    const testEnvContent = `# Test Environment
NODE_ENV=test
REQUESTY_API_KEY=test_key_12345
REQUESTY_API_BASE_URL=http://localhost:3000
REQUESTY_MASTER_KEY=test_master_key_67890
DEBUG=requesty:test
`;
    
    fs.writeFileSync('.env.test', testEnvContent);
    console.log('✅ Created test environment file');
    
    // Create mock API key store
    const mockKeyStore = {
      version: '1.0.0',
      keys: {
        test_key_12345: {
          encrypted: 'mock_encrypted_key',
          salt: 'mock_salt',
          created: Date.now()
        }
      }
    };
    
    fs.writeFileSync(
      path.join('tests/fixtures', 'mock-key-store.json'),
      JSON.stringify(mockKeyStore, null, 2)
    );
    console.log('✅ Created mock key store');
    
    // Create test PDF file
    const testPdfPath = path.join('tests/fixtures', 'test.pdf');
    if (!fs.existsSync(testPdfPath)) {
      // Create a minimal valid PDF for testing
      const pdfContent = Buffer.from([
        '%PDF-1.4',
        '1 0 obj',
        '<< /Type /Catalog /Pages 2 0 R >>',
        'endobj',
        '2 0 obj',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        'endobj',
        '3 0 obj',
        '<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>',
        'endobj',
        '4 0 obj',
        '<< /Length 44 >>',
        'stream',
        'BT',
        '/F1 12 Tf',
        '100 700 Td',
        '(Test PDF Content) Tj',
        'ET',
        'endstream',
        'endobj',
        'xref',
        '0 5',
        '0000000000 65535 f ',
        '0000000009 00000 n ',
        '0000000058 00000 n ',
        '0000000115 00000 n ',
        '0000000174 00000 n ',
        'trailer',
        '<< /Size 5 /Root 1 0 R >>',
        'startxref',
        '268',
        '%%EOF'
      ].join('\n'));
      
      fs.writeFileSync(testPdfPath, pdfContent);
      console.log('✅ Created test PDF file');
    }
    
    // Setup mock server (if needed)
    // This could start a mock API server for integration tests
    
    console.log('🎉 Global test setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    process.exit(1);
  }
};