# mdtail.dev

A simple terminal app that displays and live-refreshes markdown files, similar to `tail -f` but for rendered markdown.

## Features

- 📝 Display markdown files in terminal with formatted output
- 🔄 Live refresh when file changes (100ms polling)
- 🎨 Clean bordered display
- 🖥️ Full terminal width support
- 👻 Hidden cursor for distraction-free viewing
- ⚡ Zero dependencies - pure Node.js

## Installation

```bash
git clone https://github.com/super3/mdtail.dev.git
cd mdtail.dev
npm install
```

## Usage

```bash
npm start
```

This will display `todo.md` and auto-refresh whenever the file changes. Press `Ctrl+C` to exit.

## Development

For development with auto-restart on code changes:

```bash
npm run dev
```

## Why mdtail.dev?

Unlike more complex markdown viewers like Glow or mdv, mdtail.dev focuses on doing one thing well: displaying a markdown file with live updates. It's perfect for keeping your todo list, notes, or documentation visible while you work.

## License

MIT