const Display = require('../lib/display');

describe('Display', () => {
  let display;
  let consoleLogSpy;
  let consoleClearSpy;
  let consoleWarnSpy;
  let stdoutWriteSpy;
  let originalColumns;
  let originalTerm;
  let originalIsTTY;

  beforeEach(() => {
    display = new Display();
    originalColumns = process.stdout.columns;
    originalTerm = process.env.TERM;
    originalIsTTY = process.stdout.isTTY;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  afterEach(() => {
    process.stdout.columns = originalColumns;
    process.env.TERM = originalTerm;
    process.stdout.isTTY = originalIsTTY;
    consoleLogSpy.mockRestore();
    consoleClearSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
  });

  describe('ANSI operations', () => {
    test('should clear screen', () => {
      display.clearScreen();
      expect(consoleClearSpy).toHaveBeenCalled();
    });

    test('should hide cursor', () => {
      process.stdout.isTTY = true;
      display.hideCursor();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25l');
    });

    test('should show cursor', () => {
      process.stdout.isTTY = true;
      display.showCursor();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25h');
    });
  });

  describe('getTerminalWidth', () => {
    test('should return terminal width', () => {
      process.stdout.columns = 120;
      expect(display.getTerminalWidth()).toBe(120);
    });

    test('should return default width when columns undefined', () => {
      process.stdout.columns = undefined;
      expect(display.getTerminalWidth()).toBe(80);
    });
  });

  describe('renderTabs', () => {
    test('should return empty string for single file', () => {
      const result = display.renderTabs(['/file.md'], 0);
      expect(result).toBe('');
    });

    test('should render tabs with active file', () => {
      const files = ['/file1.md', '/file2.md'];
      const result = display.renderTabs(files, 0);
      expect(result).toContain('[file1.md]');
      expect(result).toContain(' file2.md ');
    });
  });

  describe('formatContent', () => {
    test('should format content with borders', () => {
      const result = display.formatContent('Test content', 'test.md');
      expect(result).toContain('═'.repeat(80));
      expect(result).toContain('TEST.MD');
      expect(result).toContain('Test content');
    });
  });

  describe('renderNavigation', () => {
    test('should render multi-file navigation', () => {
      const result = display.renderNavigation(0, 3);
      expect(result).toBe('Tab 1 of 3 │ ← → Navigate │ Ctrl+C Exit');
    });

    test('should render single-file message', () => {
      const result = display.renderNavigation(0, 1);
      expect(result).toBe('Watching for changes... (Ctrl+C to exit)');
    });
  });

  describe('render', () => {
    test('should render complete display', () => {
      process.stdout.isTTY = true;
      display.render('Content', 'test.md', ['/test.md'], 0);
      expect(consoleClearSpy).toHaveBeenCalled();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25l');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('TEST.MD'));
      expect(consoleLogSpy).toHaveBeenCalledWith('Content');
    });

    test('should render with tabs for multiple files', () => {
      const files = ['/file1.md', '/file2.md'];
      display.render('Content', 'file1.md', files, 0);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[file1.md]'));
    });
  });

  describe('showFileList', () => {
    test('should show file count message', () => {
      display.showFileList(3);
      expect(consoleLogSpy).toHaveBeenCalledWith('\nWatching 3 files. Use arrow keys to navigate.');
    });
  });

  describe('checkAnsiSupport', () => {
    test('should detect ANSI support with TERM set', () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      process.env.TERM = 'xterm';
      const newDisplay = new Display();
      expect(newDisplay.supportsAnsi).toBe(true);
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });

    test('should detect no ANSI support with dumb terminal', () => {
      process.env.TERM = 'dumb';
      const newDisplay = new Display();
      expect(newDisplay.supportsAnsi).toBe(false);
    });

    test('should support ANSI on Windows', () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      delete process.env.TERM;
      Object.defineProperty(process, 'platform', { 
        value: 'win32',
        configurable: true 
      });
      const newDisplay = new Display();
      expect(newDisplay.supportsAnsi).toBe(true);
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });
  });

  describe('graceful degradation', () => {
    test('should handle clear screen fallback with stdout.rows', () => {
      console.clear = undefined;
      process.stdout.rows = 10;
      display.clearScreen();
      expect(consoleLogSpy).toHaveBeenCalledWith('\n'.repeat(10));
    });

    test('should handle clear screen fallback without stdout.rows', () => {
      console.clear = undefined;
      process.stdout.rows = undefined;
      display.clearScreen();
      expect(consoleLogSpy).toHaveBeenCalledWith('\n'.repeat(25));
    });

    test('should handle clear screen exception', () => {
      console.clear = jest.fn(() => {
        throw new Error('Clear failed');
      });
      display.clearScreen();
      expect(consoleLogSpy).toHaveBeenCalledWith('\n');
    });

    test('should handle missing TTY for cursor operations', () => {
      process.stdout.isTTY = false;
      display.hideCursor();
      display.showCursor();
      expect(stdoutWriteSpy).not.toHaveBeenCalled();
    });

    test('should handle write errors gracefully', () => {
      process.stdout.isTTY = true;
      process.stdout.write = jest.fn(() => {
        throw new Error('Write failed');
      });
      
      expect(() => display.hideCursor()).not.toThrow();
      expect(() => display.showCursor()).not.toThrow();
    });

    test('should handle getTerminalWidth errors', () => {
      const originalColumns = process.stdout.columns;
      Object.defineProperty(process.stdout, 'columns', {
        get: () => { throw new Error('Cannot get columns'); },
        configurable: true
      });
      
      expect(display.getTerminalWidth()).toBe(80);
      
      // Restore original columns
      Object.defineProperty(process.stdout, 'columns', {
        value: originalColumns,
        configurable: true
      });
    });
  });
});