# AI Conversations

Note Village uses Claude AI to bring your notes to life through conversations.

## Setup

### API Key

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Open **Settings → Note Village**
3. Enter your API key in the **Anthropic API Key** field

### Model Selection

Choose your preferred Claude model:

| Model             | Description                   |
| ----------------- | ----------------------------- |
| Claude 3 Haiku    | Fastest, most economical      |
| Claude 3.5 Sonnet | Balanced speed and capability |
| Claude Sonnet 4   | Most capable (default)        |

## How Conversations Work

### Context

When you talk to a villager, the AI receives:

- The full note content
- A system prompt establishing the villager persona
- Your conversation history

### Villager Persona

Each villager's personality is based on:

- The note title (their "name")
- The note content (their "knowledge")
- The note's tags (their "interests")

### Example Conversation

```
You: What do you know about project management?

Villager (Project Notes): Based on my experience, I can tell
you about agile methodologies, sprint planning, and team
coordination. Would you like me to elaborate on any of these?
```

## Saving Conversations

### Enable Saving

In settings, enable **Save conversations** to persist chats.

### Storage Location

Conversations are saved to:

```
{vault}/village-conversations/{note-name}-{timestamp}.md
```

Configure the folder in **Conversation folder** setting.

### Conversation Format

Saved conversations include:

```markdown
---
villager: Note Title
date: 2024-01-15T10:30:00
---

## Conversation

**You**: Your question here

**Villager**: The AI response here

**You**: Follow-up question

**Villager**: Another response
```

## Tips

### Effective Questions

- Ask about specific topics in the note
- Request summaries or explanations
- Explore connections between ideas

### Context Awareness

The AI knows:

- Everything in the note
- The conversation history
- General knowledge

The AI doesn't know:

- Other notes in your vault
- Your personal context beyond the note
- Real-time information

### Cost Management

- Haiku is most economical for casual use
- Longer notes = more tokens = higher cost
- Consider note length when planning conversations

## Troubleshooting

### "API Key Invalid"

- Verify key in Anthropic Console
- Check for leading/trailing spaces
- Ensure key has API access enabled

### Slow Responses

- Try a faster model (Haiku)
- Check your internet connection
- Large notes take longer to process

### Conversations Not Saving

- Verify **Save conversations** is enabled
- Check folder permissions
- Ensure conversation folder exists
