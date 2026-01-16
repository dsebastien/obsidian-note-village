import * as ex from 'excalibur'
import { NoteLinkComponent } from '../components/note-link.component'
import { WandererComponent } from '../components/wanderer.component'
import { InteractableComponent } from '../components/interactable.component'
import type { VillagerData } from '#types/villager-data.intf'
import type { Zone } from '#types/zone.intf'

/**
 * Villager actor representing a note in the village.
 * Size scales with note content length.
 */
export class Villager extends ex.Actor {
    private nameLabel: ex.Label

    constructor(
        public readonly villagerData: VillagerData,
        public readonly zone: Zone | undefined,
        private onInteract?: (villager: Villager) => void
    ) {
        const size = Villager.calculateSize(villagerData.noteLength)

        super({
            pos: new ex.Vector(villagerData.homePosition.x, villagerData.homePosition.y),
            width: size,
            height: size,
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.Passive,
            color: ex.Color.fromHex('#FFD700') // Gold color
        })

        // Add ECS components
        this.addComponent(new NoteLinkComponent(villagerData.notePath, villagerData.noteName))
        this.addComponent(
            new WandererComponent(
                new ex.Vector(villagerData.homePosition.x, villagerData.homePosition.y),
                50 // wander radius
            )
        )

        const interactable = new InteractableComponent(40)
        interactable.onInteract(() => {
            if (this.onInteract) {
                this.onInteract(this)
            }
        })
        this.addComponent(interactable)

        // Create name label
        this.nameLabel = new ex.Label({
            text: this.truncateName(villagerData.noteName, 15),
            pos: new ex.Vector(0, -size / 2 - 10),
            font: new ex.Font({
                size: 8,
                color: ex.Color.White
            })
        })
    }

    override onInitialize(_engine: ex.Engine): void {
        this.addChild(this.nameLabel)

        // Set up click handler
        this.on('pointerdown', () => {
            const interactable = this.get(InteractableComponent)
            if (interactable) {
                interactable.trigger(this)
            }
        })
    }

    /**
     * Calculate villager size based on note content length
     */
    static calculateSize(contentLength: number): number {
        const minSize = 16
        const maxSize = 48
        const scaleFactor = 0.5
        return Math.min(
            maxSize,
            Math.max(minSize, minSize + Math.sqrt(contentLength) * scaleFactor)
        )
    }

    /**
     * Truncate name with ellipsis
     */
    private truncateName(name: string, maxLen: number): string {
        if (name.length <= maxLen) return name
        return name.slice(0, maxLen - 1) + '…'
    }

    /**
     * Get the note path for this villager
     */
    getNotePath(): string {
        return this.villagerData.notePath
    }

    /**
     * Get the note name for this villager
     */
    getNoteName(): string {
        return this.villagerData.noteName
    }

    /**
     * Update note content (for AI conversations)
     */
    updateNoteContent(content: string): void {
        const noteLink = this.get(NoteLinkComponent)
        if (noteLink) {
            noteLink.updateContent(content)
        }
    }

    /**
     * Update villager size when note content changes
     * Note: This updates the visual representation via graphics
     */
    updateSize(newContentLength: number): void {
        const newSize = Villager.calculateSize(newContentLength)
        // Update graphics with new size
        this.graphics.use(
            new ex.Rectangle({
                width: newSize,
                height: newSize,
                color: ex.Color.fromHex('#FFD700')
            })
        )
        this.nameLabel.pos = new ex.Vector(0, -newSize / 2 - 10)
    }

    /**
     * Move villager to new home position (zone change)
     */
    moveToNewHome(newPosition: ex.Vector): void {
        const wanderer = this.get(WandererComponent)
        if (wanderer) {
            wanderer.setHomePosition(newPosition)
        }
        // Use actions for smooth movement
        this.actions.clearActions()
        this.actions.moveTo(newPosition, 50)
    }

    /**
     * Set interaction callback
     */
    setOnInteract(callback: (villager: Villager) => void): void {
        this.onInteract = callback
    }
}
