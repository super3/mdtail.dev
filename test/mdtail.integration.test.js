const MdTail = require('../lib/mdtail');
const fs = require('fs');
const readline = require('readline');

// Mock modules
jest.mock('fs');
jest.mock('readline');

describe('MdTail - Integration Tests', () => {
  let mdtail;
  let consoleLogSpy;
  let consoleClearSpy;
  let consoleErrorSpy;
  let stdoutWriteSpy;
  let processExitSpy;

  beforeEach(() => {
    mdtail = new MdTail();
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    
    // Mock process.stdin
    process.stdin.isTTY = true;
    process.stdin.setRawMode = jest.fn();
    process.stdin.resume = jest.fn();
    
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleClearSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
    processExitSpy.mockRestore();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('displayCurrentFile', () => {
    test('should display single file without tabs', async () => {
      mdtail.files = ['/test/file.md'];
      mdtail.currentTabIndex = 0;
      mdtail.fileManager.readFile = jest.fn().mockResolvedValue('# Test Content');
      mdtail.display.render = jest.fn();
      
      await mdtail.displayCurrentFile();
      
      expect(mdtail.fileManager.readFile).toHaveBeenCalledWith('/test/file.md');
      expect(mdtail.display.render).toHaveBeenCalledWith('# Test Content', 'file.md', mdtail.files, 0);
    });

    test('should display multiple files with tabs', async () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.fileManager.readFile = jest.fn().mockResolvedValue('Content 1');
      mdtail.display.render = jest.fn();
      
      await mdtail.displayCurrentFile();
      
      expect(mdtail.display.render).toHaveBeenCalledWith('Content 1', 'file1.md', mdtail.files, 0);
    });

    test('should handle file read errors', async () => {
      mdtail.files = ['/error.md'];
      mdtail.currentTabIndex = 0;
      mdtail.fileManager.readFile = jest.fn().mockRejectedValue(new Error('File not found'));
      
      await mdtail.displayCurrentFile();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading /error.md:', 'File not found');
    });
  });

  describe('setupKeyboardNavigation', () => {
    test('should skip setup if not TTY', () => {
      process.stdin.isTTY = false;
      
      mdtail.setupKeyboardNavigation();
      
      expect(readline.emitKeypressEvents).not.toHaveBeenCalled();
      expect(process.stdin.setRawMode).not.toHaveBeenCalled();
    });

    test('should setup keyboard listeners if TTY', () => {
      process.stdin.on = jest.fn();
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      expect(readline.emitKeypressEvents).toHaveBeenCalledWith(process.stdin);
      expect(process.stdin.setRawMode).toHaveBeenCalledWith(true);
      expect(process.stdin.resume).toHaveBeenCalled();
      expect(process.stdin.on).toHaveBeenCalledWith('keypress', expect.any(Function));
    });

    test('should handle Ctrl+C keypress', async () => {
      mdtail.cleanup = jest.fn().mockResolvedValue(undefined);
      let keypressCallback;
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          keypressCallback = callback;
        }
      });
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      // Simulate Ctrl+C
      await keypressCallback('', { ctrl: true, name: 'c' });
      
      expect(mdtail.cleanup).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    test('should handle left arrow keypress', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 1;
      mdtail.displayCurrentFile = jest.fn();
      
      let keypressCallback;
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          keypressCallback = callback;
        }
      });
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      // Simulate left arrow
      keypressCallback('', { name: 'left' });
      
      expect(mdtail.currentTabIndex).toBe(0);
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });

    test('should handle right arrow keypress', () => {
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
      
      // Simulate right arrow
      keypressCallback('', { name: 'right' });
      
      expect(mdtail.currentTabIndex).toBe(1);
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });
  });

  describe('startWatching', () => {
    test('should setup watching for single file', async () => {
      mdtail.files = ['/single.md'];
      mdtail.setupKeyboardNavigation = jest.fn();
      mdtail.displayCurrentFile = jest.fn().mockResolvedValue(undefined);
      mdtail.fileManager.startWatching = jest.fn();
      
      await mdtail.startWatching();
      
      expect(mdtail.setupKeyboardNavigation).toHaveBeenCalled();
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
      expect(mdtail.fileManager.startWatching).toHaveBeenCalledWith(mdtail.files, expect.any(Function));
    });

    test('should show file list for multiple files', async () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.setupKeyboardNavigation = jest.fn();
      mdtail.displayCurrentFile = jest.fn().mockResolvedValue(undefined);
      mdtail.fileManager.startWatching = jest.fn();
      mdtail.display.showFileList = jest.fn();
      
      // Capture setTimeout callback
      const originalSetTimeout = global.setTimeout;
      let timeoutCallback;
      global.setTimeout = jest.fn((cb) => {
        timeoutCallback = cb;
        return originalSetTimeout(cb, 0);
      });
      
      await mdtail.startWatching();
      
      expect(mdtail.display.showFileList).toHaveBeenCalledWith(2);
      expect(mdtail.displayCurrentFile).toHaveBeenCalledTimes(1); // Initial display
      
      // Execute the setTimeout callback
      if (timeoutCallback) {
        await timeoutCallback();
        expect(mdtail.displayCurrentFile).toHaveBeenCalledTimes(2); // Initial + delayed
      }
      
      global.setTimeout = originalSetTimeout;
    });

    test('should redraw on file change for current tab', async () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn().mockResolvedValue(undefined);
      
      let onChangeCallback;
      mdtail.fileManager.startWatching = jest.fn((files, callback) => {
        onChangeCallback = callback;
      });
      
      await mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate file change for current tab
      await onChangeCallback(0);
      
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    test('should reset terminal and stop watching', async () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.stopWatching = jest.fn();
      mdtail.display.showCursor = jest.fn();
      
      await mdtail.cleanup();
      
      expect(process.stdin.setRawMode).toHaveBeenCalledWith(false);
      expect(mdtail.display.showCursor).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('\n\nStopping mdtail...');
      expect(mdtail.stopWatching).toHaveBeenCalled();
    });

    test('should handle non-TTY mode', async () => {
      process.stdin.isTTY = false;
      mdtail.stopWatching = jest.fn();
      mdtail.display.showCursor = jest.fn();
      
      await mdtail.cleanup();
      
      expect(process.stdin.setRawMode).not.toHaveBeenCalled();
      expect(mdtail.display.showCursor).toHaveBeenCalled();
      expect(mdtail.stopWatching).toHaveBeenCalled();
    });
  });

  describe('stopWatching', () => {
    test('should unwatch all files', () => {
      mdtail.files = ['/file1.md', '/file2.md', '/file3.md'];
      mdtail.fileManager.stopWatching = jest.fn();
      
      mdtail.stopWatching();
      
      expect(mdtail.fileManager.stopWatching).toHaveBeenCalledWith(mdtail.files);
    });
  });

  describe('run', () => {
    test('should show help and exit', async () => {
      mdtail.getHelpText = jest.fn(() => 'Help text');
      
      await mdtail.run(['--help']);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Help text');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    test('should handle no files found error', async () => {
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue([]);
      
      await mdtail.run([]);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: No markdown files found to watch');
      expect(consoleLogSpy).toHaveBeenCalledWith('Run "mdtail --help" for usage information');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should start watching valid files', async () => {
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue(['/README.md']);
      mdtail.startWatching = jest.fn().mockResolvedValue(undefined);
      process.on = jest.fn();
      
      await mdtail.run(['README.md']);
      
      expect(mdtail.startWatching).toHaveBeenCalled();
      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    test('should handle SIGINT', async () => {
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue(['/README.md']);
      mdtail.startWatching = jest.fn().mockResolvedValue(undefined);
      mdtail.cleanup = jest.fn().mockResolvedValue(undefined);
      
      let sigintHandler;
      process.on = jest.fn((signal, handler) => {
        if (signal === 'SIGINT') {
          sigintHandler = handler;
        }
      });
      
      await mdtail.run(['README.md']);
      
      // Trigger SIGINT
      await sigintHandler();
      
      expect(mdtail.cleanup).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });
  });
});