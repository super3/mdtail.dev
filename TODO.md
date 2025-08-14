# mdtail.dev

A simple terminal app that displays and live-refreshes markdown files.

## Current Features
- [x] Display markdown files in terminal
- [x] Live refresh when file changes
- [x] Clear screen on updates
- [x] Formatted output with borders
- [x] Graceful exit with Ctrl+C
- [x] Full terminal width borders
- [x] Hidden cursor for cleaner display
- [x] Support for multiple markdown files with tabs
- [x] Arrow key navigation between tabs (← →)
- [x] Global CLI installation with npm link
- [x] Wildcard support (*.md)
- [x] Help system (--help)
- [x] Default to TODO.md when no files specified

## Testing & Quality
- [x] Comprehensive test suite with Jest
- [x] 100% code coverage (statements, branches, functions, lines)
- [x] 61 unit tests covering all functionality
- [x] Modular architecture (lib/mdtail.js)
- [x] GitHub Actions CI/CD pipeline
- [x] Automated testing on push and PRs
- [x] Coverage reporting with Coveralls integration

## Code Refactoring
- [ ] Test consolidation - Merge 5 test files into 2-3 focused files
- [ ] Extract display logic into separate Display class
- [ ] Separate file management into FileManager class
- [ ] Create configuration object for settings
- [ ] Convert to ES6 modules (import/export)
- [ ] Use async/await for file operations
- [ ] Replace fs.watchFile with fs.watch or chokidar
- [ ] Simplify display with single render() method
- [ ] Extract ANSI codes to constants
- [ ] Add custom error classes
- [ ] Add chalk for terminal colors
- [ ] Consider blessed/ink for richer TUI
- [ ] Add commander for robust CLI parsing

## Next Steps
- [ ] Publish to npm registry