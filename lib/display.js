const path = require('path');
const { TerminalError } = require('./errors');

// ANSI escape codes
const ANSI = {
  HIDE_CURSOR: '\x1B[?25l',
  SHOW_CURSOR: '\x1B[?25h',
  CLEAR_SCREEN: '\x1Bc'
};

class Display {
  constructor() {
    this.defaultWidth = 80;
    this.supportsAnsi = this.checkAnsiSupport();
  }

  checkAnsiSupport() {
    // Check if terminal supports ANSI escape codes
    const term = process.env.TERM;
    const isWindows = process.platform === 'win32';
    const isDumbTerm = term === 'dumb';
    
    // Most modern terminals support ANSI
    return !isDumbTerm && !!(term || isWindows);
  }

  clearScreen() {
    try {
      if (console.clear) {
        console.clear();
      } else {
        // Fallback for environments without console.clear
        console.log('\n'.repeat(process.stdout.rows || 25));
      }
    } catch (error) {
      // If clearing fails, just continue
      console.log('\n');
    }
  }

  hideCursor() {
    if (this.supportsAnsi && process.stdout.isTTY) {
      try {
        process.stdout.write(ANSI.HIDE_CURSOR);
      } catch {
        // Gracefully degrade if cursor hiding fails
      }
    }
  }

  showCursor() {
    if (this.supportsAnsi && process.stdout.isTTY) {
      try {
        process.stdout.write(ANSI.SHOW_CURSOR);
      } catch {
        // Gracefully degrade if cursor showing fails
      }
    }
  }

  getTerminalWidth() {
    try {
      return process.stdout.columns || this.defaultWidth;
    } catch {
      // If we can't get terminal width, use default
      return this.defaultWidth;
    }
  }

  renderTabs(files, currentIndex) {
    if (files.length <= 1) return '';
    
    const width = this.getTerminalWidth();
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

  formatContent(content, filename) {
    const width = this.getTerminalWidth();
    const border = '═'.repeat(width);
    
    return `
${border}
${filename.toUpperCase()}
${border}

${content}

${border}`;
  }

  renderNavigation(currentIndex, totalFiles) {
    if (totalFiles > 1) {
      return `Tab ${currentIndex + 1} of ${totalFiles} │ ← → Navigate │ Ctrl+C Exit`;
    } else {
      return 'Watching for changes... (Ctrl+C to exit)';
    }
  }

  render(content, filename, files, currentIndex) {
    this.clearScreen();
    this.hideCursor();
    
    const width = this.getTerminalWidth();
    const border = '═'.repeat(width);
    
    // Header
    console.log(`\n${border}`);
    
    // Tabs (if multiple files)
    if (files.length > 1) {
      console.log(this.renderTabs(files, currentIndex));
    } else {
      console.log(filename.toUpperCase());
      console.log(`${border}\n`);
    }
    
    // Content
    console.log(content);
    
    // Footer
    console.log(`\n${border}`);
    console.log(this.renderNavigation(currentIndex, files.length));
  }

  showFileList(fileCount) {
    console.log(`\nWatching ${fileCount} files. Use arrow keys to navigate.`);
  }
}

module.exports = Display;