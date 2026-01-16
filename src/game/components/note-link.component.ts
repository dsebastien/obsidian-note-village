import * as ex from 'excalibur'

/**
 * Links an actor to an Obsidian note file.
 * Stores the note path and content for AI conversations.
 */
export class NoteLinkComponent extends ex.Component {
    readonly type = 'noteLink'

    constructor(
        public readonly notePath: string,
        public readonly noteName: string,
        public noteContent: string = ''
    ) {
        super()
    }

    /**
     * Update note content (called when note is modified)
     */
    updateContent(content: string): void {
        this.noteContent = content
    }
}
