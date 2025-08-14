const MdTail = require('../lib/mdtail');
const fs = require('fs');
const path = require('path');

// Mock fs module
jest.mock('fs');

describe('MdTail', () => {
  let mdtail;

  beforeEach(() => {
    mdtail = new MdTail();
    jest.clearAllMocks();
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

    test('should default to TODO.md when no args provided', () => {
      fs.existsSync.mockReturnValue(true);
      
      const files = mdtail.expandFiles([], mockDir);
      
      expect(files).toEqual([path.join(mockDir, 'TODO.md')]);
      expect(fs.existsSync).toHaveBeenCalledWith(path.join(mockDir, 'TODO.md'));
    });

    test('should return empty array when default TODO.md does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const files = mdtail.expandFiles([], mockDir);
      
      expect(files).toEqual([]);
    });

    test('should expand wildcard to all .md files', () => {
      fs.readdirSync.mockReturnValue(['README.md', 'TODO.md', 'test.txt', 'notes.md']);
      
      const files = mdtail.expandFiles(['*.md'], mockDir);
      
      expect(files).toEqual([
        path.resolve(mockDir, 'README.md'),
        path.resolve(mockDir, 'TODO.md'),
        path.resolve(mockDir, 'notes.md')
      ]);
    });

    test('should handle specific file paths', () => {
      fs.existsSync.mockReturnValue(true);
      
      const files = mdtail.expandFiles(['README.md', 'TODO.md'], mockDir);
      
      expect(files).toEqual([
        path.resolve(mockDir, 'README.md'),
        path.resolve(mockDir, 'TODO.md')
      ]);
    });

    test('should filter out non-markdown files', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return !filePath.endsWith('.txt');
      });
      
      const files = mdtail.expandFiles(['README.md', 'test.txt'], mockDir);
      
      expect(files).toEqual([
        path.resolve(mockDir, 'README.md')
      ]);
    });

    test('should remove duplicate files', () => {
      fs.existsSync.mockReturnValue(true);
      
      const files = mdtail.expandFiles(['README.md', 'README.md'], mockDir);
      
      expect(files).toEqual([
        path.resolve(mockDir, 'README.md')
      ]);
    });
  });

  describe('validateFiles', () => {
    test('should return true for valid file array', () => {
      const result = mdtail.validateFiles(['file1.md', 'file2.md']);
      expect(result).toBe(true);
    });

    test('should throw error for empty array', () => {
      expect(() => {
        mdtail.validateFiles([]);
      }).toThrow('No markdown files found to watch');
    });

    test('should throw error for non-array input', () => {
      expect(() => {
        mdtail.validateFiles('not-an-array');
      }).toThrow('No markdown files found to watch');
    });

    test('should throw error for null input', () => {
      expect(() => {
        mdtail.validateFiles(null);
      }).toThrow('No markdown files found to watch');
    });
  });

  describe('renderTabs', () => {
    test('should return empty string for single file', () => {
      const result = mdtail.renderTabs(['/path/to/file.md'], 0);
      expect(result).toBe('');
    });

    test('should render tabs with active file in brackets', () => {
      const files = ['/path/to/README.md', '/path/to/TODO.md'];
      const result = mdtail.renderTabs(files, 0, 40);
      
      expect(result).toContain('[README.md]');
      expect(result).toContain(' TODO.md ');
      expect(result).toContain('─'.repeat(40));
    });

    test('should mark second file as active when index is 1', () => {
      const files = ['/path/to/README.md', '/path/to/TODO.md'];
      const result = mdtail.renderTabs(files, 1, 40);
      
      expect(result).toContain(' README.md ');
      expect(result).toContain('[TODO.md]');
    });

    test('should separate tabs with divider', () => {
      const files = ['/path/to/file1.md', '/path/to/file2.md', '/path/to/file3.md'];
      const result = mdtail.renderTabs(files, 0);
      
      expect(result).toContain(' │ ');
    });
  });

  describe('formatContent', () => {
    test('should format content with borders', () => {
      const content = 'Test content';
      const result = mdtail.formatContent(content, 'test.md', 20);
      
      expect(result).toContain('═'.repeat(20));
      expect(result).toContain('TEST.MD');
      expect(result).toContain('Test content');
    });

    test('should uppercase the filename', () => {
      const result = mdtail.formatContent('content', 'readme.md');
      expect(result).toContain('README.MD');
    });

    test('should handle empty content', () => {
      const result = mdtail.formatContent('', 'file.md');
      expect(result).toContain('FILE.MD');
      expect(result).toContain('═'.repeat(80));
    });
  });

  describe('getHelpText', () => {
    test('should return help text with usage examples', () => {
      const helpText = mdtail.getHelpText();
      
      expect(helpText).toContain('mdtail - Terminal markdown viewer');
      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('Navigation:');
      expect(helpText).toContain('Examples:');
      expect(helpText).toContain('--help');
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
      expect(mdtail.currentTabIndex).toBe(1); // Should not change
    });

    test('should return false when only one file', () => {
      mdtail.files = ['/single.md'];
      mdtail.currentTabIndex = 0;
      
      const result = mdtail.navigateTab('right');
      
      expect(result).toBe(false);
      expect(mdtail.currentTabIndex).toBe(0);
    });

    test('should return false when no files', () => {
      mdtail.files = [];
      
      const result = mdtail.navigateTab('right');
      
      expect(result).toBe(false);
    });
  });
});