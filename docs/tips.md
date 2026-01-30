# Tips and Best Practices

## Organizing Your Vault for the Village

### Tag Strategy

The village layout is based on tags, so:

- **Use consistent tags**: Standardize your tag naming
- **Limit top-level tags**: Too many tags = cluttered village
- **Tag important notes**: Untagged notes may be excluded

### Folder Exclusions

Exclude folders that shouldn't become villagers:

- Templates folder
- Archive/old notes
- System folders
- Daily notes (if not relevant)

## Getting the Most from AI Conversations

### Write Rich Notes

The AI uses your note content, so:

- Detailed notes = better conversations
- Include context and background
- Structure with headings and lists

### Effective Questions

```
Good: "What are the key points about X in this note?"
Good: "Explain the relationship between A and B."
Good: "Summarize the main ideas here."

Less effective: "What do you think?"
Less effective: "Tell me everything."
```

### Conversation Continuity

- The AI remembers the current conversation
- Build on previous responses
- Ask follow-up questions

## Performance Optimization

### Large Vaults

If your vault is large:

1. Exclude unnecessary folders
2. Reduce `maxVillagers`
3. Lower `renderQuality`
4. Use fewer zones (`topTagCount`)

### Slow Loading

- First load analyzes entire vault
- Subsequent loads are faster
- Consider reducing scope with exclusions

## Village Customization

### Changing Layout

To get a new village layout:

1. Change the **Village seed** in settings
2. Reload the village view

### Consistent Experience

To keep the same layout:

- Don't change the seed
- Same seed = same layout every time

## Troubleshooting

### Villagers Missing

Check:

- Note has at least one tag
- Folder isn't excluded
- `maxVillagers` limit not reached

### Village Not Loading

Try:

- Reload the view
- Check console for errors
- Verify Obsidian is up to date

### AI Not Responding

Verify:

- API key is correct
- Internet connection works
- Anthropic service is available

### Poor Performance

Solutions:

- Reduce render quality
- Exclude more folders
- Lower villager count
- Close other resource-heavy applications

## Creative Uses

### Note Discovery

- Explore forgotten notes by wandering
- Find connections through zone proximity
- Use conversations to refresh your memory

### Knowledge Review

- Quiz yourself through villager conversations
- Ask for summaries of old notes
- Explore topics interactively

### Writing Inspiration

- Talk to character notes for story ideas
- Discuss concepts with your research notes
- Brainstorm with your idea notes
