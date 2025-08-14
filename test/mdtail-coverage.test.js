const MdTail = require('../lib/mdtail');
const fs = require('fs');
const readline = require('readline');

// Mock modules
jest.mock('fs');
jest.mock('readline');

describe('MdTail - 100% Branch Coverage', () => {
  let mdtail;
  let consoleLogSpy;
  let consoleClearSpy;
  let stdoutWriteSpy;
  let originalColumns;

  beforeEach(() => {
    mdtail = new MdTail();
    
    // Save original columns
    originalColumns = process.stdout.columns;
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation();
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    
    // Mock process.stdin
    process.stdin.isTTY = true;
    process.stdin.setRawMode = jest.fn();
    process.stdin.resume = jest.fn();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original columns
    process.stdout.columns = originalColumns;
    
    consoleLogSpy.mockRestore();
    consoleClearSpy.mockRestore();
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

  describe('setupKeyboardNavigation - right arrow branch', () => {
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
  });
});