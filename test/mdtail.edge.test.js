const MdTail = require('../lib/mdtail');
const fs = require('fs');
const readline = require('readline');

// Mock modules
jest.mock('fs');
jest.mock('readline');

describe('MdTail - Edge Cases & Branch Coverage', () => {
  let mdtail;
  let consoleLogSpy;
  let consoleClearSpy;
  let consoleErrorSpy;
  let stdoutWriteSpy;
  let originalColumns;

  beforeEach(() => {
    mdtail = new MdTail();
    
    // Save original columns
    originalColumns = process.stdout.columns;
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    
    // Mock process.stdin
    process.stdin.isTTY = true;
    process.stdin.setRawMode = jest.fn();
    process.stdin.resume = jest.fn();
    
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore original columns
    process.stdout.columns = originalColumns;
    
    consoleLogSpy.mockRestore();
    consoleClearSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('displayCurrentFile - undefined columns fallback', () => {
    test('should use default width of 80 when process.stdout.columns is undefined', () => {
      // Set columns to undefined to test the fallback
      process.stdout.columns = undefined;
      
      mdtail.files = ['/test/file.md'];
      mdtail.currentTabIndex = 0;
      fs.readFileSync.mockReturnValue('# Test Content');
      
      mdtail.displayCurrentFile();
      
      // Should use default width of 80 for the borders
      expect(consoleLogSpy).toHaveBeenCalledWith('\n' + '═'.repeat(80));
      expect(consoleLogSpy).toHaveBeenCalledWith('═'.repeat(80) + '\n');
    });
  });

  describe('setupKeyboardNavigation - edge cases', () => {
    test('should handle right arrow key with else-if branch', () => {
      mdtail.files = ['/file1.md', '/file2.md', '/file3.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let keypressCallback;
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          keypressCallback = callback;
        }
      });
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      // First test left arrow
      keypressCallback('', { name: 'left' });
      expect(mdtail.currentTabIndex).toBe(2); // Wrapped to last
      
      // Reset for right arrow test
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile.mockClear();
      
      // Now test right arrow (this will hit the else-if branch)
      keypressCallback('', { name: 'right' });
      expect(mdtail.currentTabIndex).toBe(1);
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });
    
    test('should not navigate when key is neither left nor right', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let keypressCallback;
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          keypressCallback = callback;
        }
      });
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      // Test with up arrow (should not navigate)
      keypressCallback('', { name: 'up' });
      expect(mdtail.currentTabIndex).toBe(0); // Should not change
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
      
      // Test with no key object
      keypressCallback('a', null);
      expect(mdtail.currentTabIndex).toBe(0); // Should not change
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
    });

    test('should not navigate with single file', () => {
      mdtail.files = ['/single.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let keypressCallback;
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          keypressCallback = callback;
        }
      });
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      // Arrow keys should have no effect with single file
      keypressCallback('', { name: 'left' });
      expect(mdtail.currentTabIndex).toBe(0);
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
      
      keypressCallback('', { name: 'right' });
      expect(mdtail.currentTabIndex).toBe(0);
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
    });
  });

  describe('file watching edge cases', () => {
    test('should not redraw when non-current file changes in multi-file mode', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let watchCallbackFile2;
      fs.watchFile = jest.fn((file, options, callback) => {
        if (file === '/file2.md') {
          watchCallbackFile2 = callback;
        }
      });
      
      mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate change in file2 while viewing file1
      const curr = { mtime: new Date('2024-01-02') };
      const prev = { mtime: new Date('2024-01-01') };
      watchCallbackFile2(curr, prev);
      
      // Should not redraw since we're not viewing file2
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
    });

    test('should not redraw when file has not actually changed', () => {
      mdtail.files = ['/file1.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let watchCallback;
      fs.watchFile = jest.fn((file, options, callback) => {
        watchCallback = callback;
      });
      
      mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate no actual change (same mtime)
      const sameTime = new Date('2024-01-01');
      watchCallback({ mtime: sameTime }, { mtime: sameTime });
      
      // Should not redraw since mtime hasn't changed
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
    });

    test('should always redraw when single file changes', () => {
      mdtail.files = ['/single.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let watchCallback;
      fs.watchFile = jest.fn((file, options, callback) => {
        watchCallback = callback;
      });
      
      mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate file change
      const curr = { mtime: new Date('2024-01-02') };
      const prev = { mtime: new Date('2024-01-01') };
      watchCallback(curr, prev);
      
      // Should always redraw for single file mode
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });
  });

  describe('index.js integration', () => {
    test('should properly instantiate and run MdTail', () => {
      // This test ensures index.js is covered
      const mockRun = jest.fn();
      jest.doMock('../lib/mdtail', () => {
        return jest.fn().mockImplementation(() => ({
          run: mockRun
        }));
      });
      
      // Clear the module cache and re-require
      delete require.cache[require.resolve('../index.js')];
      
      // Save original argv
      const originalArgv = process.argv;
      process.argv = ['node', 'index.js', 'test.md'];
      
      // Require index.js (this will execute it)
      require('../index.js');
      
      // Restore argv
      process.argv = originalArgv;
      
      expect(mockRun).toHaveBeenCalledWith(['test.md']);
      
      // Clean up mock
      jest.dontMock('../lib/mdtail');
    });
  });
});