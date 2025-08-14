const fs = require('fs');
const path = require('path');

class MdTail {
  constructor() {
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
          }
        }
      });
    }

    // Remove duplicates
    return [...new Set(files)];
  }

  validateFiles(files) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No markdown files found to watch');
    }
    return true;
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
}

module.exports = MdTail;