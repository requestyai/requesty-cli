import { ToolResult, ToolExecutionContext } from '../types/agent-types';

/**
 * Firecrawl API integration for web scraping and search
 */
export class FirecrawlTool {
  private apiKey: string;
  private baseUrl: string = 'https://api.firecrawl.dev/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Scrape a single URL
   */
  async scrapeUrl(
    url: string,
    options: {
      formats?: ('markdown' | 'html' | 'structured' | 'screenshot')[];
      includeTags?: string[];
      excludeTags?: string[];
      onlyMainContent?: boolean;
      timeout?: number;
    } = {},
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    try {
      context.logger('info', `Scraping URL: ${url}`, { url, options });

      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url,
          formats: options.formats || ['markdown'],
          includeTags: options.includeTags,
          excludeTags: options.excludeTags,
          onlyMainContent: options.onlyMainContent !== false,
          timeout: options.timeout || 30000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
      }

      const result = await response.json() as any;
      
      if (!result.success) {
        throw new Error(`Firecrawl scraping failed: ${result.error || 'Unknown error'}`);
      }

      context.logger('info', `Successfully scraped URL: ${url}`, {
        url,
        contentLength: result.data.markdown?.length || 0,
        hasHtml: !!result.data.html,
        hasScreenshot: !!result.data.screenshot
      });

      return {
        success: true,
        data: {
          url,
          markdown: result.data.markdown,
          html: result.data.html,
          screenshot: result.data.screenshot,
          metadata: result.data.metadata,
          structured: result.data.structured
        },
        metadata: {
          sourceUrl: url,
          scrapedAt: new Date().toISOString(),
          title: result.data.metadata?.title,
          description: result.data.metadata?.description,
          statusCode: result.data.metadata?.statusCode
        }
      };
    } catch (error) {
      context.logger('error', `Failed to scrape URL: ${url}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          sourceUrl: url,
          attemptedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Crawl a website (multiple pages)
   */
  async crawlWebsite(
    url: string,
    options: {
      limit?: number;
      formats?: ('markdown' | 'html' | 'structured' | 'screenshot')[];
      includeTags?: string[];
      excludeTags?: string[];
      onlyMainContent?: boolean;
      maxDepth?: number;
      timeout?: number;
    } = {},
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    try {
      context.logger('info', `Starting website crawl: ${url}`, { url, options });

      const response = await fetch(`${this.baseUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url,
          limit: options.limit || 10,
          scrapeOptions: {
            formats: options.formats || ['markdown'],
            includeTags: options.includeTags,
            excludeTags: options.excludeTags,
            onlyMainContent: options.onlyMainContent !== false
          },
          maxDepth: options.maxDepth || 2,
          timeout: options.timeout || 60000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
      }

      const result = await response.json() as any;
      
      if (!result.success) {
        throw new Error(`Firecrawl crawling failed: ${result.error || 'Unknown error'}`);
      }

      // For crawling, we get a job ID and need to poll for results
      const jobId = result.id;
      const jobUrl = result.url;
      
      context.logger('info', `Crawl job started: ${jobId}`, { jobId, jobUrl });

      // Poll for completion (simplified version - in production, you'd want better polling)
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`${this.baseUrl}/crawl/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check crawl status: ${statusResponse.status}`);
        }

        const statusResult = await statusResponse.json() as any;
        
        context.logger('info', `Crawl status: ${statusResult.status}`, {
          jobId,
          status: statusResult.status,
          completed: statusResult.completed,
          total: statusResult.total
        });

        if (statusResult.status === 'completed') {
          return {
            success: true,
            data: {
              jobId,
              url,
              pages: statusResult.data,
              total: statusResult.total,
              completed: statusResult.completed,
              creditsUsed: statusResult.creditsUsed
            },
            metadata: {
              sourceUrl: url,
              crawledAt: new Date().toISOString(),
              totalPages: statusResult.total,
              completedPages: statusResult.completed,
              creditsUsed: statusResult.creditsUsed
            }
          };
        }

        if (statusResult.status === 'failed') {
          throw new Error(`Crawl job failed: ${statusResult.error || 'Unknown error'}`);
        }

        attempts++;
      }

      throw new Error('Crawl job timed out');
    } catch (error) {
      context.logger('error', `Failed to crawl website: ${url}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          sourceUrl: url,
          attemptedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Search the web
   */
  async searchWeb(
    query: string,
    options: {
      limit?: number;
      formats?: ('markdown' | 'html' | 'structured')[];
      includeTags?: string[];
      excludeTags?: string[];
      onlyMainContent?: boolean;
      timeout?: number;
    } = {},
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    try {
      context.logger('info', `Searching web: ${query}`, { query, options });

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          query,
          limit: options.limit || 5,
          scrapeOptions: {
            formats: options.formats || ['markdown'],
            includeTags: options.includeTags,
            excludeTags: options.excludeTags,
            onlyMainContent: options.onlyMainContent !== false
          },
          timeout: options.timeout || 30000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
      }

      const result = await response.json() as any;
      
      if (!result.success) {
        throw new Error(`Firecrawl search failed: ${result.error || 'Unknown error'}`);
      }

      context.logger('info', `Search completed: ${query}`, {
        query,
        resultsCount: result.data?.length || 0
      });

      return {
        success: true,
        data: {
          query,
          results: result.data.map((item: any) => ({
            url: item.metadata?.sourceURL || item.url,
            title: item.metadata?.title || 'No title',
            description: item.metadata?.description || 'No description',
            content: item.markdown || item.html || '',
            markdown: item.markdown,
            html: item.html,
            metadata: item.metadata
          }))
        },
        metadata: {
          searchQuery: query,
          searchedAt: new Date().toISOString(),
          resultsCount: result.data?.length || 0
        }
      };
    } catch (error) {
      context.logger('error', `Failed to search web: ${query}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          searchQuery: query,
          attemptedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Extract structured data from URL
   */
  async extractData(
    url: string,
    schema: Record<string, any>,
    options: {
      timeout?: number;
    } = {},
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    try {
      context.logger('info', `Extracting structured data from: ${url}`, { url, schema });

      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url,
          formats: ['json'],
          jsonOptions: {
            schema
          },
          timeout: options.timeout || 30000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
      }

      const result = await response.json() as any;
      
      if (!result.success) {
        throw new Error(`Firecrawl extraction failed: ${result.error || 'Unknown error'}`);
      }

      context.logger('info', `Successfully extracted data from: ${url}`, {
        url,
        extractedFields: Object.keys(result.data.json || {})
      });

      return {
        success: true,
        data: {
          url,
          extractedData: result.data.json,
          metadata: result.data.metadata
        },
        metadata: {
          sourceUrl: url,
          extractedAt: new Date().toISOString(),
          schema: Object.keys(schema)
        }
      };
    } catch (error) {
      context.logger('error', `Failed to extract data from: ${url}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          sourceUrl: url,
          attemptedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Check if the tool is properly configured
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          url: 'https://example.com',
          formats: ['markdown']
        })
      });

      return response.status !== 401; // Not unauthorized
    } catch (error) {
      return false;
    }
  }

  /**
   * Get tool information
   */
  static getToolInfo() {
    return {
      name: 'firecrawl',
      description: 'Web scraping and search tool using Firecrawl API',
      version: '1.0.0',
      author: 'Requesty CLI',
      capabilities: [
        'scrape_url',
        'crawl_website',
        'search_web',
        'extract_data'
      ],
      requiredAuth: ['firecrawl_api_key'],
      documentation: 'https://docs.firecrawl.dev/api-reference/introduction'
    };
  }
}