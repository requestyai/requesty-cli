# 🚀 Requesty CLI v2.0

A beautiful, interactive TypeScript CLI for testing AI models with **real-time streaming responses** and gorgeous terminal UI.

## ✨ Features

- 🎨 **Beautiful Interactive UI** - Gradient text, progress bars, and colorful displays
- 📡 **Real-time Streaming** - Server-sent events with live token-per-second metrics
- 🎯 **Smart Model Selection** - Provider-based organization with sensible defaults
- 📊 **Live Progress Tracking** - Visual progress bars with speed indicators
- 🔄 **Persistent Session** - Stay in the CLI, test multiple prompts
- 🌈 **Rich Terminal Experience** - Tables, spinners, and beautiful formatting
- 📄 **PDF Chat** - Upload and chat with PDF documents using AI
- 👍 **Feedback System** - Give thumbs up/down feedback after each AI response

## 🎯 Default Models

The CLI comes pre-configured with these high-quality models:

- **OpenAI**: `gpt-4.1` - Latest GPT-4 model
- **Alibaba**: `qwen-max` - Qwen's most capable model  
- **Anthropic**: `claude-sonnet-4-20250514` - Claude 4 Sonnet
- **Google**: `gemini-2.5-flash` - Fast Gemini model
- **Google**: `gemini-2.5-pro` - Pro Gemini model

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
# Clone or download the CLI
cd requesty-cli

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Make it executable
chmod +x dist/index.js
```

### Optional: Install globally
```bash
npm install -g .
# Now you can use 'requesty' from anywhere
```

## 🚀 Usage

### Basic Usage
```bash
node dist/index.js
```

### With API Key
```bash
REQUESTY_API_KEY=your-api-key node dist/index.js
```

### With Custom Options
```bash
node dist/index.js --api-key your-key --max-tokens 1000 --temperature 0.8
```

## 📄 PDF Chat with Feedback

### Upload and Chat with PDFs
```bash
# Basic PDF chat
node dist/cli/index.js pdf-chat path/to/document.pdf

# With custom model and options
node dist/cli/index.js pdf-chat document.pdf -m openai/gpt-4o --temperature 0.5
```

### PDF Chat Flow

1. **PDF Upload & Processing**
   ```
   📄 Converting PDF to markdown...
   ✅ Successfully processed PDF:
      📄 File: document.pdf
      📊 Pages: 25
      📝 Words: 8,542
      🔤 Characters: 52,031
   🚀 PDF chat session initialized!
   💡 Ask your first question about the document...
   ```

2. **Interactive Chat**
   ```
   🔍 Your first question about the PDF: What are the main topics covered?
   
   🤖 Expert Analysis:
   [AI streams response in real-time...]
   
   ⏱️  Response time: 1,247ms
   ```

3. **Feedback System** (NEW!)
   ```
   Give feedback? (u = 👍, d = 👎, enter to skip): u
   Sending feedback 👍...
   ✅ Feedback sent successfully! 👍
   
   💬 Your follow-up question: Tell me more about section 3...
   ```

### PDF Chat Commands
- **Ask questions** - Any question about the PDF content
- **"info"** - Show session information (pages, words, model, etc.)
- **"summary"** - Show conversation summary
- **"help"** - Show available commands
- **"exit"** or **"quit"** - End the session

### Feedback System
After each AI response, you'll see:
```
Give feedback? (u = 👍, d = 👎, enter to skip):
```
- Type **"u"** for thumbs up 👍
- Type **"d"** for thumbs down 👎  
- Press **Enter** to skip
- Feedback is sent to the Requesty feedback API automatically

## 🎮 Interactive Flow

### 1. Welcome Screen
```
██████╗ ███████╗ ██████╗ ██╗   ██╗███████╗███████╗████████╗██╗   ██╗
██╔══██╗██╔════╝██╔═══██╗██║   ██║██╔════╝██╔════╝╚══██╔══╝╚██╗ ██╔╝
██████╔╝█████╗  ██║   ██║██║   ██║█████╗  ███████╗   ██║    ╚████╔╝ 
██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██╔══╝  ╚════██║   ██║     ╚██╔╝  
██║  ██║███████╗╚██████╔╝╚██████╔╝███████╗███████║   ██║      ██║   
╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝      ╚═╝   

🚀 AI Model Testing CLI with Streaming
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Main Menu
```
? What would you like to do?
❯ 🚀 Quick Start (5 default models)
  🎯 Select Models  
  ❌ Exit
```

### 3. Model Selection (if choosing "Select Models")
```
? Select providers:
❯ ◉ OpenAI (128 models)
  ◯ Anthropic (54 models)
  ◉ Google (23 models)
  ◯ Alibaba (3 models)
  ◯ xAI (10 models)
```

### 4. Prompt Input
```
? 💬 Enter your prompt: Write a haiku about programming
```

### 5. Live Streaming Progress
```
✅ Selected Models:
┌───┬───────────┬──────────────────────────────┐
│ # │ Provider  │ Model                        │
├───┼───────────┼──────────────────────────────┤
│ 1 │ OpenAI    │ gpt-4.1                      │
│ 2 │ Alibaba   │ qwen-max                     │
│ 3 │ Anthropic │ claude-sonnet-4-20250514     │
│ 4 │ Google    │ gemini-2.5-flash             │
│ 5 │ Google    │ gemini-2.5-pro               │
└───┴───────────┴──────────────────────────────┘

🚀 Testing 5 models with streaming...

gpt-4.1 |████████████████████████████████████████| 100% | 45 tok/s | 67 tokens | 0.3s
✅ gpt-4.1 completed

📝 gpt-4.1 Response:
────────────────────────────────────────────────────────────
Code flows like stream,
Bugs dance in morning debug—
Coffee fuels the dream.
────────────────────────────────────────────────────────────
```

### 6. Summary Table
```
📊 Summary:
┌─────────────────────────────┬────────┬──────────┬─────────┬────────┐
│ Model                       │ Status │ Duration │ Speed   │ Tokens │
├─────────────────────────────┼────────┼──────────┼─────────┼────────┤
│ gpt-4.1                     │ ✅     │ 1450ms   │ 45 tok/s│ 67     │
│ qwen-max                    │ ✅     │ 1200ms   │ 52 tok/s│ 63     │
│ claude-sonnet-4-20250514    │ ✅     │ 1800ms   │ 38 tok/s│ 71     │
│ gemini-2.5-flash            │ ✅     │ 900ms    │ 67 tok/s│ 58     │
│ gemini-2.5-pro              │ ✅     │ 1100ms   │ 55 tok/s│ 69     │
└─────────────────────────────┴────────┴──────────┴─────────┴────────┘
```

### 7. Continue or Exit
```
? Would you like to test another prompt? (Y/n)
```

## 🎛️ Command Line Options

### Main CLI Options
```bash
Options:
  -k, --api-key <key>          API key for authentication
  -t, --timeout <ms>           Request timeout in milliseconds (default: 60000)
  --temperature <temp>         Temperature for responses (default: 0.7)
  -h, --help                   Display help for command
  -V, --version                Display version number

Commands:
  security                     Show security status and configuration
  pdf-chat <pdf-path>          Chat with a PDF document using AI
```

### PDF Chat Options
```bash
Usage: requesty pdf-chat [options] <pdf-path>

Arguments:
  pdf-path                     Path to the PDF file to chat with

Options:
  -m, --model <model>          AI model to use for chat (default: "openai/gpt-4o")
  -k, --api-key <key>          API key for authentication
  -t, --timeout <ms>           Request timeout in milliseconds (default: "60000")
  --temperature <temp>         Temperature for responses (default: "0.7")
  -h, --help                   Display help for command
```

## 🔐 Authentication

### Environment Variable (Recommended)
```bash
export REQUESTY_API_KEY="your-api-key-here"
```

### Command Line
```bash
node dist/index.js --api-key your-api-key-here
```

## 🌟 Advanced Features

### Real-time Streaming
- **Server-Sent Events (SSE)** - Proper streaming implementation
- **Live Token Metrics** - Tokens per second, total tokens
- **Progress Visualization** - Beautiful progress bars with ETA
- **Speed Indicators** - Real-time processing speed

### Model Organization
- **Provider-based Grouping** - Models organized by provider
- **Smart Defaults** - Curated selection of best models
- **Flexible Selection** - Choose any combination of models
- **Model Metadata** - Provider info, model names, capabilities

### Session Management
- **Persistent CLI** - Stay in the CLI for multiple tests
- **Quick Restart** - Easy to test different prompts
- **Graceful Exit** - Clean shutdown with goodbye message

## 🎨 Visual Experience

The CLI features:
- **Gradient Text** - Beautiful rainbow gradients for headers
- **Progress Bars** - Real-time progress with custom themes
- **Spinners** - Elegant loading animations
- **Tables** - Clean, formatted result displays
- **Color Coding** - Status indicators, provider colors
- **Figlet Art** - ASCII art title screen

## 🔧 Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

## 📝 Example Session

```bash
$ node dist/index.js

██████╗ ███████╗ ██████╗ ██╗   ██╗███████╗███████╗████████╗██╗   ██╗
██╔══██╗██╔════╝██╔═══██╗██║   ██║██╔════╝██╔════╝╚══██╔══╝╚██╗ ██╔╝
██████╔╝█████╗  ██║   ██║██║   ██║█████╗  ███████╗   ██║    ╚████╔╝ 
██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██╔══╝  ╚════██║   ██║     ╚██╔╝  
██║  ██║███████╗╚██████╔╝╚██████╔╝███████╗███████║   ██║      ██║   
╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝      ╚═╝   

🚀 AI Model Testing CLI with Streaming
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Loaded 10 providers with 338 models

? What would you like to do?
❯ 🚀 Quick Start (5 default models)

? 💬 Enter your prompt: Explain quantum computing in simple terms

🚀 Testing 5 models with streaming...

gpt-4.1 |████████████████████████████████████████| 100% | 42 tok/s | 156 tokens | 0.8s
✅ gpt-4.1 completed

📝 gpt-4.1 Response:
────────────────────────────────────────────────────────────
Quantum computing is like having a magical calculator that can try many solutions at once...
[streaming response continues...]
────────────────────────────────────────────────────────────

? Would you like to test another prompt? Yes

? 💬 Enter your prompt: Write a Python function to sort a list

[Process continues...]
```

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Permission Errors:**
```bash
chmod +x dist/index.js
```

**API Key Issues:**
```bash
export REQUESTY_API_KEY="your-key"
# or
echo 'export REQUESTY_API_KEY="your-key"' >> ~/.bashrc
```

**Streaming Issues:**
- Ensure stable internet connection
- Check firewall settings for SSE support
- Verify API key has streaming permissions

## 📈 Performance

- **Streaming**: Real-time token processing
- **Concurrent**: Smart batching for better UX
- **Efficient**: Minimal memory usage
- **Responsive**: Immediate visual feedback

## 🛡️ Security

- API keys can be passed via environment variables
- No logging of sensitive data
- Secure HTTPS connections to Requesty API
- Token-based authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

---

**Made with ❤️ by Claude Code & Claude Flow Hive Mind**# requesty-cli
