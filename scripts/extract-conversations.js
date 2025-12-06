#!/usr/bin/env node

/**
 * Extract Claude Code conversations from JSONL to readable Markdown
 *
 * Usage:
 *   node extract-conversations.js [--clean|--full] <input.jsonl> <output.md>
 *
 * Modes:
 *   --full   Full export with tools, thinking, etc. (default)
 *   --clean  Clean export - just dialogue, no tools/thinking
 *
 * Examples:
 *   node extract-conversations.js conversation.jsonl output.md
 *   node extract-conversations.js --clean conversation.jsonl output-clean.md
 *
 * This preserves the flow state moments that compacting loses.
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
let mode = 'full';
let inputFile, outputFile;

const args = process.argv.slice(2);

if (args[0] === '--clean' || args[0] === '--full') {
  mode = args[0].substring(2); // Remove --
  inputFile = args[1];
  outputFile = args[2];
} else {
  inputFile = args[0];
  outputFile = args[1];
}

if (!inputFile || !outputFile) {
  console.error('Usage: node extract-conversations.js [--clean|--full] <input.jsonl> <output.md>');
  console.error('');
  console.error('Modes:');
  console.error('  --full   Full export with tools, thinking, etc. (default)');
  console.error('  --clean  Clean export - just dialogue, no tools/thinking');
  process.exit(1);
}

console.log(`Reading: ${inputFile}`);
console.log(`Mode: ${mode}`);

const lines = fs.readFileSync(inputFile, 'utf-8').split('\n').filter(Boolean);

// Extract metadata from first message
let firstTimestamp = null;
let projectName = 'conversation';
let lastTimestamp = null;

for (const line of lines) {
  try {
    const event = JSON.parse(line);
    if (event.timestamp && !firstTimestamp) {
      firstTimestamp = event.timestamp;
    }
    if (event.timestamp) {
      lastTimestamp = event.timestamp;
    }
    if (event.cwd && !projectName.includes('/')) {
      // Extract project name from path
      const parts = event.cwd.split('/');
      projectName = parts[parts.length - 1] || 'conversation';
    }
  } catch (err) {
    // Skip malformed lines
  }
}

// Format dates
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateShort(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Build header
let markdown = `# ${projectName}\n\n`;

if (mode === 'clean') {
  markdown += `**📝 Clean Conversation Export** - Flow state moments preserved\n\n`;
} else {
  markdown += `**📋 Full Conversation Export** - Complete session with tools and thinking\n\n`;
}

if (firstTimestamp) {
  markdown += `**Session Date:** ${formatDateShort(firstTimestamp)}\n`;
}
markdown += `**Extracted:** ${formatDateShort(new Date().toISOString())}\n`;
markdown += `**Source:** ${path.basename(inputFile)}\n`;
markdown += `**Mode:** ${mode}\n\n`;
markdown += `---\n\n`;

let messageCount = 0;
let userMessageCount = 0;
let claudeMessageCount = 0;

for (const line of lines) {
  try {
    const event = JSON.parse(line);

    // Handle user messages
    if (event.type === 'user' && event.message) {
      const content = event.message.content;
      let hasTextContent = false;

      // Check if there's actual text content
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === 'text' && part.text.trim()) {
            hasTextContent = true;
            break;
          }
        }
      }

      // In clean mode, skip messages with no text content
      if (mode === 'clean' && !hasTextContent) {
        continue;
      }

      messageCount++;
      userMessageCount++;

      markdown += `## User\n\n`;

      if (mode === 'full') {
        markdown += `*${formatDate(event.timestamp)}*\n\n`;
      }

      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === 'text') {
            markdown += `${part.text}\n\n`;
          } else if (part.type === 'tool_result' && mode === 'full') {
            markdown += `**Tool Result:**\n\n\`\`\`\n${part.content}\n\`\`\`\n\n`;
          } else if (part.type === 'image') {
            markdown += `*[Image attached]*\n\n`;
          }
        }
      }

      markdown += `---\n\n`;
    }

    // Handle assistant messages
    else if (event.type === 'assistant' && event.message) {
      messageCount++;
      claudeMessageCount++;

      markdown += `## Claude\n\n`;

      if (mode === 'full') {
        markdown += `*${formatDate(event.timestamp)}*\n\n`;
      }

      const content = event.message.content;
      if (Array.isArray(content)) {
        let hasTextContent = false;

        for (const part of content) {
          if (part.type === 'text') {
            markdown += `${part.text}\n\n`;
            hasTextContent = true;
          }
          else if (part.type === 'thinking' && mode === 'full') {
            markdown += `<details>\n<summary>💭 Claude's Thinking</summary>\n\n${part.thinking}\n\n</details>\n\n`;
          }
          else if (part.type === 'tool_use' && mode === 'full') {
            markdown += `**🔧 Tool Used:** \`${part.name}\`\n\n`;
            if (part.input?.description) {
              markdown += `*${part.input.description}*\n\n`;
            }
            markdown += `<details>\n<summary>Tool Input</summary>\n\n\`\`\`json\n${JSON.stringify(part.input, null, 2)}\n\`\`\`\n\n</details>\n\n`;
          }
        }

        // In clean mode, skip messages that only have tools (no text)
        if (mode === 'clean' && !hasTextContent) {
          messageCount--;
          claudeMessageCount--;
          markdown = markdown.split('## Claude\n\n').slice(0, -1).join('## Claude\n\n');
          continue;
        }
      }

      markdown += `---\n\n`;
    }

    // Handle standalone tool results (only in full mode)
    else if (event.type === 'tool-result' && mode === 'full') {
      markdown += `**Tool Result:** \`${event.toolName}\`\n\n`;
      if (event.result) {
        const resultStr = typeof event.result === 'string' ? event.result : JSON.stringify(event.result, null, 2);
        markdown += `\`\`\`\n${resultStr.substring(0, 1000)}${resultStr.length > 1000 ? '\n... (truncated)' : ''}\n\`\`\`\n\n`;
      }
    }
  } catch (err) {
    // Skip malformed lines silently
  }
}

// Add footer
markdown += `\n\n---\n\n`;
markdown += `**Session Summary:**\n`;
markdown += `- ${userMessageCount} user messages\n`;
markdown += `- ${claudeMessageCount} Claude responses\n`;
markdown += `- ${messageCount} total exchanges\n`;

if (mode === 'clean') {
  markdown += `\n*This is a clean export showing only the dialogue. Tools, thinking, and technical details have been filtered out to preserve the flow state moments and key insights.*\n`;
}

fs.writeFileSync(outputFile, markdown);

const fileSizeKB = (fs.statSync(outputFile).size / 1024).toFixed(1);

console.log(`✅ Exported ${messageCount} messages to: ${outputFile}`);
console.log(`   Mode: ${mode}`);
console.log(`   User messages: ${userMessageCount}`);
console.log(`   Claude responses: ${claudeMessageCount}`);
console.log(`   File size: ${fileSizeKB} KB`);

// Return session date for use in batch scripts
if (firstTimestamp) {
  const date = new Date(firstTimestamp);
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  console.log(`   Session date: ${dateString}`);
}
