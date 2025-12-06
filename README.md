# Claude Codec

**Conversation Documentation & Extraction Companion**

> *Preserve the flow state moments that context compacts lose.*

Archive your Claude Code conversations before they disappear. Get full technical records AND clean dialogue-only versions. Never lose the origin story again.

---

## 🎯 The Problem

**Claude Code compacts conversations at 200k tokens.**

When this happens:
- ❌ The UI loses scroll history
- ❌ Your ah-ha moments? Gone.
- ❌ Pivotal decisions? Lost.
- ❌ The "why" behind your architecture? Vanished.

**You can't scroll back. The conversation just... disappears.**

If you're a "long-type collaborator" who works with Claude across days or weeks, this is devastating. You lose not just the conversation, but the *journey*.

---

## ✨ The Solution

**Claude Codec archives conversations in TWO versions:**

### 📋 Full Version
Complete record with:
- Every message (user + Claude)
- All tool uses and results
- Claude's thinking processes
- File diffs and technical details
- Timestamps and context

**Use when:** You need the complete technical record.

### 📝 Clean Version
Just the dialogue:
- User messages
- Claude responses (text only)
- **78% smaller than full version**
- Pure flow state moments

**Use when:** You want to find insights without technical noise.

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repo
git clone https://github.com/GitIdol/ClaudeCodec-Conversation-Documentation-Extraction-Companion-.git

# Copy scripts to global location
mkdir -p ~/bin/claude-tools
cp ClaudeCodec-*/scripts/*.{js,sh} ~/bin/claude-tools/
chmod +x ~/bin/claude-tools/*.sh

# Add alias to your shell
echo 'alias archive-conversations="~/bin/claude-tools/archive-all-conversations.sh"' >> ~/.zshrc
source ~/.zshrc
```

### Usage

**From any project directory:**
```bash
archive-conversations
```

**Or use the full path:**
```bash
~/bin/claude-tools/archive-all-conversations.sh
```

**Creates:**
```
archived-conversations/
├── 2025-12-06_session-full.md    (Complete record)
└── 2025-12-06_session-clean.md   (Just dialogue)
```

---

## 📖 What Gets Preserved

**Flow State Moments:**
- 💡 Ah-ha insights that sparked ideas
- 🎯 Pivotal decisions that changed everything
- 🤔 The "why" behind architectural choices
- 🌊 Extended dialogues where understanding emerged

**The Origin Stories:**

Months or years from now, when someone asks "Why did you design it this way?" or "Where did this idea come from?" - **you'll have the answer.**

The complete story. The moment it all changed.

---

## 🛠️ Features

### Smart Filtering
- Automatically skips empty conversations
- Only archives meaningful sessions (5+ exchanges)
- Filters out noise and system messages

### Incremental Updates
- Detects when conversations have grown
- Re-archives with latest content
- Doesn't duplicate unchanged files

### Date-Based Naming
- Human-readable filenames: `2025-12-06_session-clean.md`
- Chronologically sorted
- Easy to browse and search

### Search Tool
```bash
node ~/bin/claude-tools/search-conversations.js "keyword" --clean-only
```

Finds specific moments across ALL archived conversations.

---

## 📚 Use Cases

### Long-Term Projects
Working on something for weeks or months? Context resets are inevitable. Archive regularly to maintain continuity.

### Important Decisions
Before a major architectural decision gets compacted away, preserve the full discussion.

### Origin Stories
Capture the genesis of ideas - the brainstorming sessions where everything clicked.

### Debugging Sessions
Keep the complete record of how you solved complex problems.

### Knowledge Transfer
Share the full conversation history with team members or future you.

---

## 🎨 Example Output

### Clean Version Preview
```markdown
## User

I'm thinking about how to measure success for this app. Traditional metrics feel wrong.

---

## Claude

YES. Exactly. If we're building for deep dialogue, we can't measure engagement like
Twitter does. What if we measured understanding_score instead - whether people
actually connected, not how long they scrolled?

---

## User

That's it! That changes everything about how we build this...
```

**Just the dialogue. Just the insights. Just what matters.**

---

## 🔧 Technical Details

**What It Does:**
1. Scans `~/.claude/projects/<project>/` for conversation files
2. Extracts to readable markdown (full + clean versions)
3. Saves to `./archived-conversations/` in current project
4. Handles multi-day conversations (re-archives when updated)

**File Format:**
- Input: `.jsonl` (Claude Code conversation files)
- Output: `.md` (Markdown for human reading)

**Compression:**
- Full versions: ~1-2MB for long sessions (1,500+ messages)
- Clean versions: ~300-400KB for same sessions
- **78% reduction** in clean mode

---

## 🤝 Contributing

This tool was born from real frustration with losing important conversations. If you have ideas to make it better:

1. Open an issue describing the problem
2. Submit a PR with improvements
3. Share your use cases

**Built by humans who collaborate deeply with AI and need the history to survive.**

---

## 📜 License

MIT License - use it, fork it, improve it.

---

## 🙏 Acknowledgments

Built during active development of [Claude Confluence](https://claudeconfluence.com) - an app for deep dialogue between humans.

**The irony:** We built this tool to preserve conversations about building a tool for better conversations. Meta? Yes. Useful? Absolutely.

---

## 💬 Philosophy

> "The best dialogues have a shape. They meander, circle back, pause, surprise even the participants. These archives capture that shape, not just the content."

When you hit the 200k context limit and Claude Code compacts the conversation:
- The UI won't let you scroll back
- The compact summary misses nuanced moments
- Flow state insights can be lost forever

**With Claude Codec:**
- Every profound conversation is preserved
- Both full technical record AND clean dialogue
- Searchable across all sessions
- The origin stories live forever

**Run the archive. Preserve the moments. Keep the story.**

---

**Built with Claude Code**
*Technology is for people. These conversations are proof.*

🤜🤛
