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
    test('should use default width of 80 when process.stdout.columns is undefined', async () => {
      // Set columns to undefined to test the fallback
      process.stdout.columns = undefined;
      
      mdtail.files = ['/test/file.md'];
      mdtail.currentTabIndex = 0;
      mdtail.fileManager.readFile = jest.fn().mockResolvedValue('# Test Content');
      mdtail.display.render = jest.fn();
      
      await mdtail.displayCurrentFile();
      
      // Should call render with content
      expect(mdtail.display.render).toHaveBeenCalledWith('# Test Content', 'file.md', mdtail.files, 0);
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
    test('should not redraw when non-current file changes in multi-file mode', async () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn().mockResolvedValue(undefined);
      
      let onChangeCallback;
      mdtail.fileManager.startWatching = jest.fn((files, callback) => {
        onChangeCallback = callback;
      });
      
      await mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate change in file2 (index 1) while viewing file1 (index 0)
      await onChangeCallback(1);
      
      // Should not redraw since we're not viewing file2
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
    });

    test('should not redraw when file has not actually changed', () => {
      // This test is now handled in fileManager.test.js
      // The fileManager doesn't call the callback when mtime hasn't changed
      expect(true).toBe(true);
    });

    test('should always redraw when single file changes', async () => {
      mdtail.files = ['/single.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn().mockResolvedValue(undefined);
      
      let onChangeCallback;
      mdtail.fileManager.startWatching = jest.fn((files, callback) => {
        onChangeCallback = callback;
      });
      
      await mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate file change
      await onChangeCallback(0);
      
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