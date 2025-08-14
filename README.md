# mdtail.dev

[![npm version](https://badge.fury.io/js/mdtail.svg)](https://www.npmjs.com/package/mdtail)
[![Test Status](https://img.shields.io/github/actions/workflow/status/super3/mdtail.dev/ci.yml?branch=main&label=tests)](https://github.com/super3/mdtail.dev/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/super3/mdtail.dev/badge.svg?branch=main)](https://coveralls.io/github/super3/mdtail.dev?branch=main)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?label=license)](https://github.com/super3/mdtail.dev/blob/main/LICENSE)

A simple terminal app that displays and live-refreshes markdown files.

## Features

- 📝  Display markdown files in terminal with formatted output
- 🔄  Live refresh when file changes (100ms polling)
- 🎨  Clean bordered display
- 🖥   Full terminal width support
- 👻  Hidden cursor for distraction-free viewing
- ⌨   Arrow key navigation for switching between multiple files
- ⚡  Zero dependencies - pure Node.js

## Installation

### npm (Recommended)
```bash
npm install -g mdtail
```

### From Source
```bash
git clone https://github.com/super3/mdtail.dev.git && cd mdtail.dev
npm install
npm link                           # Install mdtail command globally
```

## Usage

```bash
mdtail                             # Watch TODO.md (default)
mdtail README.md                   # Watch specific file
mdtail *.md                        # Watch all markdown files with tabs
mdtail TODO.md README.md           # Watch multiple specific files
mdtail --help                      # Show help
```

### Navigation
- Use ← / → arrow keys to switch between tabs when watching multiple files
- Press Ctrl+C to exit