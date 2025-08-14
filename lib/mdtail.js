const path = require('path');
const readline = require('readline');
const Display = require('./display');
const FileManager = require('./fileManager');
const { MdTailError, FileReadError } = require('./errors');

class MdTail {
  constructor() {
    this.display = new Display();
    this.fileManager = new FileManager();
    this.files = [];
    this.currentTabIndex = 0;
  }

  parseArguments(args) {
    const helpFlags = ['-h', '--help'];
    
    if (args.some(arg => helpFlags.includes(arg))) {
      return { showHelp: true };
    }

    return { showHelp: false };
  }

  async expandFiles(args, currentDir) {
    this.files = await this.fileManager.expandFiles(args, currentDir);
    return this.files;
  }

  validateFiles(files) {
    return this.fileManager.validateFiles(files);
  }

  clearScreen() {
    this.display.clearScreen();
  }

  hideCursor() {
    this.display.hideCursor();
  }

  showCursor() {
    this.display.showCursor();
  }

  renderTabs(files, currentIndex, width) {
    return this.display.renderTabs(files, currentIndex);
  }

  formatContent(content, filename, width) {
    return this.display.formatContent(content, filename);
  }

  async displayCurrentFile() {
    const currentFile = this.files[this.currentTabIndex];
    
    try {
      const content = await this.fileManager.readFile(currentFile);
      const filename = path.basename(currentFile);
      
      this.display.render(content, filename, this.files, this.currentTabIndex);
    } catch (error) {
      if (error instanceof FileReadError) {
        console.error(error.toString());
      } else {
        console.error(`Error reading ${currentFile}:`, error.message);
      }
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
    
    try {
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      
      process.stdin.on('keypress', async (str, key) => {
        if (key && key.ctrl && key.name === 'c') {
          await this.cleanup();
          process.exit(0);
        }
        
        if (this.files.length > 1) {
          if (key && key.name === 'left') {
            this.navigateTab('left');
            await this.displayCurrentFile();
          } else if (key && key.name === 'right') {
            this.navigateTab('right');
            await this.displayCurrentFile();
          }
        }
      });
    } catch (error) {
      // If keyboard setup fails, app still works without navigation
      console.warn('Keyboard navigation unavailable in this environment');
    }
  }

  async startWatching() {
    // Setup keyboard navigation
    this.setupKeyboardNavigation();
    
    // Initial display
    await this.displayCurrentFile();
    
    // Watch each file
    this.fileManager.startWatching(this.files, async (fileIndex) => {
      // Only redraw if we're viewing the changed file or if there's only one file
      if (fileIndex === this.currentTabIndex || this.files.length === 1) {
        await this.displayCurrentFile();
      }
    });
    
    // Show initial file list
    if (this.files.length > 1) {
      this.display.showFileList(this.files.length);
      setTimeout(async () => {
        await this.displayCurrentFile();
      }, 1500);
    }
  }

  stopWatching() {
    this.fileManager.stopWatching(this.files);
  }

  async cleanup() {
    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(false);
      } catch {
        // Gracefully handle if setRawMode fails
      }
    }
    this.display.showCursor();
    console.log('\n\nStopping mdtail...');
    this.stopWatching();
  }

  async run(args) {
    // Parse arguments
    const options = this.parseArguments(args);
    
    if (options.showHelp) {
      console.log(this.getHelpText());
      process.exit(0);
    }
    
    // Expand and validate files
    const files = await this.expandFiles(args);
    
    try {
      this.validateFiles(files);
    } catch (error) {
      if (error instanceof MdTailError) {
        console.error(error.toString());
      } else {
        console.error(`Error: ${error.message}`);
      }
      console.log('Run "mdtail --help" for usage information');
      process.exit(1);
    }
    
    // Setup exit handlers
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
    
    // Start watching
    await this.startWatching();
  }
}

module.exports = MdTail;