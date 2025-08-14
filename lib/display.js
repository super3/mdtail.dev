const path = require('path');

// ANSI escape codes
const ANSI = {
  HIDE_CURSOR: '\x1B[?25l',
  SHOW_CURSOR: '\x1B[?25h',
  CLEAR_SCREEN: '\x1Bc'
};

class Display {
  constructor() {
    this.defaultWidth = 80;
  }

  clearScreen() {
    console.clear();
  }

  hideCursor() {
    process.stdout.write(ANSI.HIDE_CURSOR);
  }

  showCursor() {
    process.stdout.write(ANSI.SHOW_CURSOR);
  }

  getTerminalWidth() {
    return process.stdout.columns || this.defaultWidth;
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
    const lines = [];
    lines.push('\n' + '═'.repeat(width));
    lines.push(filename.toUpperCase());
    lines.push('═'.repeat(width) + '\n');
    lines.push(content);
    lines.push('\n' + '═'.repeat(width));
    return lines.join('\n');
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
    
    // Header
    console.log('\n' + '═'.repeat(width));
    
    // Tabs (if multiple files)
    if (files.length > 1) {
      console.log(this.renderTabs(files, currentIndex));
    } else {
      console.log(filename.toUpperCase());
      console.log('═'.repeat(width) + '\n');
    }
    
    // Content
    console.log(content);
    
    // Footer
    console.log('\n' + '═'.repeat(width));
    console.log(this.renderNavigation(currentIndex, files.length));
  }

  showFileList(fileCount) {
    console.log(`\nWatching ${fileCount} files. Use arrow keys to navigate.`);
  }
}

module.exports = Display;