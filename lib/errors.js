/**
 * Custom error classes for mdtail
 */

class MdTailError extends Error {
  constructor(message, suggestion = '') {
    super(message);
    this.name = this.constructor.name;
    this.suggestion = suggestion;
  }

  toString() {
    let result = `${this.name}: ${this.message}`;
    if (this.suggestion) {
      result += `\n  💡 ${this.suggestion}`;
    }
    return result;
  }
}

class FileNotFoundError extends MdTailError {
  constructor(filePath) {
    super(
      `File not found: ${filePath}`,
      'Check the file path and ensure the file exists'
    );
    this.filePath = filePath;
  }
}

class InvalidMarkdownError extends MdTailError {
  constructor(filePath) {
    super(
      `Not a markdown file: ${filePath}`,
      'Only .md files are supported. Rename your file with .md extension'
    );
    this.filePath = filePath;
  }
}

class NoFilesFoundError extends MdTailError {
  constructor() {
    super(
      'No markdown files found to watch',
      'Try:\n    • mdtail README.md - to watch a specific file\n    • mdtail *.md - to watch all markdown files\n    • Create a TODO.md file in the current directory'
    );
  }
}

class TerminalError extends MdTailError {
  constructor(feature) {
    super(
      `Terminal feature not available: ${feature}`,
      'Try running in a different terminal emulator'
    );
    this.feature = feature;
  }
}

class DirectoryReadError extends MdTailError {
  constructor(directory, originalError) {
    super(
      `Unable to read directory: ${directory}`,
      `Check permissions for the directory. Error: ${originalError.message}`
    );
    this.directory = directory;
    this.originalError = originalError;
  }
}

class FileReadError extends MdTailError {
  constructor(filePath, originalError) {
    super(
      `Unable to read file: ${filePath}`,
      `Check file permissions. Error: ${originalError.message}`
    );
    this.filePath = filePath;
    this.originalError = originalError;
  }
}

module.exports = {
  MdTailError,
  FileNotFoundError,
  InvalidMarkdownError,
  NoFilesFoundError,
  TerminalError,
  DirectoryReadError,
  FileReadError
};