const Display = require('../lib/display');

describe('Display', () => {
  let display;
  let consoleLogSpy;
  let consoleClearSpy;
  let stdoutWriteSpy;
  let originalColumns;

  beforeEach(() => {
    display = new Display();
    originalColumns = process.stdout.columns;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation();
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  afterEach(() => {
    process.stdout.columns = originalColumns;
    consoleLogSpy.mockRestore();
    consoleClearSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
  });

  describe('ANSI operations', () => {
    test('should clear screen', () => {
      display.clearScreen();
      expect(consoleClearSpy).toHaveBeenCalled();
    });

    test('should hide cursor', () => {
      display.hideCursor();
      expect(stdoutWriteSpy).toHaveBeenCalledWith('\x1B[?25l');
    });

    test('should show cursor', () => {
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
});