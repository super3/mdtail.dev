const FileManager = require('../lib/fileManager');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn()
  },
  watchFile: jest.fn(),
  unwatchFile: jest.fn()
}));

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

    test('should default to TODO.md when no args', async () => {
      fs.access.mockResolvedValue(undefined);
      
      const files = await fileManager.expandFiles([], mockDir);
      
      expect(files).toEqual([path.join(mockDir, 'TODO.md')]);
    });

    test('should handle wildcards', async () => {
      fs.readdir.mockResolvedValue(['file1.md', 'file2.md', 'test.txt']);
      
      const files = await fileManager.expandFiles(['*.md'], mockDir);
      
      expect(files).toHaveLength(2);
      expect(files).toContain(path.resolve(mockDir, 'file1.md'));
    });

    test('should handle specific files', async () => {
      fs.access.mockResolvedValue(undefined);
      
      const files = await fileManager.expandFiles(['README.md'], mockDir);
      
      expect(files).toContain(path.resolve(mockDir, 'README.md'));
    });

    test('should warn about non-markdown files', async () => {
      await fileManager.expandFiles(['test.txt'], mockDir);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Warning: test.txt is not a markdown file');
    });

    test('should warn about missing files', async () => {
      fs.access.mockRejectedValue(new Error('Not found'));
      
      await fileManager.expandFiles(['missing.md'], mockDir);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Warning: missing.md not found');
    });

    test('should remove duplicates', async () => {
      fs.access.mockResolvedValue(undefined);
      
      const files = await fileManager.expandFiles(['test.md', 'test.md'], mockDir);
      
      expect(files).toHaveLength(1);
    });

    test('should handle readdir errors', async () => {
      fs.readdir.mockRejectedValue(new Error('Permission denied'));
      
      await fileManager.expandFiles(['*.md'], mockDir);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Warning: Unable to read directory: Permission denied');
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
    test('should read file content', async () => {
      fs.readFile.mockResolvedValue('File content');
      
      const content = await fileManager.readFile('/test.md');
      
      expect(content).toBe('File content');
      expect(fs.readFile).toHaveBeenCalledWith('/test.md', 'utf8');
    });
  });

  describe('startWatching', () => {
    test('should watch files', () => {
      const files = ['/file1.md', '/file2.md'];
      const callback = jest.fn();
      
      fileManager.startWatching(files, callback);
      
      expect(fsSync.watchFile).toHaveBeenCalledTimes(2);
      expect(fsSync.watchFile).toHaveBeenCalledWith('/file1.md', { interval: 100 }, expect.any(Function));
    });

    test('should trigger callback on file change', () => {
      const files = ['/file.md'];
      const callback = jest.fn();
      let watchCallback;
      
      fsSync.watchFile.mockImplementation((file, options, cb) => {
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
      
      fsSync.watchFile.mockImplementation((file, options, cb) => {
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
      const files = ['/file1.md', '/file2.md'];
      
      fileManager.stopWatching(files);
      
      expect(fsSync.unwatchFile).toHaveBeenCalledTimes(2);
      expect(fsSync.unwatchFile).toHaveBeenCalledWith('/file1.md');
      expect(fsSync.unwatchFile).toHaveBeenCalledWith('/file2.md');
    });
  });

  describe('getFiles', () => {
    test('should return files array', () => {
      fileManager.files = ['/test.md'];
      expect(fileManager.getFiles()).toEqual(['/test.md']);
    });
  });
});