#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse command-line arguments
const args = process.argv.slice(2);
let files = [];
let currentTabIndex = 0;

// Handle help flag
if (args.includes('-h') || args.includes('--help')) {
  console.log(`
mdtail - Terminal markdown viewer with live refresh

Usage:
  mdtail [file1.md] [file2.md] ...  Watch specific markdown files
  mdtail                             Watch TODO.md (default)
  mdtail -h, --help                  Show this help message

Navigation:
  ← / → Arrow Keys                   Switch between tabs
  Ctrl+C                             Exit

Examples:
  mdtail README.md                   Watch README.md
  mdtail todo.md notes.md            Watch multiple files with tabs
  mdtail *.md                        Watch all markdown files in tabs
`);
  process.exit(0);
}

// Get markdown files from arguments or default to todo.md
if (args.length > 0) {
  // Expand wildcards and resolve paths
  args.forEach(arg => {
    if (arg.includes('*')) {
      // Handle wildcards
      const glob = require('fs').readdirSync(process.cwd())
        .filter(file => file.endsWith('.md'))
        .sort(); // Sort files alphabetically
      files.push(...glob.map(f => path.resolve(f)));
    } else {
      // Resolve individual file paths
      const filePath = path.resolve(arg);
      if (fs.existsSync(filePath) && filePath.endsWith('.md')) {
        files.push(filePath);
      } else if (!filePath.endsWith('.md')) {
        console.error(`Warning: ${arg} is not a markdown file`);
      } else {
        console.error(`Warning: ${arg} not found`);
      }
    }
  });
} else {
  // Default to TODO.md in current directory
  const defaultFile = path.join(process.cwd(), 'TODO.md');
  if (fs.existsSync(defaultFile)) {
    files.push(defaultFile);
  }
}

// Remove duplicates
files = [...new Set(files)];

if (files.length === 0) {
  console.error('Error: No markdown files found to watch');
  console.log('Run "mdtail --help" for usage information');
  process.exit(1);
}

function clearScreen() {
  console.clear();
}

function renderTabs(width) {
  if (files.length === 1) return '';
  
  const tabs = files.map((file, index) => {
    const filename = path.basename(file);
    const isActive = index === currentTabIndex;
    
    if (isActive) {
      return `[${filename}]`;
    } else {
      return ` ${filename} `;
    }
  });
  
  const tabLine = tabs.join(' │ ');
  const navigation = '  ← → Navigate tabs';
  
  return `${tabLine}\n${'─'.repeat(width)}\n`;
}

function displayCurrentFile() {
  clearScreen();
  process.stdout.write('\x1B[?25l'); // Hide cursor
  
  const width = process.stdout.columns || 80;
  const currentFile = files[currentTabIndex];
  
  try {
    const content = fs.readFileSync(currentFile, 'utf8');
    const filename = path.basename(currentFile);
    
    // Header
    console.log('\n' + '═'.repeat(width));
    
    // Tabs (if multiple files)
    if (files.length > 1) {
      console.log(renderTabs(width));
    } else {
      console.log(filename.toUpperCase());
      console.log('═'.repeat(width) + '\n');
    }
    
    // Content
    console.log(content);
    
    // Footer
    console.log('\n' + '═'.repeat(width));
    
    if (files.length > 1) {
      console.log(`Tab ${currentTabIndex + 1} of ${files.length} │ ← → Navigate │ Ctrl+C Exit`);
    } else {
      console.log('Watching for changes... (Ctrl+C to exit)');
    }
  } catch (error) {
    console.error(`Error reading ${currentFile}:`, error.message);
  }
}

function setupKeyboardNavigation() {
  // Skip keyboard setup if not in TTY mode
  if (!process.stdin.isTTY) {
    return;
  }
  
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume(); // Start reading from stdin
  
  process.stdin.on('keypress', (str, key) => {
    if (key && key.ctrl && key.name === 'c') {
      // Exit
      process.stdin.setRawMode(false);
      process.stdout.write('\x1B[?25h'); // Show cursor again
      console.log('\n\nStopping mdtail...');
      process.exit(0);
    }
    
    if (files.length > 1) {
      if (key && key.name === 'left') {
        // Previous tab
        currentTabIndex = (currentTabIndex - 1 + files.length) % files.length;
        displayCurrentFile();
      } else if (key && key.name === 'right') {
        // Next tab
        currentTabIndex = (currentTabIndex + 1) % files.length;
        displayCurrentFile();
      }
    }
  });
}

function startWatching() {
  // Setup keyboard navigation
  setupKeyboardNavigation();
  
  // Initial display
  displayCurrentFile();
  
  // Watch each file
  files.forEach((file, index) => {
    fs.watchFile(file, { interval: 100 }, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        // Only redraw if we're viewing the changed file or if there's only one file
        if (index === currentTabIndex || files.length === 1) {
          displayCurrentFile();
        }
      }
    });
  });
  
  // Show initial file list
  if (files.length > 1) {
    console.log(`\nWatching ${files.length} files. Use arrow keys to navigate.`);
    setTimeout(() => {
      displayCurrentFile();
    }, 1500);
  }
}

// Handle exit gracefully
process.on('SIGINT', () => {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdout.write('\x1B[?25h'); // Show cursor again
  console.log('\n\nStopping mdtail...');
  process.exit(0);
});

// Start watching the files
startWatching();