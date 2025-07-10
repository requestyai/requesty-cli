# Contributing to Requesty CLI

Thank you for your interest in contributing to Requesty CLI! We welcome contributions from the community.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/requestyai/requesty-cli
   cd requesty-cli
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API key
   ```

## 🛠️ Development

### Build and Test
```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Project Structure
```
src/
├── cli/           # CLI commands and orchestration
├── core/          # Core API and streaming functionality
├── pdf-chat/      # PDF chat feature
├── security/      # Security and encryption
├── ui/            # User interface components
└── utils/         # Utility functions
```

## 📝 Code Standards

### TypeScript
- Use TypeScript for all new code
- Follow existing patterns and naming conventions
- Add proper type definitions
- Use JSDoc comments for public APIs

### Code Style
- Follow the existing ESLint configuration
- Use Prettier for formatting
- Write descriptive commit messages
- Keep functions small and focused

### Security
- Never commit API keys or sensitive data
- Use environment variables for configuration
- Follow secure coding practices
- Sanitize user inputs

## 🎯 Types of Contributions

### Bug Reports
- Use the GitHub issue template
- Include reproduction steps
- Provide system information
- Add relevant logs/screenshots

### Feature Requests
- Describe the problem you're solving
- Explain the proposed solution
- Consider backwards compatibility
- Discuss implementation approach

### Code Contributions
- Follow the existing code style
- Add tests for new functionality
- Update documentation if needed
- Ensure all tests pass

## 📋 Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update README if needed

3. **Test thoroughly**:
   ```bash
   npm run build
   npm test
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Use the PR template
   - Link relevant issues
   - Describe your changes clearly
   - Request review from maintainers

## 🔄 Commit Message Convention

We use conventional commits for clear history:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```
feat: add PDF chat streaming support
fix: resolve API timeout issues
docs: update installation instructions
```

## 🧪 Testing

- Write unit tests for new functionality
- Test with different Node.js versions
- Test CLI commands manually
- Verify security features work correctly

## 📚 Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new APIs
- Update examples if needed
- Keep documentation concise and clear

## 🐛 Debugging

### Common Issues
- **Build errors**: Check TypeScript configuration
- **API errors**: Verify API key and endpoint
- **Import issues**: Check file paths and exports

### Debug Mode
```bash
# Enable debug logging
DEBUG=requesty:* npm run dev
```

## 🤝 Community

- Be respectful and inclusive
- Help others in issues and discussions
- Follow the code of conduct
- Share knowledge and best practices

## 🔒 Security

- Report security vulnerabilities privately
- Don't commit sensitive information
- Use secure coding practices
- Keep dependencies updated

## 📞 Getting Help

- **Issues**: For bugs and feature requests
- **Discussions**: For questions and community chat
- **Email**: For security concerns

## 🙏 Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes for significant contributions
- Community showcases

Thank you for contributing to Requesty CLI! 🎉
