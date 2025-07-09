import OpenAI from 'openai';
import chalk from 'chalk';

export class MetadataTest {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async runAllTests(): Promise<void> {
    console.log(chalk.cyan.bold('\n🧪 METADATA TEST - 5 Ways to Attach Mode and Trace ID\n'));

    const testModel = 'openai/gpt-4.1';
    const testPrompt = 'test';
    const testMode = 'model_comparison';
    const testTraceId = 'test-trace-123';
    const testUserId = 'test-user-456';

    console.log(`Model: ${testModel}`);
    console.log(`Prompt: "${testPrompt}"`);
    console.log(`Mode: ${testMode}`);
    console.log(`Trace ID: ${testTraceId}`);
    console.log(`User ID: ${testUserId}`);
    console.log();

    // Test 1: Mode and trace_id in extra_body.requesty
    console.log(chalk.yellow('TEST 1: Mode and trace_id in extra_body.requesty'));
    await this.testMethod1(testModel, testPrompt, testMode, testTraceId, testUserId);

    // Test 2: Mode and trace_id in extra_body.requesty.extra
    console.log(chalk.yellow('TEST 2: Mode and trace_id in extra_body.requesty.extra'));
    await this.testMethod2(testModel, testPrompt, testMode, testTraceId, testUserId);

    // Test 3: Mode and trace_id as direct fields in extra_body
    console.log(chalk.yellow('TEST 3: Mode and trace_id as direct fields in extra_body'));
    await this.testMethod3(testModel, testPrompt, testMode, testTraceId, testUserId);

    // Test 4: Mode and trace_id in request body
    console.log(chalk.yellow('TEST 4: Mode and trace_id in request body'));
    await this.testMethod4(testModel, testPrompt, testMode, testTraceId, testUserId);

    // Test 5: Mode and trace_id in headers
    console.log(chalk.yellow('TEST 5: Mode and trace_id in headers'));
    await this.testMethod5(testModel, testPrompt, testMode, testTraceId, testUserId);

    // Test 6: Raw fetch like your working example
    console.log(chalk.yellow('TEST 6: Raw fetch like your working example'));
    await this.testRawFetch(testModel, testPrompt, testMode, testTraceId, testUserId);

    console.log(chalk.green('\n✅ All tests complete!'));
  }

  private async testMethod1(model: string, prompt: string, mode: string, traceId: string, userId: string): Promise<void> {
    try {
      // Test with raw fetch to see exact request
      const requestBody = {
        model,
        messages: [{ role: 'user' as const, content: prompt }],
        temperature: 0.7,
        stream: false as const,
      };

      const options = {
        extra_body: {
          requesty: {
            mode: mode,
            trace_id: traceId,
            user_id: userId
          }
        }
      };

      console.log('📤 REQUEST BODY:', JSON.stringify(requestBody, null, 2));
      console.log('📤 OPTIONS:', JSON.stringify(options, null, 2));

      const openai = new OpenAI({
        baseURL: this.config.baseURL,
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
          'X-Title': 'requesty-cli',
        },
      });

      const response = await openai.chat.completions.create(requestBody, options as any);

      console.log(chalk.green('✅ SUCCESS: Method 1 worked!'));
      console.log(`Response: ${response.choices[0]?.message?.content?.substring(0, 30)}...`);
    } catch (error) {
      console.log(chalk.red('❌ FAILED: Method 1'));
      console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log();
  }

  private async testMethod2(model: string, prompt: string, mode: string, traceId: string, userId: string): Promise<void> {
    try {
      const openai = new OpenAI({
        baseURL: this.config.baseURL,
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
          'X-Title': 'requesty-cli',
        },
      });

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user' as const, content: prompt }],
        temperature: 0.7,
        stream: false as const,
      }, {
        extra_body: {
          requesty: {
            user_id: userId,
            trace_id: traceId,
            extra: {
              mode: mode,
              timestamp: new Date().toISOString()
            }
          }
        }
      } as any);

      console.log(chalk.green('✅ SUCCESS: Method 2 worked!'));
      console.log(`Response: ${response.choices[0]?.message?.content?.substring(0, 30)}...`);
    } catch (error) {
      console.log(chalk.red('❌ FAILED: Method 2'));
      console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log();
  }

  private async testMethod3(model: string, prompt: string, mode: string, traceId: string, userId: string): Promise<void> {
    try {
      const openai = new OpenAI({
        baseURL: this.config.baseURL,
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
          'X-Title': 'requesty-cli',
        },
      });

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user' as const, content: prompt }],
        temperature: 0.7,
        stream: false as const,
      }, {
        extra_body: {
          mode: mode,
          trace_id: traceId,
          user_id: userId
        }
      } as any);

      console.log(chalk.green('✅ SUCCESS: Method 3 worked!'));
      console.log(`Response: ${response.choices[0]?.message?.content?.substring(0, 30)}...`);
    } catch (error) {
      console.log(chalk.red('❌ FAILED: Method 3'));
      console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log();
  }

  private async testMethod4(model: string, prompt: string, mode: string, traceId: string, userId: string): Promise<void> {
    try {
      const openai = new OpenAI({
        baseURL: this.config.baseURL,
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
          'X-Title': 'requesty-cli',
        },
      });

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user' as const, content: prompt }],
        temperature: 0.7,
        stream: false as const,
        mode: mode,
        trace_id: traceId,
        user_id: userId
      } as any);

      console.log(chalk.green('✅ SUCCESS: Method 4 worked!'));
      console.log(`Response: ${response.choices[0]?.message?.content?.substring(0, 30)}...`);
    } catch (error) {
      console.log(chalk.red('❌ FAILED: Method 4'));
      console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log();
  }

  private async testMethod5(model: string, prompt: string, mode: string, traceId: string, userId: string): Promise<void> {
    try {
      const openai = new OpenAI({
        baseURL: this.config.baseURL,
        apiKey: this.config.apiKey,
        timeout: this.config.timeout,
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
          'X-Title': 'requesty-cli',
        },
      });

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user' as const, content: prompt }],
        temperature: 0.7,
        stream: false as const,
      }, {
        headers: {
          'X-Mode': mode,
          'X-Trace-ID': traceId,
          'X-User-ID': userId
        }
      } as any);

      console.log(chalk.green('✅ SUCCESS: Method 5 worked!'));
      console.log(`Response: ${response.choices[0]?.message?.content?.substring(0, 30)}...`);
    } catch (error) {
      console.log(chalk.red('❌ FAILED: Method 5'));
      console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log();
  }

  private async testRawFetch(model: string, prompt: string, mode: string, traceId: string, userId: string): Promise<void> {
    try {
      const requestBody = {
        model,
        messages: [{ role: 'user' as const, content: prompt }],
        temperature: 0.7,
        stream: false as const,
        extra_body: {
          requesty: {
            tags: ['content-creation', 'test'],
            user_id: userId,
            trace_id: traceId,
            extra: {
              mode: mode,
              country: 'uk',
              prompt_title: 'test prompt',
              content_type: 'test',
              target_audience: 'technical',
            },
          },
        },
      };

      console.log('📤 RAW FETCH REQUEST BODY:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/requestyai/requesty-cli',
          'X-Title': 'requesty-cli',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;
      console.log(chalk.green('✅ SUCCESS: Raw fetch worked!'));
      console.log(`Response: ${data.choices[0]?.message?.content?.substring(0, 30)}...`);
    } catch (error) {
      console.log(chalk.red('❌ FAILED: Raw fetch'));
      console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log();
  }
}