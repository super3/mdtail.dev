# CLAUDE.md - AI Assistant Instructions

## Important Rules

1. **Test Coverage**: Please run test/coverage before and after any work. Coverage needs to be 100% for a task to be complete.
   ```bash
   npm run test:coverage
   ```

2. **No Commits Without Permission**: Don't commit or push code unless I explicitly tell you to.

3. **Code Quality Standards**:
   - Maintain 100% test coverage at all times
   - Follow existing code style and patterns
   - Use CommonJS modules (not ES6 modules) for compatibility
   - Keep the zero-dependency philosophy

## Project Structure

```
mdtail.dev/
├── lib/
│   ├── mdtail.js        # Main application class
│   ├── display.js       # Terminal display logic
│   ├── fileManager.js   # File operations and watching
│   └── errors.js        # Custom error classes
├── test/
│   ├── mdtail.test.js              # Core unit tests
│   ├── mdtail.integration.test.js  # Integration tests
│   ├── mdtail.edge.test.js         # Edge cases
│   ├── display.test.js             # Display module tests
│   ├── fileManager.test.js         # File manager tests
│   └── errors.test.js              # Error classes tests
├── index.js              # CLI entry point
├── index.d.ts            # TypeScript definitions
└── package.json

```

## Testing Commands

```bash
npm test                  # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

## Common Tasks

### Adding New Features
1. Run tests first to ensure 100% coverage: `npm run test:coverage`
2. Implement the feature
3. Add comprehensive tests for the new feature
4. Run tests again to ensure 100% coverage is maintained
5. Do NOT commit unless explicitly asked

### Refactoring
1. Run tests first to ensure 100% coverage
2. Make refactoring changes
3. Ensure all tests still pass
4. Verify 100% coverage is maintained
5. Do NOT commit unless explicitly asked

### Bug Fixes
1. Add a failing test that reproduces the bug
2. Fix the bug
3. Ensure the test now passes
4. Verify 100% coverage is maintained
5. Do NOT commit unless explicitly asked

## Key Implementation Details

- **File Watching**: Uses `fs.watchFile` with 100ms polling interval
- **Terminal Features**: Graceful degradation for non-TTY environments
- **Error Handling**: Custom error classes with helpful suggestions
- **Display**: ANSI escape codes with fallbacks for limited terminals
- **Navigation**: Arrow keys for multi-file tab switching

## NPM Publishing

The package is published as `mdtail` on npm. When preparing releases:
1. Ensure all tests pass with 100% coverage
2. Update version in package.json
3. Test the package locally with `npm pack`
4. Only publish after explicit approval