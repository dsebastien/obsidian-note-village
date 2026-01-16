import * as ex from 'excalibur'
import { NoteLinkComponent } from '../components/note-link.component'
import { WandererComponent } from '../components/wanderer.component'
import { InteractableComponent } from '../components/interactable.component'
import {
    SpriteManager,
    DirectionComponent,
    AnimatedSpriteComponent
} from '../graphics/sprite-manager'
import type { VillagerData } from '#types/villager-data.intf'
import type { Zone } from '#types/zone.intf'

/**
 * Villager actor representing a note in the village.
 * Features JRPG-style pixel art with 4-direction walking animations.
 * Size scales with note content length.
 */
export class Villager extends ex.Actor {
    private nameLabel: ex.Label
    private directionComponent: DirectionComponent
    private animatedSprite: AnimatedSpriteComponent | null = null

    constructor(
        public readonly villagerData: VillagerData,
        public readonly zone: Zone | undefined,
        private onInteract?: (villager: Villager) => void
    ) {
        // Calculate scale based on note length (larger notes = slightly larger villagers)
        const baseScale = Villager.calculateScale(villagerData.noteLength)

        super({
            pos: new ex.Vector(villagerData.homePosition.x, villagerData.homePosition.y),
            width: 16 * baseScale,
            height: 24 * baseScale,
            anchor: ex.Vector.Half,
            collisionType: ex.CollisionType.Passive
        })

        this.scale = new ex.Vector(baseScale, baseScale)

        // Z-index for proper layering (slightly below player)
        this.z = 5

        // Direction tracking
        this.directionComponent = new DirectionComponent()
        this.addComponent(this.directionComponent)

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

        // Create name label with improved styling
        this.nameLabel = new ex.Label({
            text: this.truncateName(villagerData.noteName, 15),
            pos: new ex.Vector(0, -18),
            font: new ex.Font({
                size: 8,
                color: ex.Color.White,
                shadow: {
                    blur: 2,
                    offset: new ex.Vector(1, 1),
                    color: ex.Color.Black
                }
            })
        })
    }

    override onInitialize(_engine: ex.Engine): void {
        this.setupSprite()
        this.addChild(this.nameLabel)

        // Set up right-click handler for conversation
        this.on('pointerdown', (evt) => {
            // Only trigger conversation on right-click (button 2)
            if (evt.button === ex.PointerButton.Right) {
                const interactable = this.get(InteractableComponent)
                if (interactable) {
                    interactable.trigger(this)
                }
            }
        })

        // Update animation on each frame
        this.on('preupdate', () => {
            this.updateAnimation()
        })
    }

    /**
     * Set up villager sprite with animations
     */
    private setupSprite(): void {
        const spriteManager = SpriteManager.getInstance()
        const paletteIndex = this.villagerData.appearance.spriteIndex
        const animations = spriteManager.getVillagerAnimations(paletteIndex)

        if (animations) {
            this.animatedSprite = new AnimatedSpriteComponent(animations)
            this.addComponent(this.animatedSprite)
            // Start with random direction for variety
            const directions = ['down', 'up', 'left', 'right'] as const
            const randomDir = directions[Math.floor(Math.random() * directions.length)]!
            this.directionComponent.direction = randomDir
            this.animatedSprite.setAnimation(`idle-${randomDir}`)
        } else {
            // Fallback to colored rectangle
            this.graphics.use(
                new ex.Rectangle({
                    width: 16,
                    height: 24,
                    color: ex.Color.fromHex('#FFD700')
                })
            )
        }
    }

    /**
     * Update animation based on current velocity
     */
    private updateAnimation(): void {
        this.directionComponent.updateFromVelocity(this.vel)

        if (this.animatedSprite) {
            this.animatedSprite.updateAnimation(
                this.directionComponent.direction,
                this.directionComponent.isMoving
            )
        }
    }

    /**
     * Calculate villager scale based on note content length
     */
    static calculateScale(contentLength: number): number {
        const minScale = 1
        const maxScale = 1.5
        const scaleFactor = 0.0003
        return Math.min(
            maxScale,
            Math.max(minScale, minScale + Math.sqrt(contentLength) * scaleFactor)
        )
    }

    /**
     * Calculate villager size based on note content length (for legacy compatibility)
     */
    static calculateSize(contentLength: number): number {
        const scale = Villager.calculateScale(contentLength)
        return 16 * scale
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
     */
    updateSize(newContentLength: number): void {
        const newScale = Villager.calculateScale(newContentLength)
        this.scale = new ex.Vector(newScale, newScale)
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

    /**
     * Get direction component for external access
     */
    getDirectionComponent(): DirectionComponent {
        return this.directionComponent
    }
}
