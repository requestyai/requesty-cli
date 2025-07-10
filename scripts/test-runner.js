#!/usr/bin/env node

/**
 * Comprehensive test runner for Requesty CLI
 * Runs different types of tests based on arguments
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.magenta}${msg}${colors.reset}\n`)
};

const testSuites = {
  unit: {
    name: 'Unit Tests',
    command: 'npx jest tests/unit --coverage --verbose',
    description: 'Fast isolated unit tests for individual components'
  },
  integration: {
    name: 'Integration Tests',
    command: 'npx jest tests/integration --verbose',
    description: 'Tests for component interactions and API integrations'
  },
  e2e: {
    name: 'End-to-End Tests',
    command: 'npx jest tests/e2e --verbose --forceExit',
    description: 'Full CLI workflow tests with real interactions'
  },
  security: {
    name: 'Security Tests',
    command: 'npx jest tests/unit/security --verbose && npm audit --audit-level=high',
    description: 'Security vulnerability and encryption tests'
  },
  performance: {
    name: 'Performance Tests',
    command: 'npx jest tests/integration/performance --verbose',
    description: 'Performance benchmarks and load tests'
  },
  all: {
    name: 'All Tests',
    command: 'npx jest --coverage --verbose',
    description: 'Run complete test suite with coverage'
  }
};

async function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    log.info(`Running: ${description}`);
    
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        log.error(`Failed: ${description}`);
        console.log(stderr);
        reject(error);
      } else {
        log.success(`Passed: ${description}`);
        console.log(stdout);
        resolve(stdout);
      }
    });
  });
}

async function runTestSuite(suiteType) {
  const suite = testSuites[suiteType];
  if (!suite) {
    log.error(`Unknown test suite: ${suiteType}`);
    process.exit(1);
  }

  log.header(`🧪 ${suite.name}`);
  log.info(suite.description);

  try {
    await runCommand(suite.command, suite.name);
    log.success(`${suite.name} completed successfully!`);
  } catch (error) {
    log.error(`${suite.name} failed!`);
    process.exit(1);
  }
}

async function preTestChecks() {
  log.header('🔍 Pre-test Checks');
  
  // Check if build exists
  if (!fs.existsSync('dist/cli/index.js')) {
    log.info('Building project...');
    await runCommand('npm run build', 'TypeScript compilation');
  }
  
  // Check dependencies
  log.info('Checking dependencies...');
  await runCommand('npm ls --depth=0', 'Dependency check');
  
  // Lint check
  log.info('Running linter...');
  await runCommand('npm run lint', 'Code linting');
  
  log.success('Pre-test checks passed!');
}

async function generateTestReport() {
  log.header('📊 Test Report Generation');
  
  // Generate coverage report
  await runCommand('npx jest --coverage --coverageReporters=html', 'Coverage report');
  
  // Generate test results
  await runCommand('npx jest --json --outputFile=test-results.json', 'Test results JSON');
  
  log.success('Test reports generated in coverage/ directory');
}

async function main() {
  const args = process.argv.slice(2);
  const suiteType = args[0] || 'all';
  const skipPreChecks = args.includes('--skip-pre-checks');
  const generateReport = args.includes('--report');

  console.log(`${colors.bold}${colors.blue}🚀 Requesty CLI Test Runner${colors.reset}\n`);

  try {
    // Pre-test checks
    if (!skipPreChecks) {
      await preTestChecks();
    }

    // Run specified test suite
    await runTestSuite(suiteType);

    // Generate reports if requested
    if (generateReport) {
      await generateTestReport();
    }

    log.header('🎉 All tests completed successfully!');
    
  } catch (error) {
    log.error('Test run failed!');
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`${colors.bold}Requesty CLI Test Runner${colors.reset}

Usage: node scripts/test-runner.js [suite-type] [options]

Test Suites:
${Object.entries(testSuites).map(([key, suite]) => 
  `  ${colors.cyan}${key.padEnd(12)}${colors.reset} ${suite.description}`
).join('\n')}

Options:
  --skip-pre-checks    Skip pre-test build and lint checks
  --report            Generate HTML coverage and test reports
  --help, -h          Show this help message

Examples:
  node scripts/test-runner.js unit
  node scripts/test-runner.js all --report
  node scripts/test-runner.js security --skip-pre-checks
`);
  process.exit(0);
}

main();