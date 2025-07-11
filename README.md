# Requesty CLI

[![npm version](https://img.shields.io/npm/v/requesty-cli.svg)](https://www.npmjs.com/package/requesty-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/requesty-cli.svg)](https://nodejs.org)

![Requesty CLI Demo](https://raw.githubusercontent.com/thibaultjaigu/requesty-cli/main/assets/demo.gif)

This repository contains the Requesty CLI, a command-line AI workflow tool that connects to multiple AI models, enabling model comparison, interactive chat, and intelligent PDF document analysis.

With the Requesty CLI you can:

- **Compare AI models** side-by-side with streaming responses and real-time performance metrics
- **Chat interactively** with your favorite AI models in a ChatGPT-style terminal experience
- **Analyze PDF documents** using AI to extract insights and answer questions about your documents
- **Access 100+ AI models** from OpenAI, Anthropic, Google, Mistral, xAI, and more
- **Stream responses** in real-time with beautiful terminal formatting
- **Track usage and costs** with built-in analytics and feedback systems

## 🚀 Quickstart

**Prerequisites:** Ensure you have Node.js version 18 or higher installed.

### Install and Run

Execute the following command in your terminal:

```bash
npm install -g requesty-cli
requesty
```

Or run directly with npx:

```bash
npx requesty-cli
```

### Get Your API Key

1. **Sign up** at [Requesty.ai](https://requesty.ai) for a free account
2. **Generate an API key** from your dashboard
3. **Set it** as an environment variable:

```bash
export REQUESTY_API_KEY="your-api-key-here"
```

You are now ready to use the Requesty CLI!

## 📖 Examples

Once the CLI is running, you can start interacting with AI models from your terminal.

### Quick Model Comparison

Test multiple models with a single prompt:

```bash
requesty
> 🚀 Quick Start (5 default models)

# Or compare specific models
requesty quick-start "Explain quantum computing" true "gpt-4o,claude-3-5-sonnet"
```

### Interactive AI Chat

Start a ChatGPT-style conversation:

```bash
requesty chat
> 💬 Regular Chat (ChatGPT-style)
> Choose your model: Claude Sonnet 4
> 💬 You: Help me write a Python web scraper
> 🤖 AI: I'll help you create a Python web scraper...
```

Or start directly with a specific model:

```bash
requesty chat openai/gpt-4o
requesty chat anthropic/claude-sonnet-4-20250514
```

### PDF Document Analysis

Chat with your PDF documents:

```bash
requesty pdf-chat research-paper.pdf
> 🔍 Your first question about the PDF: What are the main findings?
> 🤖 Assistant: Based on the document, the main findings are...
```

## 🎯 Features

### Model Comparison
- **Side-by-side testing** of multiple AI models
- **Streaming responses** with real-time output
- **Performance metrics** including response time, token usage, and cost
- **Customizable model selection** from 100+ available models

### Interactive Chat
- **Continuous conversations** with context retention
- **Featured models** with smart categorization
- **Recent models** sorted by creation date
- **Built-in commands**: `help`, `info`, `summary`, `clear`, `exit`
- **Feedback system** to improve response quality

### PDF Analysis
- **Intelligent document parsing** with markdown conversion
- **Context-aware responses** based on document content
- **Multi-turn conversations** about your documents
- **Support for complex PDFs** including technical papers and reports

### Security & Performance
- **Secure API key storage** with encryption
- **Rate limiting** and request management
- **Response caching** for improved performance
- **Comprehensive error handling** and recovery

## 🛠️ Commands

### Interactive Mode
```bash
requesty                    # Start interactive menu
```

### Direct Commands
```bash
requesty chat [model]       # Start chat session
requesty pdf-chat <file>    # Analyze PDF document
requesty security           # Check security status
requesty --help            # Show help information
```

### Command Options
```bash
# Global options
-k, --api-key <key>        # API key for authentication
-t, --timeout <ms>         # Request timeout (default: 60000)
--temperature <temp>       # Response temperature (default: 0.7)

# Chat options
requesty chat --temperature 0.9 --timeout 30000

# PDF chat options
requesty pdf-chat document.pdf --model openai/gpt-4o
```

## 🔧 Configuration

### Environment Variables
```bash
REQUESTY_API_KEY="your-api-key"    # Your Requesty API key
DEBUG=true                         # Enable debug logging
```

### Supported Models

The CLI supports models from multiple providers:

- **OpenAI**: GPT-4o, GPT-4.1 Turbo, GPT-4 Mini
- **Anthropic**: Claude Sonnet 4, Claude Haiku 4
- **Google**: Gemini 2.5 Flash, Gemini 2.0 Pro
- **Mistral**: Mistral Large, Mixtral
- **xAI**: Grok 2.5
- **DeepSeek**: DeepSeek V3
- And many more...

## 🚀 Popular Workflows

### Development Assistant
```bash
> Help me refactor this function to use async/await
> Write unit tests for the authentication module
> Explain this regex pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
```

### Document Research
```bash
requesty pdf-chat specification.pdf
> Summarize the technical requirements
> What are the API endpoints described?
> Generate implementation notes based on section 3
```

### Learning & Exploration
```bash
> Explain the differences between TCP and UDP
> Show me examples of Python decorators
> How do I implement a binary search tree?
```

### Content Creation
```bash
> Write a professional email declining a meeting
> Create a README template for my project
> Generate test data for a user database
```

## 📦 Installation Options

### Global Installation (Recommended)
```bash
npm install -g requesty-cli
```

### Local Project Installation
```bash
npm install --save-dev requesty-cli
```

### Development Setup
```bash
git clone https://github.com/thibaultjaigu/requesty-cli
cd requesty-cli
npm install
npm run build
npm link
```

## 🔍 Troubleshooting

### API Key Issues
```bash
# Check if key is set
echo $REQUESTY_API_KEY

# Set key for current session
export REQUESTY_API_KEY="your-key"

# Set key permanently (add to ~/.bashrc or ~/.zshrc)
echo 'export REQUESTY_API_KEY="your-key"' >> ~/.bashrc
```

### Connection Problems
- Ensure you have an active internet connection
- Check if you're behind a corporate firewall
- Verify the API endpoint is accessible: `curl https://router.requesty.ai/v1/models`

### Performance Tips
- Use streaming mode for faster perceived responses
- Select appropriate models for your use case (smaller models for simple tasks)
- Enable response caching for repeated queries

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run in development mode
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [requesty.ai](https://requesty.ai)
- **Documentation**: [docs.requesty.ai](https://docs.requesty.ai)
- **API Reference**: [api.requesty.ai](https://api.requesty.ai)
- **Support**: [support@requesty.ai](mailto:support@requesty.ai)

## 🙏 Acknowledgments

Built with ❤️ by the Requesty team. Special thanks to all contributors and the open-source community.

---

**Note**: Requesty CLI is in active development. Features and commands may change. Always refer to `requesty --help` for the most up-to-date information.