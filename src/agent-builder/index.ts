/**
 * Agent Builder Module
 * 
 * Provides a complete system for creating custom AI agents and workflows
 */

// Core types
export * from './types/agent-types';

// Storage
export { AgentStore } from './storage/agent-store';

// Tools
export { FirecrawlTool } from './tools/firecrawl-tool';
export { CodeAnalyzerTool } from './tools/code-analyzer-tool';

// Executor
export { AgentExecutor } from './executor/agent-executor';

// UI
export { AgentBuilderUI } from './ui/agent-builder-ui';

// Built-in agent templates
export const BUILT_IN_TEMPLATES = [
  {
    id: 'code-review-agent',
    name: 'Code Review Agent',
    description: 'Analyze code diffs for bugs, security issues, and best practices',
    category: 'code-review' as const,
    template: {
      systemPrompt: `You are an expert code reviewer with deep knowledge of software engineering best practices, security, and code quality. 

Your task is to analyze code changes and provide comprehensive feedback focusing on:
1. Security vulnerabilities
2. Potential bugs and logic errors
3. Performance issues
4. Code style and maintainability
5. Best practices adherence

For each issue found, provide:
- Clear description of the problem
- Severity level (critical, high, medium, low)
- Specific location in the code
- Recommended solution

Be thorough but constructive in your analysis.`,
      variables: [
        {
          name: 'diff',
          type: 'string' as const,
          description: 'Code diff to analyze',
          required: true
        },
        {
          name: 'language',
          type: 'string' as const,
          description: 'Programming language',
          required: false,
          defaultValue: 'auto-detect'
        },
        {
          name: 'focus_areas',
          type: 'string' as const,
          description: 'Comma-separated focus areas (security, performance, bugs, style)',
          required: false,
          defaultValue: 'security,bugs,performance'
        }
      ],
      tools: [
        {
          name: 'code_analyzer',
          type: 'code_analyzer' as const,
          description: 'Static code analysis tool',
          config: {},
          requiredAuth: []
        },
        {
          name: 'firecrawl',
          type: 'web_search' as const,
          description: 'Web search for documentation and best practices',
          config: {},
          requiredAuth: ['firecrawl_api_key']
        }
      ],
      steps: [
        {
          id: 'analyze-diff',
          name: 'Analyze Code Diff',
          type: 'tool' as const,
          order: 1,
          enabled: true,
          config: {
            toolName: 'code_analyzer',
            toolParams: {
              action: 'analyze_diff'
            }
          },
          inputs: [
            {
              name: 'diff',
              type: 'variable' as const,
              source: 'diff',
              required: true
            },
            {
              name: 'language',
              type: 'variable' as const,
              source: 'language',
              required: false
            }
          ],
          outputs: [
            {
              name: 'analysis',
              type: 'json' as const,
              description: 'Code analysis results',
              saveAs: 'code_analysis'
            }
          ],
          nextSteps: ['search-docs']
        },
        {
          id: 'search-docs',
          name: 'Search for Documentation',
          type: 'tool' as const,
          order: 2,
          enabled: true,
          config: {
            toolName: 'firecrawl',
            toolParams: {
              action: 'search_web'
            }
          },
          inputs: [
            {
              name: 'query',
              type: 'constant' as const,
              source: 'best practices security vulnerabilities',
              required: true
            }
          ],
          outputs: [
            {
              name: 'searchResults',
              type: 'json' as const,
              description: 'Search results',
              saveAs: 'docs'
            }
          ],
          nextSteps: ['generate-review']
        },
        {
          id: 'generate-review',
          name: 'Generate Code Review',
          type: 'prompt' as const,
          order: 3,
          enabled: true,
          config: {
            prompt: `Based on the code analysis results and documentation, provide a comprehensive code review:

Code Analysis Results:
{code_analysis}

Additional Documentation:
{docs}

Please provide a detailed review in the following format:

## 🔍 Code Review Summary

### Critical Issues (🔴)
[List critical issues with fixes]

### High Priority Issues (🟠)
[List high priority issues with recommendations]

### Medium Priority Issues (🟡)
[List medium priority issues with suggestions]

### Low Priority Issues (🟢)
[List low priority issues and improvements]

### ✅ Positive Aspects
[Highlight good practices found in the code]

### 📋 Overall Assessment
[Provide overall assessment and recommendations]

Focus on providing actionable feedback that helps improve code quality and security.`,
            model: 'openai/gpt-4o',
            temperature: 0.3,
            maxTokens: 3000
          },
          inputs: [
            {
              name: 'code_analysis',
              type: 'variable' as const,
              source: 'code_analysis',
              required: true
            },
            {
              name: 'docs',
              type: 'variable' as const,
              source: 'docs',
              required: false
            }
          ],
          outputs: [
            {
              name: 'review',
              type: 'text' as const,
              description: 'Generated code review',
              saveAs: 'final_review'
            }
          ],
          nextSteps: ['format-output']
        },
        {
          id: 'format-output',
          name: 'Format Final Output',
          type: 'output' as const,
          order: 4,
          enabled: true,
          config: {
            format: 'markdown',
            template: `# Code Review Report

{final_review}

---
*Generated by Requesty CLI Agent Builder*
*Analysis completed at: {timestamp}*`
          },
          inputs: [
            {
              name: 'final_review',
              type: 'variable' as const,
              source: 'final_review',
              required: true
            }
          ],
          outputs: [
            {
              name: 'formattedOutput',
              type: 'text' as const,
              description: 'Final formatted review'
            }
          ],
          nextSteps: []
        }
      ]
    },
    requiredVariables: ['diff'],
    requiredTools: ['code_analyzer'],
    exampleInputs: {
      diff: `@@ -1,5 +1,10 @@
 function validatePassword(password) {
-  return password.length > 6;
+  if (password.length < 8) {
+    return false;
+  }
+  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(password);
 }`,
      language: 'javascript',
      focus_areas: 'security,bugs'
    },
    documentation: `# Code Review Agent

This agent analyzes code diffs and provides comprehensive feedback on:
- Security vulnerabilities
- Potential bugs and logic errors
- Performance issues
- Code style and maintainability
- Best practices adherence

## Usage

1. Provide a code diff in unified diff format
2. Optionally specify the programming language
3. Choose focus areas for analysis
4. The agent will analyze the code and provide detailed feedback

## Required Tools

- code_analyzer: Built-in static analysis tool
- firecrawl: Web search for documentation (requires API key)

## Example Output

The agent produces a markdown report with categorized issues, severity levels, and actionable recommendations.`
  },
  {
    id: 'security-audit-agent',
    name: 'Security Audit Agent',
    description: 'Comprehensive security analysis of code and systems',
    category: 'security' as const,
    template: {
      systemPrompt: `You are a cybersecurity expert specializing in application security, code review, and vulnerability assessment.

Your mission is to identify security vulnerabilities, assess risk levels, and provide actionable remediation guidance.

Focus areas:
1. Authentication and authorization flaws
2. Input validation and injection vulnerabilities
3. Cryptographic weaknesses
4. Session management issues
5. Error handling and information disclosure
6. Security configuration problems

For each finding, provide:
- Vulnerability type and CVE references if applicable
- Risk assessment (Critical, High, Medium, Low)
- Proof of concept or exploitation scenario
- Detailed remediation steps
- Prevention strategies`,
      variables: [
        {
          name: 'target',
          type: 'string' as const,
          description: 'Target to analyze (code, URL, or description)',
          required: true
        },
        {
          name: 'scope',
          type: 'string' as const,
          description: 'Security scope (web, api, mobile, infrastructure)',
          required: false,
          defaultValue: 'web'
        }
      ],
      tools: [
        {
          name: 'code_analyzer',
          type: 'code_analyzer' as const,
          description: 'Security-focused code analysis',
          config: {},
          requiredAuth: []
        },
        {
          name: 'firecrawl',
          type: 'web_search' as const,
          description: 'Security research and CVE lookup',
          config: {},
          requiredAuth: ['firecrawl_api_key']
        }
      ]
    },
    requiredVariables: ['target'],
    requiredTools: ['code_analyzer'],
    exampleInputs: {
      target: 'https://example.com/login',
      scope: 'web'
    },
    documentation: `# Security Audit Agent

Performs comprehensive security analysis with focus on identifying vulnerabilities and providing remediation guidance.`
  },
  {
    id: 'research-agent',
    name: 'AI Research Agent',
    description: 'Conduct comprehensive research on any topic using web search and analysis',
    category: 'research' as const,
    template: {
      systemPrompt: `You are a skilled researcher capable of conducting thorough investigations on any topic.

Your research methodology:
1. Break down complex topics into searchable components
2. Gather information from multiple authoritative sources
3. Analyze and synthesize findings
4. Present well-structured, fact-based reports
5. Cite sources and provide evidence for claims

Always maintain objectivity and distinguish between facts and opinions.`,
      variables: [
        {
          name: 'topic',
          type: 'string' as const,
          description: 'Research topic or question',
          required: true
        },
        {
          name: 'depth',
          type: 'string' as const,
          description: 'Research depth (overview, detailed, comprehensive)',
          required: false,
          defaultValue: 'detailed'
        }
      ],
      tools: [
        {
          name: 'firecrawl',
          type: 'web_search' as const,
          description: 'Web search and content extraction',
          config: {},
          requiredAuth: ['firecrawl_api_key']
        }
      ]
    },
    requiredVariables: ['topic'],
    requiredTools: ['firecrawl'],
    exampleInputs: {
      topic: 'Latest developments in quantum computing',
      depth: 'comprehensive'
    },
    documentation: `# AI Research Agent

Conducts comprehensive research using web search and provides well-structured reports with citations.`
  }
];

// Utility functions
export function getBuiltInTemplate(id: string) {
  return BUILT_IN_TEMPLATES.find(template => template.id === id);
}

export function listBuiltInTemplates() {
  return BUILT_IN_TEMPLATES.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category
  }));
}

// Agent builder factory
export function createAgentBuilder(config: any) {
  const { AgentStore } = require('./storage/agent-store');
  const { AgentExecutor } = require('./executor/agent-executor');
  const { AgentBuilderUI } = require('./ui/agent-builder-ui');
  
  return {
    store: new AgentStore(),
    executor: new AgentExecutor(config),
    ui: new AgentBuilderUI(config)
  };
}