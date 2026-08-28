# Business Rules

This document defines the core business rules. These rules MUST be respected in all implementations unless explicitly approved otherwise.

---

## Documentation Guidelines

When a new business rule is mentioned:

1. Add it to this document immediately
2. Use a concise format (single line or brief paragraph)
3. Maintain precision - do not lose important details for brevity
4. Include rationale where it adds clarity

---

## Villager Interactions

**Conversation triggers**: Conversations with villagers should only start when pressing the "C" key (when near a villager) or when right-clicking on a villager. Left-click should not trigger conversations.

---

## Settings

**Declarative settings pane (Obsidian 1.13+)**: The settings tab is declared via `getSettingDefinitions()` — `display()` never runs. This sets `minAppVersion` to 1.13.0. A group's `items` cannot host a `type: 'list'` definition, so the two exclusion lists sit at the top level of the definitions array.

**Single serialized write path**: Every settings mutation goes through `NoteVillagePlugin.updateSettings(mutator)` — persist-then-commit (memory is swapped only after `saveData()` succeeds, so a rejected write rolls the control back to the on-disk truth) and serialized (each mutation derives from the previously COMMITTED state, so overlapping writes cannot drop each other). Side effects run strictly after a successful commit: the debug-logging flag tracks the committed `debugMode`, and village-shape writes (`villageSeed`, `topTagCount`, `maxVillagers`, exclusion-list edits) trigger `regenerateVillage()` post-commit.

**setControlValue rejects invalid writes**: Type-mismatched values, dropdown values outside the declared enum options, and unknown keys throw — resolving would tell the framework the write landed and leave the pane showing a value that was never stored.
