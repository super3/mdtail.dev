const FileManager = require('../lib/fileManager');
const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('FileManager', () => {
  let fileManager;
  let consoleErrorSpy;

  beforeEach(() => {
    fileManager = new FileManager();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('expandFiles', () => {
    const mockDir = '/test/dir';

    test('should default to TODO.md when no args', () => {
      fs.existsSync.mockReturnValue(true);
      
      const files = fileManager.expandFiles([], mockDir);
      
      expect(files).toEqual([path.join(mockDir, 'TODO.md')]);
    });

    test('should handle wildcards', () => {
      fs.readdirSync.mockReturnValue(['file1.md', 'file2.md', 'test.txt']);
      
      const files = fileManager.expandFiles(['*.md'], mockDir);
      
      expect(files).toHaveLength(2);
      expect(files).toContain(path.resolve(mockDir, 'file1.md'));
    });

    test('should handle specific files', () => {
      fs.existsSync.mockReturnValue(true);
      
      const files = fileManager.expandFiles(['README.md'], mockDir);
      
      expect(files).toContain(path.resolve(mockDir, 'README.md'));
    });

    test('should warn about non-markdown files', () => {
      fs.existsSync.mockReturnValue(true);
      
      fileManager.expandFiles(['test.txt'], mockDir);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Warning: test.txt is not a markdown file');
    });

    test('should warn about missing files', () => {
      fs.existsSync.mockReturnValue(false);
      
      fileManager.expandFiles(['missing.md'], mockDir);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Warning: missing.md not found');
    });

    test('should remove duplicates', () => {
      fs.existsSync.mockReturnValue(true);
      
      const files = fileManager.expandFiles(['test.md', 'test.md'], mockDir);
      
      expect(files).toHaveLength(1);
    });
  });

  describe('validateFiles', () => {
    test('should return true for valid array', () => {
      expect(fileManager.validateFiles(['/file.md'])).toBe(true);
    });

    test('should throw for empty array', () => {
      expect(() => fileManager.validateFiles([])).toThrow('No markdown files found to watch');
    });

    test('should throw for non-array', () => {
      expect(() => fileManager.validateFiles('not-array')).toThrow('No markdown files found to watch');
    });
  });

  describe('readFile', () => {
    test('should read file content', () => {
      fs.readFileSync.mockReturnValue('File content');
      
      const content = fileManager.readFile('/test.md');
      
      expect(content).toBe('File content');
      expect(fs.readFileSync).toHaveBeenCalledWith('/test.md', 'utf8');
    });
  });

  describe('startWatching', () => {
    test('should watch files', () => {
      const files = ['/file1.md', '/file2.md'];
      const callback = jest.fn();
      fs.watchFile = jest.fn();
      
      fileManager.startWatching(files, callback);
      
      expect(fs.watchFile).toHaveBeenCalledTimes(2);
      expect(fs.watchFile).toHaveBeenCalledWith('/file1.md', { interval: 100 }, expect.any(Function));
    });

    test('should trigger callback on file change', () => {
      const files = ['/file.md'];
      const callback = jest.fn();
      let watchCallback;
      
      fs.watchFile = jest.fn((file, options, cb) => {
        watchCallback = cb;
      });
      
      fileManager.startWatching(files, callback);
      
      const curr = { mtime: new Date('2024-01-02') };
      const prev = { mtime: new Date('2024-01-01') };
      watchCallback(curr, prev);
      
      expect(callback).toHaveBeenCalledWith(0);
    });

    test('should not trigger callback when mtime unchanged', () => {
      const files = ['/file.md'];
      const callback = jest.fn();
      let watchCallback;
      
      fs.watchFile = jest.fn((file, options, cb) => {
        watchCallback = cb;
      });
      
      fileManager.startWatching(files, callback);
      
      const sameTime = new Date('2024-01-01');
      watchCallback({ mtime: sameTime }, { mtime: sameTime });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('stopWatching', () => {
    test('should unwatch all files', () => {
      fs.unwatchFile = jest.fn();
      const files = ['/file1.md', '/file2.md'];
      
      fileManager.stopWatching(files);
      
      expect(fs.unwatchFile).toHaveBeenCalledTimes(2);
      expect(fs.unwatchFile).toHaveBeenCalledWith('/file1.md');
      expect(fs.unwatchFile).toHaveBeenCalledWith('/file2.md');
    });
  });

  describe('getFiles', () => {
    test('should return files array', () => {
      fileManager.files = ['/test.md'];
      expect(fileManager.getFiles()).toEqual(['/test.md']);
    });
  });
});