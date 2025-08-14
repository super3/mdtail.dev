const fs = require('fs');
const path = require('path');
const readline = require('readline');

class MdTail {
  constructor() {
    this.files = [];
    this.currentTabIndex = 0;
    this.watchers = [];
  }

  parseArguments(args) {
    const helpFlags = ['-h', '--help'];
    
    if (args.some(arg => helpFlags.includes(arg))) {
      return { showHelp: true };
    }

    return { showHelp: false };
  }

  expandFiles(args, currentDir = process.cwd()) {
    const files = [];
    
    if (args.length === 0) {
      // Default to TODO.md in current directory
      const defaultFile = path.join(currentDir, 'TODO.md');
      if (fs.existsSync(defaultFile)) {
        files.push(defaultFile);
      }
    } else {
      args.forEach(arg => {
        if (arg.includes('*')) {
          // Handle wildcards
          const mdFiles = fs.readdirSync(currentDir)
            .filter(file => file.endsWith('.md'))
            .sort()
            .map(f => path.resolve(currentDir, f));
          files.push(...mdFiles);
        } else {
          // Resolve individual file paths
          const filePath = path.resolve(currentDir, arg);
          if (fs.existsSync(filePath) && filePath.endsWith('.md')) {
            files.push(filePath);
          } else if (!filePath.endsWith('.md')) {
            console.error(`Warning: ${arg} is not a markdown file`);
          } else {
            console.error(`Warning: ${arg} not found`);
          }
        }
      });
    }

    // Remove duplicates and set files
    this.files = [...new Set(files)];
    return this.files;
  }

  validateFiles(files) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No markdown files found to watch');
    }
    return true;
  }

  clearScreen() {
    console.clear();
  }

  hideCursor() {
    process.stdout.write('\x1B[?25l');
  }

  showCursor() {
    process.stdout.write('\x1B[?25h');
  }

  renderTabs(files, currentIndex, width = 80) {
    if (files.length <= 1) return '';
    
    const tabs = files.map((file, index) => {
      const filename = path.basename(file);
      const isActive = index === currentIndex;
      
      if (isActive) {
        return `[${filename}]`;
      } else {
        return ` ${filename} `;
      }
    });
    
    const tabLine = tabs.join(' │ ');
    return `${tabLine}\n${'─'.repeat(width)}\n`;
  }

  formatContent(content, filename, width = 80) {
    const lines = [];
    lines.push('\n' + '═'.repeat(width));
    lines.push(filename.toUpperCase());
    lines.push('═'.repeat(width) + '\n');
    lines.push(content);
    lines.push('\n' + '═'.repeat(width));
    return lines.join('\n');
  }

  displayCurrentFile() {
    this.clearScreen();
    this.hideCursor();
    
    const width = process.stdout.columns || 80;
    const currentFile = this.files[this.currentTabIndex];
    
    try {
      const content = fs.readFileSync(currentFile, 'utf8');
      const filename = path.basename(currentFile);
      
      // Header
      console.log('\n' + '═'.repeat(width));
      
      // Tabs (if multiple files)
      if (this.files.length > 1) {
        console.log(this.renderTabs(this.files, this.currentTabIndex, width));
      } else {
        console.log(filename.toUpperCase());
        console.log('═'.repeat(width) + '\n');
      }
      
      // Content
      console.log(content);
      
      // Footer
      console.log('\n' + '═'.repeat(width));
      
      if (this.files.length > 1) {
        console.log(`Tab ${this.currentTabIndex + 1} of ${this.files.length} │ ← → Navigate │ Ctrl+C Exit`);
      } else {
        console.log('Watching for changes... (Ctrl+C to exit)');
      }
    } catch (error) {
      console.error(`Error reading ${currentFile}:`, error.message);
    }
  }

  getHelpText() {
    return `
mdtail - Terminal markdown viewer with live refresh

Usage:
  mdtail [file1.md] [file2.md] ...  Watch specific markdown files
  mdtail                             Watch TODO.md (default)
  mdtail -h, --help                  Show this help message

Navigation:
  ← / → Arrow Keys                   Switch between tabs
  Ctrl+C                             Exit

Examples:
  mdtail README.md                   Watch README.md
  mdtail todo.md notes.md            Watch multiple files with tabs
  mdtail *.md                        Watch all markdown files in tabs
`;
  }

  navigateTab(direction) {
    if (this.files.length <= 1) return false;
    
    if (direction === 'left') {
      this.currentTabIndex = (this.currentTabIndex - 1 + this.files.length) % this.files.length;
    } else if (direction === 'right') {
      this.currentTabIndex = (this.currentTabIndex + 1) % this.files.length;
    } else {
      return false;
    }
    
    return true;
  }

  setupKeyboardNavigation() {
    // Skip keyboard setup if not in TTY mode
    if (!process.stdin.isTTY) {
      return;
    }
    
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    process.stdin.on('keypress', (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        this.cleanup();
        process.exit(0);
      }
      
      if (this.files.length > 1) {
        if (key && key.name === 'left') {
          this.navigateTab('left');
          this.displayCurrentFile();
        } else if (key && key.name === 'right') {
          this.navigateTab('right');
          this.displayCurrentFile();
        }
      }
    });
  }

  startWatching() {
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
    
    // Initial display
    this.displayCurrentFile();
    
    // Watch each file
    this.files.forEach((file, index) => {
      fs.watchFile(file, { interval: 100 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          // Only redraw if we're viewing the changed file or if there's only one file
          if (index === this.currentTabIndex || this.files.length === 1) {
            this.displayCurrentFile();
          }
        }
      });
    });
    
    // Show initial file list
    if (this.files.length > 1) {
      console.log(`\nWatching ${this.files.length} files. Use arrow keys to navigate.`);
      setTimeout(() => {
        this.displayCurrentFile();
      }, 1500);
    }
  }

  stopWatching() {
    // Unwatch all files
    this.files.forEach(file => {
      fs.unwatchFile(file);
    });
  }

  cleanup() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    this.showCursor();
    console.log('\n\nStopping mdtail...');
    this.stopWatching();
  }

  run(args) {
    // Parse arguments
    const options = this.parseArguments(args);
    
    if (options.showHelp) {
      console.log(this.getHelpText());
      process.exit(0);
    }
    
    // Expand and validate files
    const files = this.expandFiles(args);
    
    try {
      this.validateFiles(files);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      console.log('Run "mdtail --help" for usage information');
      process.exit(1);
    }
    
    // Setup exit handlers
    process.on('SIGINT', () => {
      this.cleanup();
      process.exit(0);
    });
    
    // Start watching
    this.startWatching();
  }
}

module.exports = MdTail;