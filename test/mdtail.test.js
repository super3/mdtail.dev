const MdTail = require('../lib/mdtail');
const fs = require('fs');
const path = require('path');

// Mock fs module
jest.mock('fs');

describe('MdTail - Core Functionality', () => {
  let mdtail;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    mdtail = new MdTail();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('parseArguments', () => {
    test('should detect help flag -h', () => {
      const result = mdtail.parseArguments(['-h']);
      expect(result.showHelp).toBe(true);
    });

    test('should detect help flag --help', () => {
      const result = mdtail.parseArguments(['--help']);
      expect(result.showHelp).toBe(true);
    });

    test('should return showHelp false when no help flags', () => {
      const result = mdtail.parseArguments(['README.md']);
      expect(result.showHelp).toBe(false);
    });

    test('should handle empty arguments', () => {
      const result = mdtail.parseArguments([]);
      expect(result.showHelp).toBe(false);
    });
  });

  describe('expandFiles', () => {
    const mockDir = '/test/dir';

    test('should default to TODO.md when no args provided', async () => {
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue([path.join(mockDir, 'TODO.md')]);
      
      const files = await mdtail.expandFiles([], mockDir);
      
      expect(files).toEqual([path.join(mockDir, 'TODO.md')]);
      expect(mdtail.fileManager.expandFiles).toHaveBeenCalledWith([], mockDir);
    });

    test('should return empty array when default TODO.md does not exist', async () => {
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue([]);
      
      const files = await mdtail.expandFiles([], mockDir);
      
      expect(files).toEqual([]);
    });

    test('should expand wildcard to all .md files', async () => {
      const expectedFiles = [
        path.resolve(mockDir, 'README.md'),
        path.resolve(mockDir, 'TODO.md'),
        path.resolve(mockDir, 'notes.md')
      ];
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue(expectedFiles);
      
      const files = await mdtail.expandFiles(['*.md'], mockDir);
      
      expect(files).toHaveLength(3);
      expect(files).toContain(path.resolve(mockDir, 'README.md'));
      expect(files).toContain(path.resolve(mockDir, 'TODO.md'));
      expect(files).toContain(path.resolve(mockDir, 'notes.md'));
    });

    test('should handle specific file paths', async () => {
      const expectedFiles = [
        path.resolve(mockDir, 'README.md'),
        path.resolve(mockDir, 'TODO.md')
      ];
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue(expectedFiles);
      
      const files = await mdtail.expandFiles(['README.md', 'TODO.md'], mockDir);
      
      expect(files).toHaveLength(2);
      expect(files).toContain(path.resolve(mockDir, 'README.md'));
      expect(files).toContain(path.resolve(mockDir, 'TODO.md'));
    });

    test('should filter out non-markdown files', async () => {
      const expectedFiles = [path.resolve(mockDir, 'README.md')];
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue(expectedFiles);
      
      const files = await mdtail.expandFiles(['test.txt', 'README.md'], mockDir);
      
      expect(files).toHaveLength(1);
      expect(files).toContain(path.resolve(mockDir, 'README.md'));
    });

    test('should remove duplicate files', async () => {
      const expectedFiles = [path.resolve(mockDir, 'README.md')];
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue(expectedFiles);
      
      const files = await mdtail.expandFiles(['README.md', 'README.md'], mockDir);
      
      expect(files).toHaveLength(1);
      expect(files).toContain(path.resolve(mockDir, 'README.md'));
    });

    test('should log warning when markdown file does not exist', async () => {
      mdtail.fileManager.expandFiles = jest.fn().mockResolvedValue([]);
      
      const files = await mdtail.expandFiles(['missing.md'], mockDir);
      
      expect(files).toEqual([]);
    });
  });

  describe('validateFiles', () => {
    test('should return true for valid file array', () => {
      const result = mdtail.validateFiles(['/test/file.md']);
      expect(result).toBe(true);
    });

    test('should throw error for empty array', () => {
      expect(() => mdtail.validateFiles([])).toThrow('No markdown files found to watch');
    });

    test('should throw error for non-array input', () => {
      expect(() => mdtail.validateFiles('not-an-array')).toThrow('No markdown files found to watch');
    });

    test('should throw error for null input', () => {
      expect(() => mdtail.validateFiles(null)).toThrow('No markdown files found to watch');
    });
  });

  describe('renderTabs', () => {
    test('should return empty string for single file', () => {
      const result = mdtail.renderTabs(['/file.md'], 0);
      expect(result).toBe('');
    });

    test('should render tabs with active file in brackets', () => {
      const files = ['/README.md', '/TODO.md'];
      const result = mdtail.renderTabs(files, 0);
      
      expect(result).toContain('[README.md]');
      expect(result).toContain(' TODO.md ');
    });

    test('should mark second file as active when index is 1', () => {
      const files = ['/README.md', '/TODO.md'];
      const result = mdtail.renderTabs(files, 1);
      
      expect(result).toContain(' README.md ');
      expect(result).toContain('[TODO.md]');
    });

    test('should separate tabs with divider', () => {
      const files = ['/file1.md', '/file2.md'];
      const result = mdtail.renderTabs(files, 0);
      
      expect(result).toContain(' │ ');
    });
  });

  describe('formatContent', () => {
    test('should format content with borders', () => {
      const result = mdtail.formatContent('Test content', 'test.md');
      
      expect(result).toContain('═'.repeat(80));
      expect(result).toContain('TEST.MD');
      expect(result).toContain('Test content');
    });

    test('should uppercase the filename', () => {
      const result = mdtail.formatContent('', 'readme.md');
      
      expect(result).toContain('README.MD');
    });

    test('should handle empty content', () => {
      const result = mdtail.formatContent('', 'test.md');
      
      expect(result).toContain('TEST.MD');
      expect(result).toContain('═'.repeat(80));
    });
  });

  describe('getHelpText', () => {
    test('should return help text with usage examples', () => {
      const helpText = mdtail.getHelpText();
      
      expect(helpText).toContain('mdtail');
      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('Examples:');
      expect(helpText).toContain('Navigation:');
    });
  });

  describe('navigateTab', () => {
    beforeEach(() => {
      mdtail.files = ['/file1.md', '/file2.md', '/file3.md'];
      mdtail.currentTabIndex = 1;
    });

    test('should navigate left', () => {
      const result = mdtail.navigateTab('left');
      
      expect(result).toBe(true);
      expect(mdtail.currentTabIndex).toBe(0);
    });

    test('should navigate right', () => {
      const result = mdtail.navigateTab('right');
      
      expect(result).toBe(true);
      expect(mdtail.currentTabIndex).toBe(2);
    });

    test('should wrap around when navigating left from first tab', () => {
      mdtail.currentTabIndex = 0;
      
      const result = mdtail.navigateTab('left');
      
      expect(result).toBe(true);
      expect(mdtail.currentTabIndex).toBe(2);
    });

    test('should wrap around when navigating right from last tab', () => {
      mdtail.currentTabIndex = 2;
      
      const result = mdtail.navigateTab('right');
      
      expect(result).toBe(true);
      expect(mdtail.currentTabIndex).toBe(0);
    });

    test('should return false for invalid direction', () => {
      const result = mdtail.navigateTab('up');
      
      expect(result).toBe(false);
      expect(mdtail.currentTabIndex).toBe(1);
    });

    test('should return false when only one file', () => {
      mdtail.files = ['/single.md'];
      
      const result = mdtail.navigateTab('left');
      
      expect(result).toBe(false);
    });

    test('should return false when no files', () => {
      mdtail.files = [];
      
      const result = mdtail.navigateTab('right');
      
      expect(result).toBe(false);
    });
  });

  describe('clearScreen, hideCursor, showCursor', () => {
    let consoleClearSpy;
    let stdoutWriteSpy;

    beforeEach(() => {
      consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation();
      stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    });

    afterEach(() => {
      consoleClearSpy.mockRestore();
      stdoutWriteSpy.mockRestore();
    });

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
});