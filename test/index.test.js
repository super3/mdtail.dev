const path = require('path');

// Mock the MdTail module before requiring index
jest.mock('../lib/mdtail');

describe('index.js', () => {
  let mockRun;
  let mockMdTailInstance;
  let originalArgv;

  beforeEach(() => {
    // Save original process.argv
    originalArgv = process.argv;
    
    // Clear the module cache to ensure fresh imports
    jest.resetModules();
    
    // Setup the mock
    const MdTail = require('../lib/mdtail');
    mockRun = jest.fn();
    mockMdTailInstance = {
      run: mockRun
    };
    MdTail.mockImplementation(() => mockMdTailInstance);
  });

  afterEach(() => {
    // Restore original process.argv
    process.argv = originalArgv;
    jest.clearAllMocks();
  });

  test('should create MdTail instance and call run with no arguments', () => {
    process.argv = ['node', 'index.js'];
    
    // Require index.js which will execute
    require('../index');
    
    // Verify MdTail was instantiated
    const MdTail = require('../lib/mdtail');
    expect(MdTail).toHaveBeenCalledTimes(1);
    
    // Verify run was called with empty array (no args)
    expect(mockRun).toHaveBeenCalledWith([]);
  });

  test('should pass single argument to run method', () => {
    process.argv = ['node', 'index.js', 'README.md'];
    
    // Clear and re-require to run with new argv
    jest.resetModules();
    const MdTail = require('../lib/mdtail');
    mockRun = jest.fn();
    mockMdTailInstance = { run: mockRun };
    MdTail.mockImplementation(() => mockMdTailInstance);
    
    require('../index');
    
    expect(mockRun).toHaveBeenCalledWith(['README.md']);
  });

  test('should pass multiple arguments to run method', () => {
    process.argv = ['node', 'index.js', 'README.md', 'TODO.md', '--help'];
    
    jest.resetModules();
    const MdTail = require('../lib/mdtail');
    mockRun = jest.fn();
    mockMdTailInstance = { run: mockRun };
    MdTail.mockImplementation(() => mockMdTailInstance);
    
    require('../index');
    
    expect(mockRun).toHaveBeenCalledWith(['README.md', 'TODO.md', '--help']);
  });

  test('should handle wildcard arguments', () => {
    process.argv = ['node', 'index.js', '*.md'];
    
    jest.resetModules();
    const MdTail = require('../lib/mdtail');
    mockRun = jest.fn();
    mockMdTailInstance = { run: mockRun };
    MdTail.mockImplementation(() => mockMdTailInstance);
    
    require('../index');
    
    expect(mockRun).toHaveBeenCalledWith(['*.md']);
  });

  test('should handle help flag', () => {
    process.argv = ['node', 'index.js', '--help'];
    
    jest.resetModules();
    const MdTail = require('../lib/mdtail');
    mockRun = jest.fn();
    mockMdTailInstance = { run: mockRun };
    MdTail.mockImplementation(() => mockMdTailInstance);
    
    require('../index');
    
    expect(mockRun).toHaveBeenCalledWith(['--help']);
  });
});