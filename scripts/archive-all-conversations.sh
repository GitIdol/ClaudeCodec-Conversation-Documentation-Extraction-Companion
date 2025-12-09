#!/bin/bash

##
# Archive All Claude Code Conversations
#
# Extracts ALL conversation files from ~/.claude/projects/<project>/
# into readable markdown format, creating BOTH full and clean versions.
#
# Full version: Complete with tools, thinking, technical details
# Clean version: Just dialogue - the flow state moments
#
# Usage:
#   ./scripts/archive-all-conversations.sh
##

PROJECT_DIR="$(pwd)"
PROJECT_NAME=$(basename "$PROJECT_DIR")
# Convert path to Claude's naming format (replace / with - and spaces with -)
CLAUDE_PROJECT_NAME=$(echo "$PROJECT_DIR" | sed 's|/|-|g' | sed 's| |-|g' | sed 's|^-||')
CLAUDE_PROJECT_DIR="$HOME/.claude/projects/-$CLAUDE_PROJECT_NAME"
ARCHIVE_DIR="$PROJECT_DIR/archived-conversations"
SCRIPT_DIR="$HOME/bin/claude-tools"

# Create archive directory if it doesn't exist
mkdir -p "$ARCHIVE_DIR"

echo "🗄️  Archiving Claude Code Conversations"
echo "========================================"
echo ""
echo "Project: $PROJECT_NAME"
echo "Source: $CLAUDE_PROJECT_DIR"
echo "Output: $ARCHIVE_DIR"
echo ""

# Check if Claude project directory exists
if [ ! -d "$CLAUDE_PROJECT_DIR" ]; then
  echo "❌ No Claude Code conversations found for this project."
  echo "   Expected: $CLAUDE_PROJECT_DIR"
  exit 1
fi

# Counters
count_full=0
count_clean=0
count_skipped=0

# Find all UUID-named conversation files (main sessions)
for jsonl_file in "$CLAUDE_PROJECT_DIR"/*.jsonl; do
  # Skip if no files found
  if [ ! -f "$jsonl_file" ]; then
    continue
  fi

  # Skip agent files (we'll handle those separately if needed)
  basename=$(basename "$jsonl_file")
  if [[ $basename == agent-* ]]; then
    continue
  fi

  # Get file size
  size=$(du -h "$jsonl_file" | cut -f1)

  # Skip empty files
  if [ "$size" = "0B" ]; then
    echo "⏭️  Skipping (empty): $basename"
    ((count_skipped++))
    continue
  fi

  # Skip very small files (likely just opened but never used)
  # Count actual message lines (user/assistant exchanges)
  message_count=$(grep -o '"type":"user"' "$jsonl_file" 2>/dev/null | wc -l | tr -d ' ')
  assistant_count=$(grep -o '"type":"assistant"' "$jsonl_file" 2>/dev/null | wc -l | tr -d ' ')
  total_messages=$((message_count + assistant_count))

  if [ "$total_messages" -lt 5 ]; then
    echo "⏭️  Skipping (too few messages: $total_messages): $basename"
    ((count_skipped++))
    continue
  fi

  # Extract session date by running the script and capturing output
  echo "📝 Extracting: $basename ($size)"

  # Extract to temporary file to get the date
  temp_output=$(mktemp)
  node "$SCRIPT_DIR/extract-conversations.js" --full "$jsonl_file" "$temp_output" 2>&1 | grep "Session date:" | awk '{print $NF}'
  session_date=$(node "$SCRIPT_DIR/extract-conversations.js" --full "$jsonl_file" "$temp_output" 2>&1 | grep "Session date:" | awk '{print $NF}')
  rm "$temp_output"

  # Use date if available, otherwise use UUID
  if [ -n "$session_date" ]; then
    base_filename="${session_date}_session"
  else
    uuid=$(basename "$jsonl_file" .jsonl)
    base_filename="conversation-${uuid}"
  fi

  # Output filenames
  full_output="$ARCHIVE_DIR/${base_filename}-full.md"
  clean_output="$ARCHIVE_DIR/${base_filename}-clean.md"

  # Check if source file is newer than archived versions (conversation continued)
  needs_update=false
  if [ -f "$full_output" ]; then
    # Compare modification times
    if [ "$jsonl_file" -nt "$full_output" ]; then
      needs_update=true
      echo "   🔄 Source updated since last archive - re-archiving with latest content"
    fi
  fi

  # Skip if both already exist AND source hasn't been modified
  if [ -f "$full_output" ] && [ -f "$clean_output" ] && [ "$needs_update" = false ]; then
    echo "   ⏭️  Skipping (already archived, no changes): $base_filename"
    ((count_skipped++))
    continue
  fi

  # Extract full version (create new or update if source changed)
  if [ ! -f "$full_output" ] || [ "$needs_update" = true ]; then
    node "$SCRIPT_DIR/extract-conversations.js" --full "$jsonl_file" "$full_output" > /dev/null 2>&1
    ((count_full++))
    if [ "$needs_update" = true ]; then
      echo "   ✅ Full version: ${base_filename}-full.md (updated)"
    else
      echo "   ✅ Full version: ${base_filename}-full.md"
    fi
  fi

  # Extract clean version (create new or update if source changed)
  if [ ! -f "$clean_output" ] || [ "$needs_update" = true ]; then
    node "$SCRIPT_DIR/extract-conversations.js" --clean "$jsonl_file" "$clean_output" > /dev/null 2>&1
    ((count_clean++))
    if [ "$needs_update" = true ]; then
      echo "   ✅ Clean version: ${base_filename}-clean.md (updated)"
    else
      echo "   ✅ Clean version: ${base_filename}-clean.md"
    fi
  fi

  echo ""
done

echo "========================================"
echo "✅ Archive complete!"
echo ""
echo "Created:"
echo "  - $count_full full version(s)"
echo "  - $count_clean clean version(s)"
if [ $count_skipped -gt 0 ]; then
  echo "  - $count_skipped skipped (already archived or empty)"
fi
echo ""
echo "📁 Archived to: $ARCHIVE_DIR"
echo ""
echo "💡 Tip:"
echo "   - Full versions have all details (tools, thinking, etc.)"
echo "   - Clean versions have just the dialogue (flow state moments)"
echo "   - Run this before hitting the 200k context limit to preserve profound conversations"
