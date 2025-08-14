const fs = require('fs');
const path = require('path');

class FileManager {
  constructor() {
    this.files = [];
    this.watchers = [];
    this.watchInterval = 100;
    this.defaultFile = 'TODO.md';
  }

  expandFiles(args, currentDir = process.cwd()) {
    const files = [];
    
    if (args.length === 0) {
      // Default to TODO.md in current directory
      const defaultPath = path.join(currentDir, this.defaultFile);
      if (fs.existsSync(defaultPath)) {
        files.push(defaultPath);
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

  readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  startWatching(files, onFileChange) {
    files.forEach((file, index) => {
      fs.watchFile(file, { interval: this.watchInterval }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          onFileChange(index);
        }
      });
    });
  }

  stopWatching(files) {
    files.forEach(file => {
      fs.unwatchFile(file);
    });
  }

  getFiles() {
    return this.files;
  }
}

module.exports = FileManager;