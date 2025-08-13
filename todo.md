# mdtail.dev

A simple terminal app that displays and live-refreshes markdown files.

## Current Features
- [x] Display todo.md file in terminal
- [x] Live refresh when file changes
- [x] Clear screen on updates
- [x] Formatted output with borders
- [x] Graceful exit with Ctrl+C
- [x] Full terminal width borders
- [x] Hidden cursor for cleaner display
- [x] Development mode with nodemon

## Next Steps
- [ ] Add command-line arguments for different files
- [ ] Support for checking/unchecking items
- [ ] Add new todo items from terminal
- [ ] Color-coded output for completed/pending items
- [ ] Support multiple todo files
- [ ] Export to different formats

## Technical Details
- Built with Node.js
- Uses fs.watchFile for live updates
- No external dependencies
- Refreshes every 100ms when changes detected