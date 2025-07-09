# 🏗️ Requesty CLI - Code Architecture Documentation

## 📂 Project Structure

```
requesty-cli/
├── src/
│   ├── cli/                    # Command-line interface
│   │   └── index.ts           # Main CLI entry point
│   ├── core/                   # Core business logic
│   │   ├── api.ts             # Requesty API client
│   │   ├── streaming.ts       # Streaming functionality
│   │   └── types.ts           # Core type definitions
│   ├── models/                 # Model data and utilities
│   │   └── models.ts          # Model definitions and providers
│   ├── pdf-chat/              # PDF chat functionality
│   │   ├── core/              # PDF chat core logic
│   │   │   ├── conversation-manager.ts
│   │   │   └── pdf-chat-client.ts
│   │   ├── converters/        # PDF conversion utilities
│   │   │   └── pdf-converter.ts
│   │   ├── prompts/           # AI prompts and templates
│   │   │   └── system-prompt.ts
│   │   ├── types/             # PDF chat type definitions
│   │   │   └── chat-types.ts
│   │   ├── ui/                # PDF chat user interface
│   │   │   └── chat-interface.ts
│   │   └── index.ts           # PDF chat exports
│   ├── storage/               # Data storage utilities
│   │   └── key-store.ts       # Encrypted key storage
│   ├── ui/                    # User interface components
│   │   ├── console-formatter.ts
│   │   ├── dynamic-table.ts
│   │   ├── interactive-ui.ts
│   │   ├── response-display.ts
│   │   ├── summary-display.ts
│   │   ├── table-renderer.ts
│   │   └── ui.ts
│   └── utils/                 # Utility functions
│       ├── file-validator.ts
│       ├── key-manager.ts
│       └── pricing.ts
├── dist/                      # Compiled JavaScript output
├── node_modules/              # Dependencies
├── package.json               # Project configuration
├── tsconfig.json              # TypeScript configuration
├── README.md                  # Project documentation
├── FEATURES-BRAINSTORM.md     # Feature brainstorming
└── CODE-ARCHITECTURE.md       # This file
```

## 🧩 Architecture Principles

### 1. **Separation of Concerns**
- **CLI Layer**: Handle command-line arguments and routing
- **Core Layer**: Business logic and API interactions
- **UI Layer**: User interface and presentation
- **Utils Layer**: Reusable utility functions
- **Storage Layer**: Data persistence and management

### 2. **Modularity**
- Each module has a single responsibility
- Loose coupling between modules
- High cohesion within modules
- Clear interfaces between components

### 3. **Type Safety**
- Full TypeScript implementation
- Comprehensive type definitions
- Interface-based design
- Type guards and validation

### 4. **Error Handling**
- Comprehensive error catching
- User-friendly error messages
- Graceful degradation
- Proper error propagation

### 5. **Code Quality**
- Clean, readable code
- Consistent naming conventions
- Proper documentation
- Small, focused functions

## 🔧 Component Details

### 📱 **CLI Layer** (`src/cli/`)

#### `index.ts` - Main Entry Point
- **Responsibility**: Command-line argument parsing and routing
- **Dependencies**: Commander.js, core components
- **Key Features**:
  - Command definition and parsing
  - Configuration management
  - Error handling and user feedback
  - PDF chat integration

```typescript
// Key interfaces
interface CLIConfig {
  apiKey?: string;
  baseURL: string;
  timeout: number;
  temperature: number;
}

class RequestyCLI {
  private api: RequestyAPI;
  private streaming: StreamingClient;
  private ui: InteractiveUI;
  // ... implementation
}
```

### 🎯 **Core Layer** (`src/core/`)

#### `api.ts` - Requesty API Client
- **Responsibility**: HTTP API communication with Requesty
- **Features**:
  - Model listing and information
  - Chat completion requests
  - Error handling and retries
  - Response parsing

#### `streaming.ts` - Streaming Client
- **Responsibility**: Real-time streaming responses
- **Features**:
  - Server-sent events handling
  - Token counting and timing
  - Progress tracking
  - Stream interruption handling

#### `types.ts` - Core Type Definitions
- **Responsibility**: Central type definitions for the entire application
- **Key Types**:
  - `ModelInfo`: AI model information
  - `ChatMessage`: Chat message structure
  - `ChatCompletionRequest/Response`: API request/response types
  - `ModelResult`: Test result structure
  - `CLIConfig`: Configuration interface

### 🎨 **UI Layer** (`src/ui/`)

#### `console-formatter.ts` - Styling Utilities
- **Responsibility**: Centralized console styling and formatting
- **Features**:
  - Consistent color schemes
  - Text formatting utilities
  - Dark mode compatibility
  - Reusable formatting functions

#### `interactive-ui.ts` - Main UI Controller
- **Responsibility**: User interaction and menu systems
- **Features**:
  - Interactive menus
  - User input handling
  - Model selection
  - Progress display

#### `dynamic-table.ts` - Results Display
- **Responsibility**: Real-time results visualization
- **Features**:
  - Live updating tables
  - Performance metrics
  - Response display
  - Error visualization

### 📄 **PDF Chat Module** (`src/pdf-chat/`)

#### Core Components (`core/`)

##### `pdf-chat-client.ts` - Main Client
- **Responsibility**: Primary PDF chat functionality
- **Features**:
  - Session management
  - API communication
  - Streaming responses
  - Conversation flow control

##### `conversation-manager.ts` - Chat Management
- **Responsibility**: Conversation state and flow management
- **Features**:
  - Message history tracking
  - Context management
  - API message formatting
  - Session persistence

#### Converters (`converters/`)

##### `pdf-converter.ts` - PDF Processing
- **Responsibility**: PDF to markdown conversion
- **Features**:
  - PDF text extraction
  - Markdown formatting
  - Structure detection
  - Content analysis

#### Prompts (`prompts/`)

##### `system-prompt.ts` - AI Prompts
- **Responsibility**: AI system prompts and templates
- **Features**:
  - Expert system prompt
  - Response guidelines
  - Citation formatting
  - Analysis frameworks

#### Types (`types/`)

##### `chat-types.ts` - PDF Chat Types
- **Responsibility**: Type definitions for PDF chat functionality
- **Key Types**:
  - `PDFContent`: PDF document structure
  - `ChatMessage`: Chat message with metadata
  - `PDFChatSession`: Session information
  - `ChatResponse`: API response structure

#### UI (`ui/`)

##### `chat-interface.ts` - Chat Interface
- **Responsibility**: PDF chat user interface
- **Features**:
  - Interactive chat loop
  - Command handling
  - Session information display
  - Help system

### 🛠️ **Utils Layer** (`src/utils/`)

#### `file-validator.ts` - File Validation
- **Responsibility**: File system operations and validation
- **Features**:
  - File existence checking
  - PDF format validation
  - File information extraction
  - Error handling

#### `key-manager.ts` - API Key Management
- **Responsibility**: Secure API key handling
- **Features**:
  - Key retrieval and storage
  - User interaction for key input
  - Encryption/decryption
  - Key validation

#### `pricing.ts` - Cost Calculation
- **Responsibility**: Token usage and pricing calculations
- **Features**:
  - Token counting
  - Cost computation
  - Pricing models
  - Usage analytics

### 💾 **Storage Layer** (`src/storage/`)

#### `key-store.ts` - Encrypted Storage
- **Responsibility**: Secure local data storage
- **Features**:
  - Encryption/decryption
  - Key-value storage
  - File system persistence
  - Error handling

## 🔄 Data Flow

### 1. **CLI Initialization**
```
User Input → Commander.js → CLI Router → Component Initialization
```

### 2. **Model Testing Flow**
```
User Selection → API Client → Streaming Client → Results Display
```

### 3. **PDF Chat Flow**
```
PDF Upload → PDF Converter → Conversation Manager → AI Client → User Interface
```

### 4. **Configuration Flow**
```
CLI Args → Environment Variables → Key Manager → Configuration Object
```

## 🏆 Design Patterns

### 1. **Singleton Pattern**
- Used for: Configuration management, API clients
- Benefits: Consistent state, resource efficiency

### 2. **Factory Pattern**
- Used for: Component creation, configuration objects
- Benefits: Flexible object creation, dependency injection

### 3. **Observer Pattern**
- Used for: Streaming updates, progress tracking
- Benefits: Real-time updates, loose coupling

### 4. **Strategy Pattern**
- Used for: Response formatting, different UI modes
- Benefits: Flexible algorithms, extensibility

### 5. **Command Pattern**
- Used for: CLI commands, user actions
- Benefits: Encapsulation, undo/redo capability

## 🔍 Quality Assurance

### 1. **Code Quality**
- **ESLint**: Code style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Jest**: Unit testing

### 2. **Error Handling**
- **Try-catch blocks**: Comprehensive error catching
- **Error types**: Specific error classifications
- **User feedback**: Clear error messages
- **Graceful degradation**: Fallback behaviors

### 3. **Performance**
- **Streaming**: Real-time response processing
- **Caching**: Configuration and model caching
- **Memory management**: Efficient resource usage
- **Async operations**: Non-blocking operations

### 4. **Security**
- **Input validation**: All user inputs validated
- **Encryption**: Sensitive data encrypted
- **Key management**: Secure API key handling
- **HTTPS**: Secure API communication

## 🚀 Extensibility

### 1. **Plugin Architecture**
- **Modular design**: Easy to add new features
- **Interface-based**: Clear extension points
- **Dependency injection**: Flexible component composition

### 2. **Configuration System**
- **Environment variables**: Runtime configuration
- **Config files**: Persistent settings
- **CLI arguments**: Per-execution options

### 3. **Component Registration**
- **Auto-discovery**: Automatic component loading
- **Registration system**: Dynamic component registration
- **Lifecycle management**: Component initialization and cleanup

## 📊 Metrics and Monitoring

### 1. **Performance Metrics**
- **Response times**: API call timing
- **Token usage**: Token consumption tracking
- **Memory usage**: Resource utilization
- **Error rates**: Error frequency monitoring

### 2. **User Analytics**
- **Feature usage**: Most used features
- **User flows**: Common user paths
- **Error patterns**: Common error scenarios
- **Performance bottlenecks**: Slow operations

### 3. **System Health**
- **API availability**: Service uptime
- **Response quality**: Response accuracy
- **Resource usage**: System resource consumption
- **Error tracking**: Error frequency and types

## 🔧 Development Workflow

### 1. **Development Process**
- **Feature branches**: Separate development branches
- **Code review**: Mandatory peer review
- **Testing**: Comprehensive test coverage
- **Documentation**: Keep documentation updated

### 2. **Build Process**
- **TypeScript compilation**: Source to JavaScript
- **Bundling**: Module bundling and optimization
- **Minification**: Code size optimization
- **Distribution**: Package for distribution

### 3. **Deployment**
- **Automated builds**: CI/CD pipeline
- **Version management**: Semantic versioning
- **Release notes**: Changelog generation
- **Distribution**: NPM package distribution

## 🎯 Future Considerations

### 1. **Scalability**
- **Microservices**: Service decomposition
- **Database integration**: Persistent storage
- **Caching layer**: Performance optimization
- **Load balancing**: Request distribution

### 2. **Multi-platform Support**
- **Cross-platform**: Windows, Mac, Linux
- **Mobile apps**: iOS and Android
- **Web interface**: Browser-based UI
- **API endpoints**: RESTful API

### 3. **Advanced Features**
- **AI enhancements**: Better AI integration
- **Collaboration**: Team features
- **Analytics**: Advanced analytics
- **Integrations**: Third-party integrations

---

*This architecture document should be updated as the codebase evolves and new features are added.*