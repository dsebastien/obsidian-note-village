### Your Anthropic API key is now kept in Obsidian's secret storage

The API key is no longer stored in plain text in the plugin's settings file (`data.json`), so it no longer travels with your vault through Git, Syncthing or cloud sync. Only the name of the secret is saved in the settings.

- **No action needed.** Every device moves your existing key into its own secret storage automatically the next time it starts this version. AI conversations keep working on all your synced devices.
- For a transition period, the plain-text copy stays in the settings file so devices that have not updated yet can still pick up the key. It is removed automatically 60 days after the first migration. To remove it sooner, select **Remove plain-text copy now** in **Settings → Note Village** once all your devices run this version.
- To change the key, select or create a different secret under **Anthropic API key**. **Clear API key** removes the key from this device.
