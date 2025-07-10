# Requesty CLI Test Suite

A comprehensive test suite ensuring code quality, security, and reliability for the Requesty CLI.

## 🏗️ Test Structure

```
tests/
├── unit/                   # Unit tests (fast, isolated)
│   ├── core/              # Core functionality tests
│   ├── security/          # Security component tests
│   ├── utils/             # Utility function tests
│   └── ui/                # UI component tests
├── integration/           # Integration tests (component interactions)
│   ├── cli-workflow.test.ts
│   └── api-integration.test.ts
├── e2e/                   # End-to-end tests (full user workflows)
│   └── complete-workflow.test.ts
├── fixtures/              # Test data and mock files
├── helpers/               # Test utilities and helpers
├── setup.ts               # Jest setup configuration
├── global-setup.ts        # Global test environment setup
└── global-teardown.ts     # Global test cleanup
```

## 🚀 Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:security     # Security tests only
npm run test:performance  # Performance tests only

# Generate reports
npm run test:report       # Run all tests with HTML reports
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode for development
```

### Advanced Usage

```bash
# Custom test runner with options
node scripts/test-runner.js unit --skip-pre-checks
node scripts/test-runner.js all --report
node scripts/test-runner.js security --skip-pre-checks

# Setup test environment
npm run test:setup

# CI/CD pipeline
npm run ci
```

## 📊 Test Categories

### Unit Tests (80+ tests)
- **Core API** - Request handling, model management, streaming
- **Security** - Encryption, key management, validation
- **Input Validation** - XSS prevention, injection protection
- **UI Components** - Terminal UI, formatting, progress bars
- **Utilities** - Error handling, performance monitoring

### Integration Tests (20+ tests)
- **CLI Workflow** - Command parsing, user interactions
- **API Integration** - Real API calls with mocking
- **Security Integration** - End-to-end encryption flows
- **PDF Chat** - Document processing and AI interactions

### End-to-End Tests (15+ tests)
- **Complete User Journeys** - From startup to completion
- **Error Recovery** - Graceful handling of failures
- **Multi-session Workflows** - Persistent state management
- **Accessibility** - User experience validation

## 🔧 Test Configuration

### Jest Configuration
```javascript
// jest.config.js
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Coverage Requirements
- **Minimum 80% coverage** for all metrics
- **Security modules must have 95%+ coverage**
- **Critical paths must have 100% coverage**

## 🛡️ Security Testing

### Security Test Categories
1. **Encryption Tests** - AES-256-CBC, key derivation
2. **Input Validation** - XSS, SQL injection, command injection
3. **Authentication** - API key handling, secure storage
4. **Memory Security** - Sensitive data cleanup
5. **Timing Attacks** - Secure comparison functions

### Security Test Examples
```typescript
// Encryption strength test
it('should use secure encryption parameters', async () => {
  const encrypted = await cryptoManager.encrypt(data, password, salt);
  expect(encrypted).toHaveProperty('iv');
  expect(encrypted).toHaveProperty('ciphertext');
  expect(encrypted.algorithm).toBe('aes-256-cbc');
});

// Input validation test
it('should prevent SQL injection', () => {
  const maliciousInput = "'; DROP TABLE users; --";
  expect(() => InputValidator.validatePrompt(maliciousInput)).toThrow();
});
```

## 🎯 Test Utilities

### Custom Test Helpers
```typescript
// TestHelper class for CLI testing
const testHelper = TestHelper.getInstance();
const result = await testHelper.runCLICommand(['--version']);
expect(result).toHaveExitCode(0);
expect(result).toContainOutput('1.0.0');

// Mock factories for consistent test data
const mockAPI = MockFactory.createMockAPIClient();
const mockUI = MockFactory.createMockTerminalUI();
```

### Custom Jest Matchers
```typescript
// Custom matchers for better assertions
expect(result).toHaveExitCode(0);
expect(result).toContainOutput('Success');
expect(jsonString).toHaveValidJSON();
```

## 📋 Test Data Management

### Mock Data
- **API Responses** - Realistic model and response data
- **PDF Documents** - Test documents for PDF chat
- **User Inputs** - Various prompt and command scenarios
- **Error Scenarios** - Network errors, authentication failures

### Fixtures
```
tests/fixtures/
├── mock-models.json       # AI model data
├── mock-pdf-content.txt   # PDF text content
├── test.pdf              # Sample PDF file
└── mock-key-store.json   # Encrypted key storage
```

## 🔍 Test Monitoring

### Performance Metrics
- **Test execution time** - Individual and suite timings
- **Memory usage** - Memory leaks and optimization
- **Coverage trends** - Coverage improvement tracking
- **Failure patterns** - Common failure analysis

### Quality Gates
- **All tests must pass** before merging
- **Coverage must not decrease** from baseline
- **Security tests are mandatory** for releases
- **Performance tests must meet benchmarks**

## 🐛 Debugging Tests

### Debug Mode
```bash
# Enable debug logging
DEBUG=requesty:test npm run test:unit

# Run specific test with verbose output
npx jest tests/unit/core/api.test.ts --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest tests/unit/core/api.test.ts
```

### Common Issues
- **Async timeout errors** - Increase timeout or fix async handling
- **Mock conflicts** - Clear mocks between tests
- **Environment issues** - Check test environment setup
- **TypeScript errors** - Verify types and imports

## 📈 Coverage Reports

### HTML Reports
```bash
npm run test:coverage
open coverage/index.html
```

### Coverage Metrics
- **Line Coverage** - Percentage of lines executed
- **Branch Coverage** - Percentage of branches taken
- **Function Coverage** - Percentage of functions called
- **Statement Coverage** - Percentage of statements executed

## 🔄 Continuous Integration

### CI Pipeline
```bash
# Full CI pipeline
npm run ci

# Steps:
# 1. Build TypeScript
# 2. Run ESLint
# 3. Execute all tests
# 4. Security audit
# 5. Generate reports
```

### Pre-commit Hooks
```bash
# Recommended git hooks
npm run lint && npm run test:unit
```

## 📚 Best Practices

### Writing Tests
1. **Use descriptive test names** - Clear intent and expectations
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Test edge cases** - Empty inputs, invalid data, errors
4. **Mock external dependencies** - Isolated, fast tests
5. **Clean up after tests** - Prevent test pollution

### Test Organization
1. **Group related tests** - Use describe blocks effectively
2. **Use beforeEach/afterEach** - Consistent setup/teardown
3. **Avoid test interdependencies** - Each test should be independent
4. **Use meaningful assertions** - Clear failure messages
5. **Keep tests simple** - One concept per test

### Performance
1. **Minimize test setup** - Use efficient mocking
2. **Parallel execution** - Run tests concurrently
3. **Smart test selection** - Only run relevant tests
4. **Cache test data** - Reuse expensive setup
5. **Monitor test performance** - Track execution times

## 🚨 Critical Test Requirements

### Before Any Release
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Security tests pass
- [ ] E2E tests pass
- [ ] Coverage >= 80%
- [ ] Security audit clean
- [ ] Performance benchmarks met

### Before Major Changes
- [ ] Review test coverage impact
- [ ] Update relevant tests
- [ ] Add tests for new features
- [ ] Verify security implications
- [ ] Update documentation

---

## 🎉 Getting Started

1. **Setup test environment**:
   ```bash
   npm run test:setup
   ```

2. **Run your first test**:
   ```bash
   npm run test:unit
   ```

3. **View coverage report**:
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

4. **Run specific test**:
   ```bash
   npx jest tests/unit/core/api.test.ts
   ```

Happy testing! 🧪✨