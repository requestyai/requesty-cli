# Requesty CLI - Project Structure

## 📁 Folder Organization

```
src/
├── cli/           # Main CLI entry point
├── core/          # Core functionality (API, streaming, types)
├── models/        # Model definitions and providers
├── storage/       # Encrypted key storage
├── ui/            # User interface components
└── utils/         # Utility functions and helpers
```

## 🔑 Key Features

### Encrypted API Key Storage
- **Automatic key management**: Prompts for API key on first run
- **Secure encryption**: Uses AES-256-CBC with machine-specific salt
- **Persistent storage**: Stored in `~/.requesty/key.enc`
- **Cross-session support**: Remembers key between CLI sessions

### Improved Table Display
- **Fixed header duplication**: Headers only show once
- **Smooth updates**: Table updates in place without flickering
- **Streaming vs Non-streaming**: Different update patterns for each mode

### Enhanced Timing Analysis
- **Detailed metrics**: Average, fastest, slowest, median times
- **Model comparison**: Shows which models performed best/worst
- **Token usage**: Comprehensive token counting and analysis

### Response Control
- **User choice**: Ask before showing full response content
- **Clean output**: Focus on timing and performance by default
- **Optional details**: Full responses available on request

## 🏗️ Architecture

### Small, Reusable Components
- **TableRenderer**: Handles table display logic
- **ResponseDisplay**: Manages response output
- **SummaryDisplay**: Shows final statistics
- **KeyManager**: Handles API key operations
- **EncryptedKeyStore**: Secure key storage

### Clean Separation
- **CLI layer**: User interaction and flow control
- **Core layer**: Business logic and API communication
- **UI layer**: Display and formatting
- **Storage layer**: Persistent data management
- **Utils layer**: Helper functions and utilities

## 🚀 Usage

```bash
# First run - prompts for API key
npx requesty

# Subsequent runs - uses stored key
npx requesty
```

The CLI will:
1. Check for stored API key
2. Prompt for key if not found (with option to store)
3. Load available models
4. Present interactive menu
5. Run tests with real-time table updates
6. Show timing analysis and optional responses