const {
  MdTailError,
  FileNotFoundError,
  InvalidMarkdownError,
  NoFilesFoundError,
  TerminalError,
  DirectoryReadError,
  FileReadError
} = require('../lib/errors');

describe('Error Classes', () => {
  describe('MdTailError', () => {
    test('should create base error with message', () => {
      const error = new MdTailError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('MdTailError');
      expect(error.suggestion).toBe('');
    });

    test('should create base error with suggestion', () => {
      const error = new MdTailError('Test error', 'Try this instead');
      expect(error.suggestion).toBe('Try this instead');
      expect(error.toString()).toContain('💡 Try this instead');
    });

    test('should format toString without suggestion', () => {
      const error = new MdTailError('Test error');
      expect(error.toString()).toBe('MdTailError: Test error');
    });
  });

  describe('FileNotFoundError', () => {
    test('should create error with file path', () => {
      const error = new FileNotFoundError('test.md');
      expect(error.message).toBe('File not found: test.md');
      expect(error.filePath).toBe('test.md');
      expect(error.suggestion).toContain('Check the file path');
    });
  });

  describe('InvalidMarkdownError', () => {
    test('should create error for non-markdown file', () => {
      const error = new InvalidMarkdownError('test.txt');
      expect(error.message).toBe('Not a markdown file: test.txt');
      expect(error.filePath).toBe('test.txt');
      expect(error.suggestion).toContain('.md extension');
    });
  });

  describe('NoFilesFoundError', () => {
    test('should create error with helpful suggestions', () => {
      const error = new NoFilesFoundError();
      expect(error.message).toBe('No markdown files found to watch');
      expect(error.suggestion).toContain('mdtail README.md');
      expect(error.suggestion).toContain('mdtail *.md');
      expect(error.suggestion).toContain('TODO.md');
    });
  });

  describe('TerminalError', () => {
    test('should create error for terminal feature', () => {
      const error = new TerminalError('ANSI colors');
      expect(error.message).toBe('Terminal feature not available: ANSI colors');
      expect(error.feature).toBe('ANSI colors');
      expect(error.suggestion).toContain('different terminal');
    });
  });

  describe('DirectoryReadError', () => {
    test('should wrap directory read errors', () => {
      const originalError = new Error('Permission denied');
      const error = new DirectoryReadError('/test/dir', originalError);
      expect(error.message).toBe('Unable to read directory: /test/dir');
      expect(error.directory).toBe('/test/dir');
      expect(error.originalError).toBe(originalError);
      expect(error.suggestion).toContain('Permission denied');
    });
  });

  describe('FileReadError', () => {
    test('should wrap file read errors', () => {
      const originalError = new Error('EACCES');
      const error = new FileReadError('/test/file.md', originalError);
      expect(error.message).toBe('Unable to read file: /test/file.md');
      expect(error.filePath).toBe('/test/file.md');
      expect(error.originalError).toBe(originalError);
      expect(error.suggestion).toContain('EACCES');
    });
  });
});