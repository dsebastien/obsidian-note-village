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

> Requires Obsidian **1.13.0 or newer** (the plugin uses the declarative settings API introduced there).

### Community plugins (recommended)

1. In Obsidian, go to **Settings → Community plugins**.
2. Disable **Restricted mode** if it's enabled.
3. Select **Browse**, search for **Note Village**, install it, then enable it.

You can also browse the catalog on the [Obsidian Community](https://community.obsidian.md/) website.

### Manual installation

If the plugin isn't listed in the community catalog yet (or you want a specific version):

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/dsebastien/obsidian-note-village/releases).
2. Copy them into `<Vault>/.obsidian/plugins/note-village/`.
3. Reload Obsidian and enable **Note Village** in **Settings → Community plugins**.

### BRAT (bleeding edge)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tool) installs plugins straight from a GitHub repo and keeps them updated automatically. Use this if you want the latest commits — **things might break**.

1. Install **Obsidian42 - BRAT** from **Settings → Community plugins → Browse** and enable it.
2. Run **BRAT: Add a beta plugin for testing** from the command palette.
3. Paste `https://github.com/dsebastien/obsidian-note-village`.
4. Select the latest version and confirm.
5. Enable **Note Village** in **Settings → Community plugins**.

## Configuration

Open **Settings** > **Note Village** to configure:

| Setting             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| Village seed        | Seed for procedural generation (empty = vault name)     |
| Top tag count       | Number of tags to use as zones (3-20)                   |
| Max villagers       | Maximum number of villagers to display (10-500)         |
| Excluded folders    | Folders to exclude from analysis                        |
| Excluded tags       | Tags to exclude from zone generation                    |
| Render quality      | Graphics quality (Low, Medium, High)                    |
| Anthropic API key   | Required for AI conversations                           |
| AI model            | Claude model for conversations                          |
| Save conversations  | Save chat history to vault                              |
| Conversation folder | Folder for saved conversations                          |
| Debug mode          | Log verbose diagnostics to the console (off by default) |

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
- **What's new after updates.** After a plugin update, a one-time dialog shows the release notes you just received (including skipped versions) with ways to support development. Never shown on fresh installs or regular restarts.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Author

[Sebastien Dubois](https://dsebastien.net)

<!-- other-plugins:start -->

## My other Obsidian plugins

| Plugin                                                                                                        | What it does                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [Agentic Resource Discovery Server](https://github.com/dsebastien/obsidian-agentic-resource-discovery-server) | Local-first Agentic Resource Discovery publisher and registry that serves your AI skills and tools to agents over a local HTTP and MCP server |
| [Book Exporter](https://github.com/dsebastien/obsidian-book-exporter)                                         | Export books (one manifest note + linked chapter notes) to EPUB and PDF via Pandoc                                                            |
| [Bookshelf Base](https://github.com/dsebastien/obsidian-bookshelf)                                            | Display your notes as a visual bookshelf via a custom Bases view                                                                              |
| [Dataview Serializer](https://github.com/dsebastien/obsidian-dataview-serializer)                             | Serialize Dataview queries to Markdown, and keep the Markdown representation up to date                                                       |
| [Expander](https://github.com/dsebastien/obsidian-expander)                                                   | Replace variables across your vault using HTML comment markers. Supports static values and dynamic functions                                  |
| [Ghost Publish](https://github.com/dsebastien/obsidian-ghost-publish)                                         | Publish your vault notes to a Ghost blog with configurable presets for tags, newsletters, and frontmatter conventions                         |
| [Graph Explorer Base View](https://github.com/dsebastien/obsidian-graph-explorer-base-view)                   | A custom Bases view that renders notes as an interactive force-directed graph with explored/unexplored tracking                               |
| [Hidden Folders Access](https://github.com/dsebastien/obsidian-hidden-folders-access)                         | Index hidden root-level folders (e.g. .claude) so they appear in the file tree, metadata cache, and Bases                                     |
| [Journal Bases](https://github.com/dsebastien/obsidian-journal-base)                                          | Custom Base views for journaling and periodic reviews                                                                                         |
| [Kanban Action Planner](https://github.com/dsebastien/obsidian-kanban-action-planner)                         | Render your notes as configurable Kanban boards and calendars inside Bases, with statuses, ordering, relationships, and scheduling            |
| [Life Tracker](https://github.com/dsebastien/obsidian-life-tracker-base-view)                                 | Capture and visualize the data that matters in your life                                                                                      |
| [Obsidian Starter Kit](https://github.com/DeveloPassion/obsidian-starter-kit-plugin)                          | Adds strong typing support and powerful automation support for notes                                                                          |
| [Remarkable Synchronizer](https://github.com/dsebastien/obsidian-remarkable-sync)                             | Connect to the reMarkable cloud, list, download, and sync notebook pages as images                                                            |
| [Replicate](https://github.com/dsebastien/obsidian-replicate)                                                 | Use AI models with ease via the Replicate.com integration                                                                                     |
| [REST and MCP server](https://github.com/dsebastien/obsidian-cli-rest)                                        | Exposes CLI commands as RESTful API endpoints and an MCP server for AI tool integration                                                       |
| [Time Machine](https://github.com/dsebastien/obsidian-time-machine)                                           | Browse, compare, and restore previous versions of your notes using built-in file-recovery snapshots                                           |
| [Transcriber](https://github.com/dsebastien/obsidian-transcriber)                                             | Transcribe images to markdown using Ollama vision models                                                                                      |
| [Typefully](https://github.com/dsebastien/obsidian-typefully)                                                 | Publish social media posts with ease using the Typefully integration                                                                          |
| [Update Time](https://github.com/dsebastien/obsidian-update-time)                                             | Automatically update front matter to include creation and last update times                                                                   |

Everything I build is documented in [my newsletter](https://dsebastien.net/newsletter) and on [my YouTube channel](https://youtube.com/@dsebastien).

<!-- other-plugins:end -->

<!-- support-cta -->

## News & support

To stay up to date about this plugin, Obsidian in general, Personal Knowledge Management and note-taking:

- Subscribe to [my newsletter](https://dsebastien.net/newsletter)
- Subscribe to [my YouTube channel](https://youtube.com/@dsebastien)
- Join the [Knowii community](https://www.store.dsebastien.net/product/knowii-community/) and learn to organize your notes and put your knowledge to work, together with fellow knowledge workers

If this plugin is useful to you, here are the best ways to support my work ❤️:

- [Join the Knowii community](https://www.store.dsebastien.net/product/knowii-community/)
- [Become a GitHub Sponsor](https://github.com/sponsors/dsebastien)
- [Buy me a coffee](https://www.buymeacoffee.com/dsebastien)
- [Subscribe to my YouTube channel](https://youtube.com/@dsebastien)
- [Check out my products](https://store.dsebastien.net)

Found a bug or have an idea? [Open an issue](https://github.com/dsebastien/obsidian-note-village/issues).
