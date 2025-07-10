/**
 * Global Jest teardown - runs once after all tests
 */

import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up global test environment...');
  
  try {
    // Clean up test files
    const filesToClean = [
      '.env.test',
      'test-results.json',
      'tests/temp'
    ];
    
    filesToClean.forEach(file => {
      if (fs.existsSync(file)) {
        if (fs.statSync(file).isDirectory()) {
          fs.rmSync(file, { recursive: true, force: true });
        } else {
          fs.unlinkSync(file);
        }
        console.log(`✅ Cleaned up: ${file}`);
      }
    });
    
    // Clean up any leftover mock servers or processes
    // This would kill any mock API servers started during tests
    
    console.log('🎉 Global test teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't exit with error code as tests might have passed
  }
};