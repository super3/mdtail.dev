#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TODO_FILE = path.join(__dirname, 'todo.md');

function clearScreen() {
  console.clear();
}

function displayTodo() {
  clearScreen();
  process.stdout.write('\x1B[?25l'); // Hide cursor
  
  try {
    const content = fs.readFileSync(TODO_FILE, 'utf8');
    const width = process.stdout.columns || 80;
    console.log('\n' + '='.repeat(width));
    console.log('📝 TODO.MD');
    console.log('='.repeat(width) + '\n');
    console.log(content);
    console.log('\n' + '='.repeat(width));
    console.log('Watching for changes... (Ctrl+C to exit)');
  } catch (error) {
    console.error('Error reading todo.md:', error.message);
  }
}

function startWatching() {
  displayTodo();
  
  fs.watchFile(TODO_FILE, { interval: 100 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      displayTodo();
    }
  });
}

if (!fs.existsSync(TODO_FILE)) {
  console.error('Error: todo.md file not found in current directory');
  process.exit(1);
}

startWatching();

process.on('SIGINT', () => {
  process.stdout.write('\x1B[?25h'); // Show cursor again
  console.log('\n\nStopping todo.md viewer...');
  process.exit(0);
});