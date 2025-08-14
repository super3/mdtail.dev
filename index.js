#!/usr/bin/env node

const MdTail = require('./lib/mdtail');

// Create instance and run
const mdtail = new MdTail();
const args = process.argv.slice(2);

// Run async
(async () => {
  await mdtail.run(args);
})();