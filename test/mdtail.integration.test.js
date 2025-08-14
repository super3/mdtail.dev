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
    test('should display single file without tabs', () => {
      mdtail.files = ['/test/file.md'];
      mdtail.currentTabIndex = 0;
      mdtail.fileManager.readFile = jest.fn().mockReturnValue('# Test Content');
      mdtail.display.render = jest.fn();
      
      mdtail.displayCurrentFile();
      
      expect(mdtail.fileManager.readFile).toHaveBeenCalledWith('/test/file.md');
      expect(mdtail.display.render).toHaveBeenCalledWith('# Test Content', 'file.md', mdtail.files, 0);
    });

    test('should display multiple files with tabs', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.fileManager.readFile = jest.fn().mockReturnValue('Content 1');
      mdtail.display.render = jest.fn();
      
      mdtail.displayCurrentFile();
      
      expect(mdtail.display.render).toHaveBeenCalledWith('Content 1', 'file1.md', mdtail.files, 0);
    });

    test('should handle file read errors', () => {
      mdtail.files = ['/error.md'];
      mdtail.currentTabIndex = 0;
      mdtail.fileManager.readFile = jest.fn().mockImplementation(() => {
        throw new Error('File not found');
      });
      
      mdtail.displayCurrentFile();
      
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

    test('should handle Ctrl+C keypress', () => {
      mdtail.cleanup = jest.fn();
      let keypressCallback;
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          keypressCallback = callback;
        }
      });
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      // Simulate Ctrl+C
      keypressCallback('', { ctrl: true, name: 'c' });
      
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
    test('should setup watching for single file', () => {
      mdtail.files = ['/single.md'];
      mdtail.setupKeyboardNavigation = jest.fn();
      mdtail.displayCurrentFile = jest.fn();
      mdtail.fileManager.startWatching = jest.fn();
      
      mdtail.startWatching();
      
      expect(mdtail.setupKeyboardNavigation).toHaveBeenCalled();
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
      expect(mdtail.fileManager.startWatching).toHaveBeenCalledWith(mdtail.files, expect.any(Function));
    });

    test('should show file list for multiple files', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.setupKeyboardNavigation = jest.fn();
      mdtail.displayCurrentFile = jest.fn();
      mdtail.fileManager.startWatching = jest.fn();
      mdtail.display.showFileList = jest.fn();
      
      mdtail.startWatching();
      
      expect(mdtail.display.showFileList).toHaveBeenCalledWith(2);
      
      // Fast-forward timer to trigger delayed display
      jest.advanceTimersByTime(1500);
      
      expect(mdtail.displayCurrentFile).toHaveBeenCalledTimes(2); // Initial + delayed
    });

    test('should redraw on file change for current tab', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let onChangeCallback;
      mdtail.fileManager.startWatching = jest.fn((files, callback) => {
        onChangeCallback = callback;
      });
      
      mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate file change for current tab
      onChangeCallback(0);
      
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    test('should reset terminal and stop watching', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.stopWatching = jest.fn();
      mdtail.display.showCursor = jest.fn();
      
      mdtail.cleanup();
      
      expect(process.stdin.setRawMode).toHaveBeenCalledWith(false);
      expect(mdtail.display.showCursor).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('\n\nStopping mdtail...');
      expect(mdtail.stopWatching).toHaveBeenCalled();
    });

    test('should handle non-TTY mode', () => {
      process.stdin.isTTY = false;
      mdtail.stopWatching = jest.fn();
      mdtail.display.showCursor = jest.fn();
      
      mdtail.cleanup();
      
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
    test('should show help and exit', () => {
      mdtail.getHelpText = jest.fn(() => 'Help text');
      
      mdtail.run(['--help']);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Help text');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    test('should handle no files found error', () => {
      fs.existsSync.mockReturnValue(false);
      
      mdtail.run([]);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: No markdown files found to watch');
      expect(consoleLogSpy).toHaveBeenCalledWith('Run "mdtail --help" for usage information');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should start watching valid files', () => {
      fs.existsSync.mockReturnValue(true);
      mdtail.startWatching = jest.fn();
      process.on = jest.fn();
      
      mdtail.run(['README.md']);
      
      expect(mdtail.startWatching).toHaveBeenCalled();
      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    test('should handle SIGINT', () => {
      fs.existsSync.mockReturnValue(true);
      mdtail.startWatching = jest.fn();
      mdtail.cleanup = jest.fn();
      
      let sigintHandler;
      process.on = jest.fn((signal, handler) => {
        if (signal === 'SIGINT') {
          sigintHandler = handler;
        }
      });
      
      mdtail.run(['README.md']);
      
      // Trigger SIGINT
      sigintHandler();
      
      expect(mdtail.cleanup).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });
  });
});