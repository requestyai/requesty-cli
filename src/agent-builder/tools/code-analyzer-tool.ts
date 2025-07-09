import { ToolResult, ToolExecutionContext } from '../types/agent-types';

/**
 * Code analyzer tool for security and quality analysis
 */
export class CodeAnalyzerTool {
  
  /**
   * Analyze code diff for potential bugs and security issues
   */
  async analyzeDiff(
    diff: string,
    options: {
      language?: string;
      focusAreas?: ('security' | 'performance' | 'bugs' | 'style' | 'maintainability')[];
      rules?: string[];
      context?: {
        projectRoot?: string;
        targetFile?: string;
        fullSource?: string;
      };
    } = {},
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    try {
      context.logger('info', 'Analyzing code diff', { 
        diffLength: diff.length,
        language: options.language,
        focusAreas: options.focusAreas
      });

      const analysis = await this.performDiffAnalysis(diff, options, context);
      
      context.logger('info', 'Code diff analysis completed', {
        issuesFound: analysis.issues.length,
        criticalIssues: analysis.issues.filter((i: any) => i.severity === 'critical').length,
        securityIssues: analysis.issues.filter((i: any) => i.category === 'security').length
      });

      return {
        success: true,
        data: analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          language: options.language || 'unknown',
          diffLength: diff.length,
          focusAreas: options.focusAreas || ['bugs', 'security']
        }
      };
    } catch (error) {
      context.logger('error', 'Failed to analyze code diff', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          attemptedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Analyze full source code file
   */
  async analyzeFile(
    filePath: string,
    source: string,
    options: {
      language?: string;
      focusAreas?: ('security' | 'performance' | 'bugs' | 'style' | 'maintainability')[];
      rules?: string[];
    } = {},
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    try {
      context.logger('info', `Analyzing file: ${filePath}`, { 
        filePath,
        sourceLength: source.length,
        language: options.language,
        focusAreas: options.focusAreas
      });

      const analysis = await this.performFileAnalysis(filePath, source, options, context);
      
      context.logger('info', `File analysis completed: ${filePath}`, {
        issuesFound: analysis.issues.length,
        criticalIssues: analysis.issues.filter((i: any) => i.severity === 'critical').length,
        securityIssues: analysis.issues.filter((i: any) => i.category === 'security').length
      });

      return {
        success: true,
        data: analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          filePath,
          language: options.language || this.detectLanguage(filePath),
          sourceLength: source.length,
          focusAreas: options.focusAreas || ['bugs', 'security']
        }
      };
    } catch (error) {
      context.logger('error', `Failed to analyze file: ${filePath}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          attemptedAt: new Date().toISOString(),
          filePath
        }
      };
    }
  }

  /**
   * Perform diff analysis
   */
  private async performDiffAnalysis(
    diff: string,
    options: any,
    context: ToolExecutionContext
  ): Promise<any> {
    const issues: any[] = [];
    const metrics = {
      linesAdded: 0,
      linesRemoved: 0,
      linesModified: 0,
      complexity: 0,
      riskScore: 0
    };

    // Parse diff
    const diffLines = diff.split('\n');
    let currentFile = '';
    let currentLine = 0;

    for (const line of diffLines) {
      if (line.startsWith('+++') || line.startsWith('---')) {
        currentFile = line.substring(4);
        continue;
      }

      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          currentLine = parseInt(match[2]);
        }
        continue;
      }

      if (line.startsWith('+')) {
        metrics.linesAdded++;
        const addedLine = line.substring(1);
        
        // Check for security issues in added lines
        const securityIssues = this.checkSecurityIssues(addedLine, currentLine, currentFile);
        issues.push(...securityIssues);
        
        // Check for code quality issues
        const qualityIssues = this.checkQualityIssues(addedLine, currentLine, currentFile);
        issues.push(...qualityIssues);
        
        currentLine++;
      } else if (line.startsWith('-')) {
        metrics.linesRemoved++;
      } else if (line.startsWith(' ')) {
        currentLine++;
      }
    }

    // Calculate complexity and risk score
    metrics.complexity = this.calculateComplexity(diff);
    metrics.riskScore = this.calculateRiskScore(issues, metrics);

    return {
      issues: issues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)),
      metrics,
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        highIssues: issues.filter(i => i.severity === 'high').length,
        mediumIssues: issues.filter(i => i.severity === 'medium').length,
        lowIssues: issues.filter(i => i.severity === 'low').length,
        securityIssues: issues.filter(i => i.category === 'security').length,
        bugIssues: issues.filter(i => i.category === 'bug').length,
        styleIssues: issues.filter(i => i.category === 'style').length,
        riskLevel: metrics.riskScore > 80 ? 'high' : metrics.riskScore > 50 ? 'medium' : 'low'
      }
    };
  }

  /**
   * Perform file analysis
   */
  private async performFileAnalysis(
    filePath: string,
    source: string,
    options: any,
    context: ToolExecutionContext
  ): Promise<any> {
    const issues: any[] = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for security issues
      const securityIssues = this.checkSecurityIssues(line, lineNumber, filePath);
      issues.push(...securityIssues);

      // Check for code quality issues
      const qualityIssues = this.checkQualityIssues(line, lineNumber, filePath);
      issues.push(...qualityIssues);
    }

    const metrics = {
      totalLines: lines.length,
      codeLines: lines.filter(line => line.trim() && !line.trim().startsWith('//')).length,
      commentLines: lines.filter(line => line.trim().startsWith('//')).length,
      blankLines: lines.filter(line => !line.trim()).length,
      complexity: this.calculateComplexity(source),
      riskScore: this.calculateRiskScore(issues, { linesAdded: lines.length, linesRemoved: 0, linesModified: 0 })
    };

    return {
      issues: issues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)),
      metrics,
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length,
        highIssues: issues.filter(i => i.severity === 'high').length,
        mediumIssues: issues.filter(i => i.severity === 'medium').length,
        lowIssues: issues.filter(i => i.severity === 'low').length,
        securityIssues: issues.filter(i => i.category === 'security').length,
        bugIssues: issues.filter(i => i.category === 'bug').length,
        styleIssues: issues.filter(i => i.category === 'style').length,
        riskLevel: metrics.riskScore > 80 ? 'high' : metrics.riskScore > 50 ? 'medium' : 'low'
      }
    };
  }

  /**
   * Check for security issues in code
   */
  private checkSecurityIssues(line: string, lineNumber: number, filePath: string): any[] {
    const issues: any[] = [];
    const trimmedLine = line.trim();

    // SQL Injection patterns
    if (trimmedLine.includes('SELECT') && trimmedLine.includes('+')) {
      issues.push({
        type: 'sql_injection',
        category: 'security',
        severity: 'high',
        message: 'Potential SQL injection vulnerability detected',
        line: lineNumber,
        file: filePath,
        code: trimmedLine,
        recommendation: 'Use parameterized queries or prepared statements'
      });
    }

    // Hardcoded credentials
    const credentialPatterns = [
      /password\s*=\s*['"][^'"]+['"]/i,
      /api_key\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i,
      /token\s*=\s*['"][^'"]+['"]/i
    ];

    for (const pattern of credentialPatterns) {
      if (pattern.test(trimmedLine)) {
        issues.push({
          type: 'hardcoded_credentials',
          category: 'security',
          severity: 'critical',
          message: 'Hardcoded credentials detected',
          line: lineNumber,
          file: filePath,
          code: trimmedLine,
          recommendation: 'Use environment variables or secure configuration files'
        });
      }
    }

    // Eval usage (JavaScript/Python)
    if (trimmedLine.includes('eval(')) {
      issues.push({
        type: 'eval_usage',
        category: 'security',
        severity: 'high',
        message: 'Use of eval() function detected',
        line: lineNumber,
        file: filePath,
        code: trimmedLine,
        recommendation: 'Avoid eval() as it can execute arbitrary code'
      });
    }

    // Command injection patterns
    if (trimmedLine.includes('exec(') || trimmedLine.includes('system(') || trimmedLine.includes('shell_exec(')) {
      issues.push({
        type: 'command_injection',
        category: 'security',
        severity: 'high',
        message: 'Potential command injection vulnerability',
        line: lineNumber,
        file: filePath,
        code: trimmedLine,
        recommendation: 'Validate and sanitize all user inputs before executing commands'
      });
    }

    return issues;
  }

  /**
   * Check for code quality issues
   */
  private checkQualityIssues(line: string, lineNumber: number, filePath: string): any[] {
    const issues: any[] = [];
    const trimmedLine = line.trim();

    // Long line
    if (line.length > 120) {
      issues.push({
        type: 'long_line',
        category: 'style',
        severity: 'low',
        message: 'Line exceeds recommended length (120 characters)',
        line: lineNumber,
        file: filePath,
        code: trimmedLine,
        recommendation: 'Break long lines into multiple lines for better readability'
      });
    }

    // TODO comments
    if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME') || trimmedLine.includes('HACK')) {
      issues.push({
        type: 'todo_comment',
        category: 'maintainability',
        severity: 'low',
        message: 'TODO/FIXME comment found',
        line: lineNumber,
        file: filePath,
        code: trimmedLine,
        recommendation: 'Address TODO items before production deployment'
      });
    }

    // Magic numbers
    const magicNumberPattern = /\b\d{3,}\b/;
    if (magicNumberPattern.test(trimmedLine) && !trimmedLine.includes('//')) {
      issues.push({
        type: 'magic_number',
        category: 'maintainability',
        severity: 'medium',
        message: 'Magic number detected',
        line: lineNumber,
        file: filePath,
        code: trimmedLine,
        recommendation: 'Replace magic numbers with named constants'
      });
    }

    // Console.log/print statements (likely debug code)
    if (trimmedLine.includes('console.log') || trimmedLine.includes('print(')) {
      issues.push({
        type: 'debug_code',
        category: 'maintainability',
        severity: 'low',
        message: 'Debug/logging statement found',
        line: lineNumber,
        file: filePath,
        code: trimmedLine,
        recommendation: 'Remove debug statements or use proper logging framework'
      });
    }

    return issues;
  }

  /**
   * Calculate code complexity
   */
  private calculateComplexity(code: string): number {
    let complexity = 1; // Base complexity

    // Count decision points
    const decisionPatterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\btry\b/g,
      /\bcatch\b/g,
      /\b&&\b/g,
      /\b\|\|\b/g,
      /\?\s*:/g // Ternary operator
    ];

    for (const pattern of decisionPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(issues: any[], metrics: any): number {
    let score = 0;

    // Base score from metrics
    score += Math.min(metrics.linesAdded * 0.1, 20);
    score += Math.min(metrics.complexity * 0.5, 30);

    // Add score based on issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score += 25;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 8;
          break;
        case 'low':
          score += 3;
          break;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Get severity weight for sorting
   */
  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'clj': 'clojure',
      'hs': 'haskell',
      'ml': 'ocaml',
      'fs': 'fsharp',
      'elm': 'elm',
      'dart': 'dart',
      'lua': 'lua',
      'pl': 'perl',
      'r': 'r',
      'sql': 'sql',
      'sh': 'bash',
      'ps1': 'powershell',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less'
    };

    return languageMap[ext || ''] || 'unknown';
  }

  /**
   * Get tool information
   */
  static getToolInfo() {
    return {
      name: 'code_analyzer',
      description: 'Static code analysis tool for security and quality checks',
      version: '1.0.0',
      author: 'Requesty CLI',
      capabilities: [
        'analyze_diff',
        'analyze_file'
      ],
      supportedLanguages: [
        'javascript',
        'typescript',
        'python',
        'java',
        'cpp',
        'c',
        'csharp',
        'php',
        'ruby',
        'go',
        'rust',
        'swift'
      ],
      focusAreas: [
        'security',
        'performance',
        'bugs',
        'style',
        'maintainability'
      ]
    };
  }
}