#!/usr/bin/env node

/**
 * Search Across Archived Conversations
 *
 * Searches all archived conversation markdown files for specific keywords
 * and shows matching exchanges with context.
 *
 * Usage:
 *   node search-conversations.js <search-term> [options]
 *
 * Options:
 *   --clean-only    Search only clean versions (default: search both)
 *   --full-only     Search only full versions
 *   --context N     Show N exchanges before/after match (default: 1)
 *
 * Examples:
 *   node search-conversations.js "understanding score"
 *   node search-conversations.js "database" --clean-only
 *   node search-conversations.js "flow state" --context 2
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0].startsWith('--')) {
  console.error('Usage: node search-conversations.js <search-term> [options]');
  console.error('');
  console.error('Options:');
  console.error('  --clean-only    Search only clean versions (default: search both)');
  console.error('  --full-only     Search only full versions');
  console.error('  --context N     Show N exchanges before/after match (default: 1)');
  console.error('');
  console.error('Examples:');
  console.error('  node search-conversations.js "understanding score"');
  console.error('  node search-conversations.js "database" --clean-only');
  console.error('  node search-conversations.js "flow state" --context 2');
  process.exit(1);
}

const searchTerm = args[0];
let cleanOnly = false;
let fullOnly = false;
let contextLines = 1;

// Parse options
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--clean-only') {
    cleanOnly = true;
  } else if (args[i] === '--full-only') {
    fullOnly = true;
  } else if (args[i] === '--context') {
    contextLines = parseInt(args[i + 1]) || 1;
    i++; // Skip next arg
  }
}

// Get archive directory
const archiveDir = path.join(process.cwd(), 'archived-conversations');

if (!fs.existsSync(archiveDir)) {
  console.error(`❌ No archived conversations found.`);
  console.error(`   Expected directory: ${archiveDir}`);
  console.error(`   Run ./scripts/archive-all-conversations.sh first.`);
  process.exit(1);
}

// Get list of files to search
const files = fs.readdirSync(archiveDir)
  .filter(f => f.endsWith('.md') && f !== 'README.md')
  .filter(f => {
    if (cleanOnly) return f.endsWith('-clean.md');
    if (fullOnly) return f.endsWith('-full.md');
    return true;
  })
  .sort();

if (files.length === 0) {
  console.error('❌ No conversation files found to search.');
  process.exit(1);
}

console.log(`🔍 Searching for: "${searchTerm}"`);
console.log(`📁 Searching ${files.length} file(s)...`);
console.log(``);

let totalMatches = 0;
let filesWithMatches = 0;

// Search each file
for (const filename of files) {
  const filepath = path.join(archiveDir, filename);
  const content = fs.readFileSync(filepath, 'utf-8');

  // Split into exchanges (User/Claude pairs)
  const exchanges = content.split('---\n\n').filter(Boolean);

  let fileMatches = 0;

  // Search each exchange
  for (let i = 0; i < exchanges.length; i++) {
    const exchange = exchanges[i];

    // Check if search term appears (case-insensitive)
    if (exchange.toLowerCase().includes(searchTerm.toLowerCase())) {
      // First match in this file
      if (fileMatches === 0) {
        filesWithMatches++;
        console.log(`\n📄 ${filename}`);
        console.log(`${'='.repeat(filename.length + 3)}`);
      }

      fileMatches++;
      totalMatches++;

      console.log(``);
      console.log(`Match #${fileMatches} (Exchange ${i + 1}):`);
      console.log(`${'-'.repeat(60)}`);

      // Show context before
      if (contextLines > 0 && i > 0) {
        for (let j = Math.max(0, i - contextLines); j < i; j++) {
          console.log(`[Context]`);
          console.log(exchanges[j].trim());
          console.log(``);
        }
      }

      // Show matching exchange (highlighted)
      const highlightedExchange = exchange.replace(
        new RegExp(searchTerm, 'gi'),
        match => `**>>> ${match} <<<**`
      );
      console.log(`[MATCH]`);
      console.log(highlightedExchange.trim());
      console.log(``);

      // Show context after
      if (contextLines > 0 && i < exchanges.length - 1) {
        for (let j = i + 1; j <= Math.min(exchanges.length - 1, i + contextLines); j++) {
          console.log(`[Context]`);
          console.log(exchanges[j].trim());
          console.log(``);
        }
      }
    }
  }
}

// Summary
console.log(``);
console.log(`${'='.repeat(60)}`);
console.log(`✅ Search complete!`);
console.log(``);
console.log(`Results:`);
console.log(`  - ${totalMatches} match(es) found`);
console.log(`  - Across ${filesWithMatches} file(s)`);
console.log(`  - Searched ${files.length} total file(s)`);

if (totalMatches === 0) {
  console.log(``);
  console.log(`💡 Try:`);
  console.log(`   - Broadening your search term`);
  console.log(`   - Using --full-only to search full versions`);
  console.log(`   - Checking if conversations have been archived`);
}
