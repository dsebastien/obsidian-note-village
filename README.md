# Note Village

A 2D pixel art village where your notes become villagers you can explore and chat with using AI.

Note Village transforms your Obsidian vault into an interactive JRPG-style world. Your notes become villagers that live in themed zones based on your tags, and you can have AI-powered conversations with them using Claude.

## Features

- **Procedural village generation** - Your vault's tags become zones, and notes become villagers placed in their respective zones
- **JRPG-style pixel art** - Retro 16-bit style graphics with animated characters, buildings, and decorations
- **AI conversations** - Chat with your notes using Claude (requires Anthropic API key)
- **Deterministic world** - Same seed generates the same village layout every time
- **Customizable** - Configure zones, villager limits, graphics quality, and more

## How it works

1. **Tags become zones** - The plugin analyzes your vault and uses your most frequent tags as themed zones in the village
2. **Notes become villagers** - Notes tagged with those tags appear as villagers in their respective zones
3. **Explore your knowledge** - Walk around the village with WASD/arrow keys or click to move
4. **Talk to your notes** - Press C near a villager or right-click to start an AI conversation

## Installation

### From Obsidian Community Plugins

1. Open **Settings** in Obsidian
2. Go to **Community plugins** and disable **Restricted mode**
3. Click **Browse** and search for "Note Village"
4. Click **Install**, then **Enable**

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder `<vault>/.obsidian/plugins/note-village/`
3. Copy the downloaded files into that folder
4. Reload Obsidian and enable the plugin in **Settings** > **Community plugins**

## Configuration

Open **Settings** > **Note Village** to configure:

| Setting             | Description                                         |
| ------------------- | --------------------------------------------------- |
| Village seed        | Seed for procedural generation (empty = vault name) |
| Top tag count       | Number of tags to use as zones (3-20)               |
| Max villagers       | Maximum number of villagers to display (10-500)     |
| Excluded folders    | Folders to exclude from analysis                    |
| Excluded tags       | Tags to exclude from zone generation                |
| Render quality      | Graphics quality (Low, Medium, High)                |
| Anthropic API key   | Required for AI conversations                       |
| AI model            | Claude model for conversations                      |
| Save conversations  | Save chat history to vault                          |
| Conversation folder | Folder for saved conversations                      |

## Usage

### Opening the village

- Click the village icon in the ribbon (left sidebar)
- Or use the command palette: "Note Village: Open village"

### Controls

| Action             | Control                                        |
| ------------------ | ---------------------------------------------- |
| Move               | WASD or arrow keys                             |
| Move to location   | Left-click on ground                           |
| Start conversation | Press C near villager, or right-click villager |

### AI conversations

To chat with your notes:

1. Add your Anthropic API key in settings
2. Approach a villager and press C (or right-click)
3. The villager will respond based on the note's content

Conversations can be saved as markdown files in your vault.

## Development

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Git](https://git-scm.com/)

### Setup

```bash
git clone https://github.com/dsebastien/obsidian-note-village.git
cd obsidian-note-village
bun install
```

### Commands

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `bun run dev`       | Development build with watch mode |
| `bun run build`     | Production build                  |
| `bun run tsc:watch` | Type check in watch mode          |
| `bun run lint`      | Run ESLint                        |
| `bun run format`    | Format with Prettier              |
| `bun test`          | Run tests                         |

### Tech stack

- **TypeScript** with strict configuration
- **Excalibur.js** for game engine
- **Anthropic SDK** for AI conversations
- **Zod** for runtime validation
- **Tailwind CSS v4** for styling
- **Bun** for package management and bundling

## Support

- [Report issues](https://github.com/dsebastien/obsidian-note-village/issues)
- [Buy me a coffee](https://www.buymeacoffee.com/dsebastien)

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Author

[Sebastien Dubois](https://dsebastien.net)
