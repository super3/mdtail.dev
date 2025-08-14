const MdTail = require('../lib/mdtail');
const fs = require('fs');
const readline = require('readline');

// Mock modules
jest.mock('fs');
jest.mock('readline');

describe('MdTail - Full Coverage', () => {
  let mdtail;
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleClearSpy;
  let processExitSpy;
  let stdoutWriteSpy;

  beforeEach(() => {
    mdtail = new MdTail();
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation();
    
    // Mock process methods
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    
    // Mock process.stdin
    process.stdin.isTTY = true;
    process.stdin.setRawMode = jest.fn();
    process.stdin.resume = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleClearSpy.mockRestore();
    processExitSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('displayCurrentFile', () => {
    beforeEach(() => {
      mdtail.files = ['/test/file1.md', '/test/file2.md'];
      mdtail.currentTabIndex = 0;
      process.stdout.columns = 80;
    });

    test('should display single file without tabs', () => {
      mdtail.files = ['/test/single.md'];
      fs.readFileSync.mockReturnValue('# Test Content');
      
      mdtail.displayCurrentFile();
      
      expect(consoleClearSpy).toHaveBeenCalled();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25l'); // Hide cursor
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('SINGLE.MD'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('# Test Content'));
      expect(consoleLogSpy).toHaveBeenCalledWith('Watching for changes... (Ctrl+C to exit)');
    });

    test('should display multiple files with tabs', () => {
      fs.readFileSync.mockReturnValue('# File 1 Content');
      
      mdtail.displayCurrentFile();
      
      expect(consoleClearSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[file1.md]'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('file2.md'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tab 1 of 2'));
    });

    test('should handle file read errors', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      mdtail.displayCurrentFile();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reading'),
        'File not found'
      );
    });
  });

  describe('setupKeyboardNavigation', () => {
    test('should skip setup if not TTY', () => {
      process.stdin.isTTY = false;
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      expect(readline.emitKeypressEvents).not.toHaveBeenCalled();
      expect(process.stdin.setRawMode).not.toHaveBeenCalled();
    });

    test('should setup keyboard listeners if TTY', () => {
      process.stdin.isTTY = true;
      process.stdin.on = jest.fn();
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      expect(readline.emitKeypressEvents).toHaveBeenCalledWith(process.stdin);
      expect(process.stdin.setRawMode).toHaveBeenCalledWith(true);
      expect(process.stdin.resume).toHaveBeenCalled();
      expect(process.stdin.on).toHaveBeenCalledWith('keypress', expect.any(Function));
    });

    test('should handle Ctrl+C keypress', () => {
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          // Simulate Ctrl+C
          callback('', { ctrl: true, name: 'c' });
        }
      });
      readline.emitKeypressEvents = jest.fn();
      mdtail.cleanup = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      expect(mdtail.cleanup).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    test('should handle left arrow keypress', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 1;
      mdtail.displayCurrentFile = jest.fn();
      
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          callback('', { name: 'left' });
        }
      });
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      expect(mdtail.currentTabIndex).toBe(0);
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });

    test('should handle right arrow keypress', () => {
      mdtail.files = ['/file1.md', '/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      process.stdin.on = jest.fn((event, callback) => {
        if (event === 'keypress') {
          callback('', { name: 'right' });
        }
      });
      readline.emitKeypressEvents = jest.fn();
      
      mdtail.setupKeyboardNavigation();
      
      expect(mdtail.currentTabIndex).toBe(1);
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });
  });

  describe('startWatching', () => {
    test('should setup watching for single file', () => {
      jest.useFakeTimers();
      mdtail.files = ['/test/file.md'];
      mdtail.setupKeyboardNavigation = jest.fn();
      mdtail.displayCurrentFile = jest.fn();
      fs.watchFile = jest.fn();
      
      mdtail.startWatching();
      
      expect(mdtail.setupKeyboardNavigation).toHaveBeenCalled();
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
      expect(fs.watchFile).toHaveBeenCalledWith(
        '/test/file.md',
        { interval: 100 },
        expect.any(Function)
      );
    });

    test('should show file list for multiple files', () => {
      mdtail.files = ['/test/file1.md', '/test/file2.md'];
      mdtail.setupKeyboardNavigation = jest.fn();
      mdtail.displayCurrentFile = jest.fn();
      fs.watchFile = jest.fn();
      
      jest.useFakeTimers();
      mdtail.startWatching();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Watching 2 files')
      );
      
      jest.advanceTimersByTime(1500);
      expect(mdtail.displayCurrentFile).toHaveBeenCalledTimes(2); // Initial + after timeout
    });

    test('should redraw on file change for current tab', () => {
      jest.useFakeTimers();
      mdtail.files = ['/test/file1.md', '/test/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      mdtail.setupKeyboardNavigation = jest.fn();
      
      let fileChangeCallback;
      fs.watchFile = jest.fn((file, options, callback) => {
        if (file === '/test/file1.md') {
          fileChangeCallback = callback;
        }
      });
      
      mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate file change
      fileChangeCallback(
        { mtime: new Date('2024-01-02') },
        { mtime: new Date('2024-01-01') }
      );
      
      expect(mdtail.displayCurrentFile).toHaveBeenCalled();
    });
  });

  describe('stopWatching', () => {
    test('should unwatch all files', () => {
      mdtail.files = ['/test/file1.md', '/test/file2.md'];
      fs.unwatchFile = jest.fn();
      
      mdtail.stopWatching();
      
      expect(fs.unwatchFile).toHaveBeenCalledWith('/test/file1.md');
      expect(fs.unwatchFile).toHaveBeenCalledWith('/test/file2.md');
    });
  });

  describe('cleanup', () => {
    test('should reset terminal and stop watching', () => {
      process.stdin.isTTY = true;
      mdtail.stopWatching = jest.fn();
      
      mdtail.cleanup();
      
      expect(process.stdin.setRawMode).toHaveBeenCalledWith(false);
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25h'); // Show cursor
      expect(consoleLogSpy).toHaveBeenCalledWith('\n\nStopping mdtail...');
      expect(mdtail.stopWatching).toHaveBeenCalled();
    });

    test('should handle non-TTY mode', () => {
      process.stdin.isTTY = false;
      mdtail.stopWatching = jest.fn();
      
      mdtail.cleanup();
      
      expect(process.stdin.setRawMode).not.toHaveBeenCalled();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25h');
      expect(mdtail.stopWatching).toHaveBeenCalled();
    });
  });

  describe('clearScreen, hideCursor, showCursor', () => {
    test('should clear screen', () => {
      mdtail.clearScreen();
      expect(consoleClearSpy).toHaveBeenCalled();
    });

    test('should hide cursor', () => {
      mdtail.hideCursor();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25l');
    });

    test('should show cursor', () => {
      mdtail.showCursor();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25h');
    });
  });

  describe('run', () => {
    test('should show help and exit', () => {
      mdtail.run(['--help']);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('mdtail - Terminal'));
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
      process.on = jest.fn((event, handler) => {
        if (event === 'SIGINT') {
          sigintHandler = handler;
        }
      });
      
      mdtail.run(['README.md']);
      sigintHandler();
      
      expect(mdtail.cleanup).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });
  });
});