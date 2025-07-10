/**
 * Basic test to verify test runner works
 */

const { spawn } = require('child_process');
const path = require('path');

describe('Requesty CLI Basic Tests', () => {
  describe('CLI Executable', () => {
    it('should show version when --version flag is used', (done) => {
      const cliPath = path.join(__dirname, '../dist/cli/index.js');
      const child = spawn('node', [cliPath, '--version']);

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          expect(stdout).toContain('1.0.0');
          expect(code).toBe(0);
          done();
        } catch (error) {
          done(error);
        }
      });

      child.on('error', (error) => {
        done(error);
      });
    }, 10000);

    it('should show help when --help flag is used', (done) => {
      const cliPath = path.join(__dirname, '../dist/cli/index.js');
      const child = spawn('node', [cliPath, '--help']);

      let stdout = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        try {
          expect(stdout).toContain('Usage:');
          expect(stdout).toContain('Options:');
          expect(code).toBe(0);
          done();
        } catch (error) {
          done(error);
        }
      });

      child.on('error', (error) => {
        done(error);
      });
    }, 10000);

    it('should exit with error code for invalid command', (done) => {
      const cliPath = path.join(__dirname, '../dist/cli/index.js');
      const child = spawn('node', [cliPath, 'invalid-command']);

      let stderr = '';

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          expect(code).not.toBe(0);
          done();
        } catch (error) {
          done(error);
        }
      });

      child.on('error', (error) => {
        done(error);
      });
    }, 10000);
  });

  describe('Build Verification', () => {
    it('should have built files in dist directory', () => {
      const fs = require('fs');
      const distPath = path.join(__dirname, '../dist');

      expect(fs.existsSync(distPath)).toBe(true);
      expect(fs.existsSync(path.join(distPath, 'cli', 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(distPath, 'config', 'models.json'))).toBe(
        true
      );
    });

    it('should have valid package.json', () => {
      const packageJson = require('../package.json');

      expect(packageJson.name).toBe('requesty-cli');
      expect(packageJson.version).toBe('1.0.0');
      expect(packageJson.main).toBe('dist/cli/index.js');
      expect(packageJson.bin.requesty).toBe('dist/cli/index.js');
    });

    it('should have proper license', () => {
      const fs = require('fs');
      const licensePath = path.join(__dirname, '../LICENSE');

      expect(fs.existsSync(licensePath)).toBe(true);

      const licenseContent = fs.readFileSync(licensePath, 'utf8');
      expect(licenseContent).toContain('MIT License');
      expect(licenseContent).toContain('Copyright (c) 2024');
    });
  });

  describe('Configuration Files', () => {
    it('should have proper TypeScript configuration', () => {
      const fs = require('fs');
      const tsconfigPath = path.join(__dirname, '../tsconfig.json');

      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.compilerOptions.target).toBeDefined();
      expect(tsconfig.compilerOptions.module).toBeDefined();
      expect(tsconfig.compilerOptions.outDir).toBe('./dist');
    });

    it('should have proper ESLint configuration', () => {
      const fs = require('fs');
      const eslintPath = path.join(__dirname, '../.eslintrc.js');

      expect(fs.existsSync(eslintPath)).toBe(true);
    });

    it('should have proper git ignore', () => {
      const fs = require('fs');
      const gitignorePath = path.join(__dirname, '../.gitignore');

      expect(fs.existsSync(gitignorePath)).toBe(true);

      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toContain('node_modules');
      expect(gitignoreContent).toContain('dist');
      expect(gitignoreContent).toContain('.env');
    });
  });

  describe('Security Verification', () => {
    it('should not have hardcoded secrets in source code', () => {
      const fs = require('fs');
      const path = require('path');

      function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (
            stat.isDirectory() &&
            !file.startsWith('.') &&
            file !== 'node_modules' &&
            file !== 'dist'
          ) {
            scanDirectory(filePath);
          } else if (stat.isFile() && file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');

            // Check for potential hardcoded secrets (excluding placeholders and comments)
            expect(content).not.toMatch(/password\s*=\s*['"][^'"<>]{4,}['"]/i);
            expect(content).not.toMatch(
              /api[_-]?key\s*=\s*['"][^'"<>]{10,}['"]/i
            );
            expect(content).not.toMatch(/secret\s*=\s*['"][^'"<>]{4,}['"]/i);
            expect(content).not.toMatch(/token\s*=\s*['"][^'"<>]{10,}['"]/i);
          }
        }
      }

      scanDirectory(path.join(__dirname, '../src'));
    });

    it('should use environment variables for sensitive configuration', () => {
      const fs = require('fs');
      const indexPath = path.join(__dirname, '../src/cli/index.ts');

      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toContain('process.env.REQUESTY_API_KEY');
    });
  });
});
