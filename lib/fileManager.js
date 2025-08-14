const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class FileManager {
  constructor() {
    this.files = [];
    this.watchers = [];
    this.watchInterval = 100;
    this.defaultFile = 'TODO.md';
  }

  async expandFiles(args, currentDir = process.cwd()) {
    const files = [];
    
    if (args.length === 0) {
      // Default to TODO.md in current directory
      const defaultPath = path.join(currentDir, this.defaultFile);
      try {
        await fs.access(defaultPath);
        files.push(defaultPath);
      } catch {
        // File doesn't exist, leave files empty
      }
    } else {
      for (const arg of args) {
        if (arg.includes('*')) {
          // Handle wildcards
          try {
            const dirContents = await fs.readdir(currentDir);
            const mdFiles = dirContents
              .filter(file => file.endsWith('.md'))
              .sort()
              .map(f => path.resolve(currentDir, f));
            files.push(...mdFiles);
          } catch (error) {
            console.error(`Warning: Unable to read directory: ${error.message}`);
          }
        } else {
          // Resolve individual file paths
          const filePath = path.resolve(currentDir, arg);
          if (!filePath.endsWith('.md')) {
            console.error(`Warning: ${arg} is not a markdown file`);
          } else {
            try {
              await fs.access(filePath);
              files.push(filePath);
            } catch {
              console.error(`Warning: ${arg} not found`);
            }
          }
        }
      }
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

  async readFile(filePath) {
    return await fs.readFile(filePath, 'utf8');
  }

  startWatching(files, onFileChange) {
    files.forEach((file, index) => {
      fsSync.watchFile(file, { interval: this.watchInterval }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          onFileChange(index);
        }
      });
    });
  }

  stopWatching(files) {
    files.forEach(file => {
      fsSync.unwatchFile(file);
    });
  }

  getFiles() {
    return this.files;
  }
}

module.exports = FileManager;