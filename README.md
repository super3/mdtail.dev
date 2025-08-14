# mdtail.dev

A simple terminal app that displays and live-refreshes markdown files.

## Features

- 📝 Display markdown files in terminal with formatted output
- 🔄 Live refresh when file changes (100ms polling)
- 🎨 Clean bordered display
- 🖥️ Full terminal width support
- 👻 Hidden cursor for distraction-free viewing
- ⌨️ Arrow key navigation for switching between multiple files
- ⚡ Zero dependencies - pure Node.js

## Installation

```bash
git clone https://github.com/super3/mdtail.dev.git && cd mdtail.dev
npm install
```

## Usage

### Local
```bash
npm start                          # Watch TODO.md (default)
```

### Global Installation
```bash
npm link                           # Install mdtail command globally
mdtail                             # Watch TODO.md
mdtail README.md                   # Watch specific file
mdtail *.md                        # Watch all markdown files with tabs
mdtail TODO.md README.md           # Watch multiple specific files
```

### Navigation
- Use ← / → arrow keys to switch between tabs when watching multiple files
- Press Ctrl+C to exit