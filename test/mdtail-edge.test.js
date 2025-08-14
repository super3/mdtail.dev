const MdTail = require('../lib/mdtail');
const fs = require('fs');

// Mock fs module
jest.mock('fs');

describe('MdTail - Edge Cases', () => {
  let mdtail;
  let consoleErrorSpy;

  beforeEach(() => {
    mdtail = new MdTail();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('expandFiles - missing file warning', () => {
    test('should log warning when markdown file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readdirSync.mockReturnValue([]);
      
      const files = mdtail.expandFiles(['missing.md']);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Warning: missing.md not found');
      expect(files).toEqual([]);
    });
  });

  describe('file change detection edge case', () => {
    test('should not redraw when non-current file changes in multi-file mode', () => {
      jest.useFakeTimers();
      mdtail.files = ['/test/file1.md', '/test/file2.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let file2ChangeCallback;
      fs.watchFile = jest.fn((file, options, callback) => {
        if (file === '/test/file2.md') {
          file2ChangeCallback = callback;
        }
      });
      
      mdtail.setupKeyboardNavigation = jest.fn();
      mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate file2 change while viewing file1
      file2ChangeCallback(
        { mtime: new Date('2024-01-02') },
        { mtime: new Date('2024-01-01') }
      );
      
      // Should not redraw since we're viewing file1
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
    });

    test('should not redraw when file has not actually changed', () => {
      jest.useFakeTimers();
      mdtail.files = ['/test/file1.md'];
      mdtail.currentTabIndex = 0;
      mdtail.displayCurrentFile = jest.fn();
      
      let fileChangeCallback;
      fs.watchFile = jest.fn((file, options, callback) => {
        fileChangeCallback = callback;
      });
      
      mdtail.setupKeyboardNavigation = jest.fn();
      mdtail.startWatching();
      mdtail.displayCurrentFile.mockClear();
      
      // Simulate no actual change (same mtime)
      const sameTime = new Date('2024-01-01');
      fileChangeCallback(
        { mtime: sameTime },
        { mtime: sameTime }
      );
      
      // Should not redraw since mtime is the same
      expect(mdtail.displayCurrentFile).not.toHaveBeenCalled();
    });
  });
});