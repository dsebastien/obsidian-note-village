/**
 * Pixel Art Generator - Creates JRPG-style 16-bit sprites programmatically.
 * Inspired by games like Final Fantasy 6 and Chrono Trigger.
 */

/** Color palette for pixel art */
export interface ColorPalette {
    skin: string
    skinShadow: string
    hair: string
    hairHighlight: string
    outfit: string
    outfitShadow: string
    outfitHighlight: string
    eyes: string
    outline: string
}

/** Direction for sprites */
export type Direction = 'down' | 'up' | 'left' | 'right'

/** Character appearance variations */
export interface CharacterAppearance {
    paletteIndex: number
    hairStyle: number
    outfitStyle: number
}

// JRPG color palettes for villagers
const VILLAGER_PALETTES: ColorPalette[] = [
    // Blue outfit villager
    {
        skin: '#FFD5B5',
        skinShadow: '#E5A87A',
        hair: '#4A3728',
        hairHighlight: '#6B5344',
        outfit: '#4A7AB0',
        outfitShadow: '#2E4A6E',
        outfitHighlight: '#6B9CD4',
        eyes: '#2D2D2D',
        outline: '#1A1A1A'
    },
    // Green outfit villager
    {
        skin: '#FFD5B5',
        skinShadow: '#E5A87A',
        hair: '#8B4513',
        hairHighlight: '#A0522D',
        outfit: '#4A8B4A',
        outfitShadow: '#2E5E2E',
        outfitHighlight: '#6BAD6B',
        eyes: '#2D2D2D',
        outline: '#1A1A1A'
    },
    // Red outfit villager
    {
        skin: '#FFECD5',
        skinShadow: '#E5C5A5',
        hair: '#2D2D2D',
        hairHighlight: '#4A4A4A',
        outfit: '#B04A4A',
        outfitShadow: '#8B2E2E',
        outfitHighlight: '#D46B6B',
        eyes: '#2D2D2D',
        outline: '#1A1A1A'
    },
    // Purple outfit villager
    {
        skin: '#FFD5B5',
        skinShadow: '#E5A87A',
        hair: '#FFD700',
        hairHighlight: '#FFE44D',
        outfit: '#7B4AB0',
        outfitShadow: '#4A2E6E',
        outfitHighlight: '#9D6BD4',
        eyes: '#2D2D2D',
        outline: '#1A1A1A'
    },
    // Brown outfit villager
    {
        skin: '#8B6F5A',
        skinShadow: '#6B4F3A',
        hair: '#1A1A1A',
        hairHighlight: '#2D2D2D',
        outfit: '#8B7355',
        outfitShadow: '#6B5335',
        outfitHighlight: '#AB9375',
        eyes: '#2D2D2D',
        outline: '#1A1A1A'
    },
    // White outfit villager (merchant/scholar)
    {
        skin: '#FFD5B5',
        skinShadow: '#E5A87A',
        hair: '#A0A0A0',
        hairHighlight: '#C0C0C0',
        outfit: '#E0E0E0',
        outfitShadow: '#B0B0B0',
        outfitHighlight: '#FFFFFF',
        eyes: '#2D2D2D',
        outline: '#1A1A1A'
    },
    // Orange outfit villager
    {
        skin: '#FFECD5',
        skinShadow: '#E5C5A5',
        hair: '#6B3A1A',
        hairHighlight: '#8B4A2A',
        outfit: '#E08040',
        outfitShadow: '#B06030',
        outfitHighlight: '#FFa060',
        eyes: '#2D2D2D',
        outline: '#1A1A1A'
    },
    // Teal outfit villager
    {
        skin: '#FFD5B5',
        skinShadow: '#E5A87A',
        hair: '#4A2D1A',
        hairHighlight: '#6B4D3A',
        outfit: '#40A0A0',
        outfitShadow: '#207070',
        outfitHighlight: '#60C0C0',
        eyes: '#2D2D2D',
        outline: '#1A1A1A'
    }
]

// Hero palette (player character)
const HERO_PALETTE: ColorPalette = {
    skin: '#FFD5B5',
    skinShadow: '#E5A87A',
    hair: '#2B5B9E',
    hairHighlight: '#4B7BBE',
    outfit: '#2E4A8B',
    outfitShadow: '#1A2E5B',
    outfitHighlight: '#4A6EAB',
    eyes: '#2D2D2D',
    outline: '#1A1A1A'
}

/**
 * Generate a single pixel art character frame.
 * Returns a 16x24 pixel canvas.
 */
export function generateCharacterFrame(
    palette: ColorPalette,
    direction: Direction,
    frame: number,
    isWalking: boolean
): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 24
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Clear with transparency
    ctx.clearRect(0, 0, 16, 24)

    // Draw based on direction
    switch (direction) {
        case 'down':
            drawCharacterDown(ctx, palette, frame, isWalking)
            break
        case 'up':
            drawCharacterUp(ctx, palette, frame, isWalking)
            break
        case 'left':
            drawCharacterSide(ctx, palette, frame, isWalking, false)
            break
        case 'right':
            drawCharacterSide(ctx, palette, frame, isWalking, true)
            break
    }

    return canvas
}

/**
 * Draw character facing down
 */
function drawCharacterDown(
    ctx: CanvasRenderingContext2D,
    palette: ColorPalette,
    frame: number,
    isWalking: boolean
): void {
    const legOffset = isWalking ? (frame % 2 === 0 ? 1 : -1) : 0

    // Hair (back)
    setPixel(ctx, 5, 0, palette.hair)
    setPixel(ctx, 6, 0, palette.hair)
    setPixel(ctx, 7, 0, palette.hair)
    setPixel(ctx, 8, 0, palette.hair)
    setPixel(ctx, 9, 0, palette.hair)
    setPixel(ctx, 10, 0, palette.hair)

    // Hair row 2
    setPixel(ctx, 4, 1, palette.hair)
    setPixel(ctx, 5, 1, palette.hairHighlight)
    setPixel(ctx, 6, 1, palette.hairHighlight)
    setPixel(ctx, 7, 1, palette.hair)
    setPixel(ctx, 8, 1, palette.hair)
    setPixel(ctx, 9, 1, palette.hairHighlight)
    setPixel(ctx, 10, 1, palette.hair)
    setPixel(ctx, 11, 1, palette.hair)

    // Hair row 3
    setPixel(ctx, 3, 2, palette.hair)
    setPixel(ctx, 4, 2, palette.hair)
    setPixel(ctx, 5, 2, palette.hairHighlight)
    setPixel(ctx, 6, 2, palette.hair)
    setPixel(ctx, 7, 2, palette.hair)
    setPixel(ctx, 8, 2, palette.hair)
    setPixel(ctx, 9, 2, palette.hair)
    setPixel(ctx, 10, 2, palette.hairHighlight)
    setPixel(ctx, 11, 2, palette.hair)
    setPixel(ctx, 12, 2, palette.hair)

    // Face row 1 (forehead with hair bangs)
    setPixel(ctx, 3, 3, palette.hair)
    setPixel(ctx, 4, 3, palette.skin)
    setPixel(ctx, 5, 3, palette.skin)
    setPixel(ctx, 6, 3, palette.skin)
    setPixel(ctx, 7, 3, palette.skin)
    setPixel(ctx, 8, 3, palette.skin)
    setPixel(ctx, 9, 3, palette.skin)
    setPixel(ctx, 10, 3, palette.skin)
    setPixel(ctx, 11, 3, palette.skin)
    setPixel(ctx, 12, 3, palette.hair)

    // Face row 2 (eyes)
    setPixel(ctx, 3, 4, palette.hair)
    setPixel(ctx, 4, 4, palette.skin)
    setPixel(ctx, 5, 4, palette.eyes)
    setPixel(ctx, 6, 4, palette.skin)
    setPixel(ctx, 7, 4, palette.skin)
    setPixel(ctx, 8, 4, palette.skin)
    setPixel(ctx, 9, 4, palette.skin)
    setPixel(ctx, 10, 4, palette.eyes)
    setPixel(ctx, 11, 4, palette.skin)
    setPixel(ctx, 12, 4, palette.hair)

    // Face row 3 (cheeks)
    setPixel(ctx, 4, 5, palette.skin)
    setPixel(ctx, 5, 5, palette.skin)
    setPixel(ctx, 6, 5, palette.skin)
    setPixel(ctx, 7, 5, palette.skin)
    setPixel(ctx, 8, 5, palette.skin)
    setPixel(ctx, 9, 5, palette.skin)
    setPixel(ctx, 10, 5, palette.skin)
    setPixel(ctx, 11, 5, palette.skin)

    // Face row 4 (mouth/chin)
    setPixel(ctx, 5, 6, palette.skinShadow)
    setPixel(ctx, 6, 6, palette.skin)
    setPixel(ctx, 7, 6, palette.skinShadow)
    setPixel(ctx, 8, 6, palette.skinShadow)
    setPixel(ctx, 9, 6, palette.skin)
    setPixel(ctx, 10, 6, palette.skinShadow)

    // Neck
    setPixel(ctx, 6, 7, palette.skinShadow)
    setPixel(ctx, 7, 7, palette.skin)
    setPixel(ctx, 8, 7, palette.skin)
    setPixel(ctx, 9, 7, palette.skinShadow)

    // Body row 1 (shoulders)
    setPixel(ctx, 3, 8, palette.outfitShadow)
    setPixel(ctx, 4, 8, palette.outfit)
    setPixel(ctx, 5, 8, palette.outfit)
    setPixel(ctx, 6, 8, palette.outfit)
    setPixel(ctx, 7, 8, palette.outfitHighlight)
    setPixel(ctx, 8, 8, palette.outfitHighlight)
    setPixel(ctx, 9, 8, palette.outfit)
    setPixel(ctx, 10, 8, palette.outfit)
    setPixel(ctx, 11, 8, palette.outfit)
    setPixel(ctx, 12, 8, palette.outfitShadow)

    // Body rows
    for (let y = 9; y <= 14; y++) {
        setPixel(ctx, 3, y, palette.outfitShadow)
        setPixel(ctx, 4, y, palette.outfit)
        setPixel(ctx, 5, y, palette.outfit)
        setPixel(ctx, 6, y, palette.outfitHighlight)
        setPixel(ctx, 7, y, palette.outfitHighlight)
        setPixel(ctx, 8, y, palette.outfitHighlight)
        setPixel(ctx, 9, y, palette.outfitHighlight)
        setPixel(ctx, 10, y, palette.outfit)
        setPixel(ctx, 11, y, palette.outfit)
        setPixel(ctx, 12, y, palette.outfitShadow)
    }

    // Arms
    setPixel(ctx, 2, 9, palette.outfit)
    setPixel(ctx, 2, 10, palette.outfit)
    setPixel(ctx, 2, 11, palette.skinShadow)
    setPixel(ctx, 13, 9, palette.outfit)
    setPixel(ctx, 13, 10, palette.outfit)
    setPixel(ctx, 13, 11, palette.skinShadow)

    // Legs - with walking animation
    // Left leg
    setPixel(ctx, 4 + legOffset, 15, palette.outfitShadow)
    setPixel(ctx, 5 + legOffset, 15, palette.outfit)
    setPixel(ctx, 6 + legOffset, 15, palette.outfit)
    setPixel(ctx, 4 + legOffset, 16, palette.outfitShadow)
    setPixel(ctx, 5 + legOffset, 16, palette.outfit)
    setPixel(ctx, 6 + legOffset, 16, palette.outfit)
    setPixel(ctx, 4 + legOffset, 17, palette.outfitShadow)
    setPixel(ctx, 5 + legOffset, 17, palette.outfit)
    setPixel(ctx, 6 + legOffset, 17, palette.outfit)

    // Right leg
    setPixel(ctx, 9 - legOffset, 15, palette.outfit)
    setPixel(ctx, 10 - legOffset, 15, palette.outfit)
    setPixel(ctx, 11 - legOffset, 15, palette.outfitShadow)
    setPixel(ctx, 9 - legOffset, 16, palette.outfit)
    setPixel(ctx, 10 - legOffset, 16, palette.outfit)
    setPixel(ctx, 11 - legOffset, 16, palette.outfitShadow)
    setPixel(ctx, 9 - legOffset, 17, palette.outfit)
    setPixel(ctx, 10 - legOffset, 17, palette.outfit)
    setPixel(ctx, 11 - legOffset, 17, palette.outfitShadow)

    // Feet
    setPixel(ctx, 4 + legOffset, 18, '#3D2817')
    setPixel(ctx, 5 + legOffset, 18, '#5D4837')
    setPixel(ctx, 6 + legOffset, 18, '#3D2817')
    setPixel(ctx, 9 - legOffset, 18, '#3D2817')
    setPixel(ctx, 10 - legOffset, 18, '#5D4837')
    setPixel(ctx, 11 - legOffset, 18, '#3D2817')
}

/**
 * Draw character facing up
 */
function drawCharacterUp(
    ctx: CanvasRenderingContext2D,
    palette: ColorPalette,
    frame: number,
    isWalking: boolean
): void {
    const legOffset = isWalking ? (frame % 2 === 0 ? 1 : -1) : 0

    // Hair (back of head - fuller)
    for (let x = 4; x <= 11; x++) {
        setPixel(ctx, x, 0, palette.hair)
    }
    for (let x = 3; x <= 12; x++) {
        setPixel(ctx, x, 1, x === 5 || x === 10 ? palette.hairHighlight : palette.hair)
    }
    for (let x = 3; x <= 12; x++) {
        setPixel(ctx, x, 2, palette.hair)
    }
    for (let x = 3; x <= 12; x++) {
        setPixel(ctx, x, 3, palette.hair)
    }
    for (let x = 4; x <= 11; x++) {
        setPixel(ctx, x, 4, palette.hair)
    }
    for (let x = 4; x <= 11; x++) {
        setPixel(ctx, x, 5, palette.hair)
    }

    // Neck
    setPixel(ctx, 6, 6, palette.skinShadow)
    setPixel(ctx, 7, 6, palette.skin)
    setPixel(ctx, 8, 6, palette.skin)
    setPixel(ctx, 9, 6, palette.skinShadow)

    setPixel(ctx, 6, 7, palette.skinShadow)
    setPixel(ctx, 7, 7, palette.skin)
    setPixel(ctx, 8, 7, palette.skin)
    setPixel(ctx, 9, 7, palette.skinShadow)

    // Body (back)
    for (let y = 8; y <= 14; y++) {
        setPixel(ctx, 3, y, palette.outfitShadow)
        setPixel(ctx, 4, y, palette.outfit)
        setPixel(ctx, 5, y, palette.outfit)
        setPixel(ctx, 6, y, palette.outfit)
        setPixel(ctx, 7, y, palette.outfit)
        setPixel(ctx, 8, y, palette.outfit)
        setPixel(ctx, 9, y, palette.outfit)
        setPixel(ctx, 10, y, palette.outfit)
        setPixel(ctx, 11, y, palette.outfit)
        setPixel(ctx, 12, y, palette.outfitShadow)
    }

    // Arms
    setPixel(ctx, 2, 9, palette.outfitShadow)
    setPixel(ctx, 2, 10, palette.outfitShadow)
    setPixel(ctx, 2, 11, palette.skinShadow)
    setPixel(ctx, 13, 9, palette.outfitShadow)
    setPixel(ctx, 13, 10, palette.outfitShadow)
    setPixel(ctx, 13, 11, palette.skinShadow)

    // Legs
    setPixel(ctx, 4 + legOffset, 15, palette.outfitShadow)
    setPixel(ctx, 5 + legOffset, 15, palette.outfitShadow)
    setPixel(ctx, 6 + legOffset, 15, palette.outfit)
    setPixel(ctx, 4 + legOffset, 16, palette.outfitShadow)
    setPixel(ctx, 5 + legOffset, 16, palette.outfitShadow)
    setPixel(ctx, 6 + legOffset, 16, palette.outfit)
    setPixel(ctx, 4 + legOffset, 17, palette.outfitShadow)
    setPixel(ctx, 5 + legOffset, 17, palette.outfitShadow)
    setPixel(ctx, 6 + legOffset, 17, palette.outfit)

    setPixel(ctx, 9 - legOffset, 15, palette.outfit)
    setPixel(ctx, 10 - legOffset, 15, palette.outfitShadow)
    setPixel(ctx, 11 - legOffset, 15, palette.outfitShadow)
    setPixel(ctx, 9 - legOffset, 16, palette.outfit)
    setPixel(ctx, 10 - legOffset, 16, palette.outfitShadow)
    setPixel(ctx, 11 - legOffset, 16, palette.outfitShadow)
    setPixel(ctx, 9 - legOffset, 17, palette.outfit)
    setPixel(ctx, 10 - legOffset, 17, palette.outfitShadow)
    setPixel(ctx, 11 - legOffset, 17, palette.outfitShadow)

    // Feet
    setPixel(ctx, 4 + legOffset, 18, '#3D2817')
    setPixel(ctx, 5 + legOffset, 18, '#4D3827')
    setPixel(ctx, 6 + legOffset, 18, '#3D2817')
    setPixel(ctx, 9 - legOffset, 18, '#3D2817')
    setPixel(ctx, 10 - legOffset, 18, '#4D3827')
    setPixel(ctx, 11 - legOffset, 18, '#3D2817')
}

/**
 * Draw character facing side (left or right)
 */
function drawCharacterSide(
    ctx: CanvasRenderingContext2D,
    palette: ColorPalette,
    frame: number,
    isWalking: boolean,
    flipX: boolean
): void {
    const legOffset = isWalking ? (frame % 2 === 0 ? 1 : 0) : 0

    // For right-facing, we flip the entire drawing
    if (flipX) {
        ctx.save()
        ctx.translate(16, 0)
        ctx.scale(-1, 1)
    }

    // Hair
    setPixel(ctx, 6, 0, palette.hair)
    setPixel(ctx, 7, 0, palette.hair)
    setPixel(ctx, 8, 0, palette.hair)
    setPixel(ctx, 9, 0, palette.hair)

    setPixel(ctx, 5, 1, palette.hair)
    setPixel(ctx, 6, 1, palette.hairHighlight)
    setPixel(ctx, 7, 1, palette.hair)
    setPixel(ctx, 8, 1, palette.hair)
    setPixel(ctx, 9, 1, palette.hair)
    setPixel(ctx, 10, 1, palette.hair)

    setPixel(ctx, 4, 2, palette.hair)
    setPixel(ctx, 5, 2, palette.hair)
    setPixel(ctx, 6, 2, palette.hairHighlight)
    setPixel(ctx, 7, 2, palette.hair)
    setPixel(ctx, 8, 2, palette.hair)
    setPixel(ctx, 9, 2, palette.hair)
    setPixel(ctx, 10, 2, palette.hair)
    setPixel(ctx, 11, 2, palette.hair)

    // Face (side profile)
    setPixel(ctx, 4, 3, palette.hair)
    setPixel(ctx, 5, 3, palette.skin)
    setPixel(ctx, 6, 3, palette.skin)
    setPixel(ctx, 7, 3, palette.skin)
    setPixel(ctx, 8, 3, palette.skin)
    setPixel(ctx, 9, 3, palette.skin)
    setPixel(ctx, 10, 3, palette.hair)

    setPixel(ctx, 4, 4, palette.hair)
    setPixel(ctx, 5, 4, palette.skin)
    setPixel(ctx, 6, 4, palette.skin)
    setPixel(ctx, 7, 4, palette.eyes)
    setPixel(ctx, 8, 4, palette.skin)
    setPixel(ctx, 9, 4, palette.skin)
    setPixel(ctx, 10, 4, palette.hair)

    setPixel(ctx, 5, 5, palette.skin)
    setPixel(ctx, 6, 5, palette.skin)
    setPixel(ctx, 7, 5, palette.skin)
    setPixel(ctx, 8, 5, palette.skin)
    setPixel(ctx, 9, 5, palette.skin)

    setPixel(ctx, 6, 6, palette.skinShadow)
    setPixel(ctx, 7, 6, palette.skin)
    setPixel(ctx, 8, 6, palette.skinShadow)

    // Neck
    setPixel(ctx, 7, 7, palette.skin)
    setPixel(ctx, 8, 7, palette.skinShadow)

    // Body (side view)
    for (let y = 8; y <= 14; y++) {
        setPixel(ctx, 4, y, palette.outfitShadow)
        setPixel(ctx, 5, y, palette.outfit)
        setPixel(ctx, 6, y, palette.outfit)
        setPixel(ctx, 7, y, palette.outfitHighlight)
        setPixel(ctx, 8, y, palette.outfit)
        setPixel(ctx, 9, y, palette.outfit)
        setPixel(ctx, 10, y, palette.outfitShadow)
    }

    // Arm (side view)
    setPixel(ctx, 3, 9, palette.outfit)
    setPixel(ctx, 3, 10, palette.outfit)
    setPixel(ctx, 3, 11, palette.skinShadow)

    // Legs with walking animation
    if (isWalking) {
        // Front leg (extended)
        setPixel(ctx, 5 - legOffset, 15, palette.outfit)
        setPixel(ctx, 6 - legOffset, 15, palette.outfit)
        setPixel(ctx, 7 - legOffset, 15, palette.outfitShadow)
        setPixel(ctx, 5 - legOffset, 16, palette.outfit)
        setPixel(ctx, 6 - legOffset, 16, palette.outfit)
        setPixel(ctx, 7 - legOffset, 16, palette.outfitShadow)
        setPixel(ctx, 5 - legOffset, 17, palette.outfit)
        setPixel(ctx, 6 - legOffset, 17, palette.outfit)
        setPixel(ctx, 7 - legOffset, 17, palette.outfitShadow)

        // Back leg
        setPixel(ctx, 7 + legOffset, 15, palette.outfitShadow)
        setPixel(ctx, 8 + legOffset, 15, palette.outfitShadow)
        setPixel(ctx, 7 + legOffset, 16, palette.outfitShadow)
        setPixel(ctx, 8 + legOffset, 16, palette.outfitShadow)
        setPixel(ctx, 7 + legOffset, 17, palette.outfitShadow)
        setPixel(ctx, 8 + legOffset, 17, palette.outfitShadow)

        // Feet
        setPixel(ctx, 5 - legOffset, 18, '#3D2817')
        setPixel(ctx, 6 - legOffset, 18, '#5D4837')
        setPixel(ctx, 7 - legOffset, 18, '#3D2817')
        setPixel(ctx, 7 + legOffset, 18, '#3D2817')
        setPixel(ctx, 8 + legOffset, 18, '#3D2817')
    } else {
        // Standing legs
        setPixel(ctx, 5, 15, palette.outfit)
        setPixel(ctx, 6, 15, palette.outfit)
        setPixel(ctx, 7, 15, palette.outfitShadow)
        setPixel(ctx, 8, 15, palette.outfitShadow)
        setPixel(ctx, 5, 16, palette.outfit)
        setPixel(ctx, 6, 16, palette.outfit)
        setPixel(ctx, 7, 16, palette.outfitShadow)
        setPixel(ctx, 8, 16, palette.outfitShadow)
        setPixel(ctx, 5, 17, palette.outfit)
        setPixel(ctx, 6, 17, palette.outfit)
        setPixel(ctx, 7, 17, palette.outfitShadow)
        setPixel(ctx, 8, 17, palette.outfitShadow)

        // Feet
        setPixel(ctx, 5, 18, '#3D2817')
        setPixel(ctx, 6, 18, '#5D4837')
        setPixel(ctx, 7, 18, '#3D2817')
        setPixel(ctx, 8, 18, '#3D2817')
    }

    if (flipX) {
        ctx.restore()
    }
}

/**
 * Set a pixel on the canvas
 */
function setPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    ctx.fillStyle = color
    ctx.fillRect(x, y, 1, 1)
}

/**
 * Generate a complete sprite sheet for a character
 * Returns a canvas with 8 columns (4 dirs x 2 frames) and 2 rows (idle, walk)
 */
export function generateCharacterSpriteSheet(palette: ColorPalette): HTMLCanvasElement {
    const spriteWidth = 16
    const spriteHeight = 24
    const canvas = document.createElement('canvas')
    canvas.width = spriteWidth * 8 // 4 directions x 2 frames
    canvas.height = spriteHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const directions: Direction[] = ['down', 'left', 'right', 'up']

    for (let dir = 0; dir < directions.length; dir++) {
        const direction = directions[dir]!
        for (let frame = 0; frame < 2; frame++) {
            const frameCanvas = generateCharacterFrame(palette, direction, frame, frame === 1)
            ctx.drawImage(frameCanvas, (dir * 2 + frame) * spriteWidth, 0)
        }
    }

    return canvas
}

/**
 * Get villager palette by index
 */
export function getVillagerPalette(index: number): ColorPalette {
    return VILLAGER_PALETTES[index % VILLAGER_PALETTES.length] ?? VILLAGER_PALETTES[0]!
}

/**
 * Get hero palette
 */
export function getHeroPalette(): ColorPalette {
    return HERO_PALETTE
}

/**
 * Generate structure sprite (house, tree, fountain, etc.)
 */
export function generateStructureSprite(type: string, variant: number = 0): HTMLCanvasElement {
    switch (type) {
        case 'house':
            return generateHouseSprite(variant)
        case 'tree':
            return generateTreeSprite(variant)
        case 'fountain':
            return generateFountainSprite()
        case 'bench':
            return generateBenchSprite()
        case 'sign':
            return generateSignSprite()
        case 'fence':
            return generateFenceSprite()
        // Decorations (Phase 1)
        case 'flowerBed':
            return generateFlowerBedSprite(variant)
        case 'bush':
            return generateBushSprite(variant)
        case 'rock':
            return generateRockSprite(variant)
        case 'tallGrass':
            return generateTallGrassSprite(variant)
        case 'barrel':
            return generateBarrelSprite(variant)
        case 'crate':
            return generateCrateSprite(variant)
        default:
            return generateDefaultSprite()
    }
}

function generateHouseSprite(variant: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 48
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const roofColors = ['#8B4513', '#A0522D', '#6B3A1A', '#B5651D']
    const wallColors = ['#DEB887', '#D2B48C', '#C4A77D', '#E5C29F']
    const roofColor = roofColors[variant % roofColors.length]!
    const wallColor = wallColors[variant % wallColors.length]!
    const roofShadow = darkenColor(roofColor, 0.3)
    const wallShadow = darkenColor(wallColor, 0.2)

    // Roof
    ctx.fillStyle = roofColor
    ctx.beginPath()
    ctx.moveTo(24, 2)
    ctx.lineTo(46, 18)
    ctx.lineTo(2, 18)
    ctx.closePath()
    ctx.fill()

    // Roof shadow
    ctx.fillStyle = roofShadow
    ctx.beginPath()
    ctx.moveTo(24, 2)
    ctx.lineTo(46, 18)
    ctx.lineTo(24, 18)
    ctx.closePath()
    ctx.fill()

    // Roof outline
    ctx.strokeStyle = '#1A1A1A'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(24, 2)
    ctx.lineTo(46, 18)
    ctx.lineTo(2, 18)
    ctx.closePath()
    ctx.stroke()

    // Walls
    ctx.fillStyle = wallColor
    ctx.fillRect(6, 18, 36, 28)

    // Wall shadow
    ctx.fillStyle = wallShadow
    ctx.fillRect(24, 18, 18, 28)

    // Wall outline
    ctx.strokeStyle = '#1A1A1A'
    ctx.strokeRect(6, 18, 36, 28)

    // Door
    ctx.fillStyle = '#5D4037'
    ctx.fillRect(19, 30, 10, 16)
    ctx.strokeStyle = '#3E2723'
    ctx.strokeRect(19, 30, 10, 16)

    // Door handle
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(26, 38, 2, 2)

    // Window left
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(9, 24, 8, 8)
    ctx.strokeStyle = '#5D4037'
    ctx.strokeRect(9, 24, 8, 8)
    // Window frame
    ctx.beginPath()
    ctx.moveTo(13, 24)
    ctx.lineTo(13, 32)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(9, 28)
    ctx.lineTo(17, 28)
    ctx.stroke()

    // Window right
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(31, 24, 8, 8)
    ctx.strokeStyle = '#5D4037'
    ctx.strokeRect(31, 24, 8, 8)
    // Window frame
    ctx.beginPath()
    ctx.moveTo(35, 24)
    ctx.lineTo(35, 32)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(31, 28)
    ctx.lineTo(39, 28)
    ctx.stroke()

    return canvas
}

function generateTreeSprite(variant: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 40
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const leafColors = ['#228B22', '#2E8B57', '#32CD32', '#3CB371']
    const leafColor = leafColors[variant % leafColors.length]!
    const leafShadow = darkenColor(leafColor, 0.25)
    const leafHighlight = lightenColor(leafColor, 0.2)

    // Trunk
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(13, 28, 6, 12)
    ctx.fillStyle = '#6B3A1A'
    ctx.fillRect(16, 28, 3, 12)

    // Foliage layers (bottom to top)
    // Bottom layer
    ctx.fillStyle = leafShadow
    drawEllipse(ctx, 16, 26, 14, 8)

    ctx.fillStyle = leafColor
    drawEllipse(ctx, 16, 22, 13, 10)

    // Middle layer
    ctx.fillStyle = leafShadow
    drawEllipse(ctx, 16, 17, 11, 8)

    ctx.fillStyle = leafColor
    drawEllipse(ctx, 16, 14, 10, 9)

    // Top layer
    ctx.fillStyle = leafHighlight
    drawEllipse(ctx, 16, 9, 7, 7)

    ctx.fillStyle = leafColor
    drawEllipse(ctx, 16, 7, 5, 5)

    return canvas
}

function generateFountainSprite(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 48
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Base
    ctx.fillStyle = '#808080'
    drawEllipse(ctx, 24, 40, 22, 8)
    ctx.fillStyle = '#606060'
    drawEllipse(ctx, 24, 40, 20, 6)

    // Water in base
    ctx.fillStyle = '#4A9CD4'
    drawEllipse(ctx, 24, 38, 18, 5)

    // Middle tier
    ctx.fillStyle = '#909090'
    ctx.fillRect(20, 26, 8, 12)
    ctx.fillStyle = '#707070'
    ctx.fillRect(24, 26, 4, 12)

    // Second tier bowl
    ctx.fillStyle = '#808080'
    drawEllipse(ctx, 24, 26, 12, 5)
    ctx.fillStyle = '#4A9CD4'
    drawEllipse(ctx, 24, 25, 10, 4)

    // Top pillar
    ctx.fillStyle = '#909090'
    ctx.fillRect(22, 12, 4, 13)

    // Water spout on top
    ctx.fillStyle = '#6BB5E8'
    ctx.fillRect(23, 6, 2, 8)

    // Water drops/spray
    ctx.fillStyle = '#87CEEB'
    setPixel(ctx, 20, 10, '#87CEEB')
    setPixel(ctx, 27, 11, '#87CEEB')
    setPixel(ctx, 18, 15, '#6BB5E8')
    setPixel(ctx, 29, 14, '#6BB5E8')

    return canvas
}

function generateBenchSprite(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 20
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const woodColor = '#8B7355'
    const woodShadow = '#6B5335'

    // Legs
    ctx.fillStyle = woodShadow
    ctx.fillRect(4, 12, 3, 8)
    ctx.fillRect(25, 12, 3, 8)

    // Seat
    ctx.fillStyle = woodColor
    ctx.fillRect(2, 8, 28, 5)
    ctx.fillStyle = woodShadow
    ctx.fillRect(2, 11, 28, 2)

    // Back
    ctx.fillStyle = woodColor
    ctx.fillRect(2, 2, 28, 4)
    ctx.fillStyle = woodShadow
    ctx.fillRect(2, 4, 28, 2)

    // Slats detail
    ctx.fillStyle = '#5D4037'
    for (let x = 4; x < 28; x += 5) {
        ctx.fillRect(x, 2, 1, 4)
        ctx.fillRect(x, 8, 1, 5)
    }

    return canvas
}

function generateSignSprite(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 24
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Post
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(10, 14, 4, 18)
    ctx.fillStyle = '#6B3A1A'
    ctx.fillRect(12, 14, 2, 18)

    // Sign board
    ctx.fillStyle = '#DEB887'
    ctx.fillRect(2, 4, 20, 12)
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 1
    ctx.strokeRect(2, 4, 20, 12)

    // Sign highlight
    ctx.fillStyle = '#F5DEB3'
    ctx.fillRect(3, 5, 18, 2)

    return canvas
}

function generateFenceSprite(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 24
    canvas.height = 20
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const woodColor = '#A0522D'
    const woodShadow = '#8B4513'

    // Posts
    ctx.fillStyle = woodColor
    ctx.fillRect(2, 2, 4, 18)
    ctx.fillRect(18, 2, 4, 18)

    ctx.fillStyle = woodShadow
    ctx.fillRect(4, 2, 2, 18)
    ctx.fillRect(20, 2, 2, 18)

    // Horizontal rails
    ctx.fillStyle = woodColor
    ctx.fillRect(0, 6, 24, 3)
    ctx.fillRect(0, 14, 24, 3)

    ctx.fillStyle = woodShadow
    ctx.fillRect(0, 8, 24, 1)
    ctx.fillRect(0, 16, 24, 1)

    // Post tops (pointed)
    ctx.fillStyle = woodColor
    ctx.beginPath()
    ctx.moveTo(4, 2)
    ctx.lineTo(2, 4)
    ctx.lineTo(6, 4)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(20, 2)
    ctx.lineTo(18, 4)
    ctx.lineTo(22, 4)
    ctx.closePath()
    ctx.fill()

    return canvas
}

function generateDefaultSprite(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, 16, 16)

    return canvas
}

/**
 * Generate a flower bed decoration (24x16)
 * Colorful clusters of flowers in 3 color variants
 */
function generateFlowerBedSprite(variant: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 24
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Flower color palettes
    const flowerPalettes = [
        { primary: '#FF6B6B', secondary: '#FFE66D', accent: '#4ECDC4' }, // Red/Yellow/Teal
        { primary: '#9B59B6', secondary: '#F39C12', accent: '#E74C3C' }, // Purple/Orange/Red
        { primary: '#FF69B4', secondary: '#87CEEB', accent: '#FFD700' } // Pink/Blue/Gold
    ]
    const palette = flowerPalettes[variant % flowerPalettes.length]!

    // Ground/dirt base
    ctx.fillStyle = '#8B7355'
    ctx.fillRect(2, 10, 20, 6)
    ctx.fillStyle = '#6B5335'
    ctx.fillRect(2, 14, 20, 2)

    // Green leaves/stems base
    ctx.fillStyle = '#228B22'
    for (let i = 0; i < 5; i++) {
        const x = 4 + i * 4
        ctx.fillRect(x, 8, 2, 4)
        ctx.fillRect(x - 1, 9, 1, 2)
        ctx.fillRect(x + 2, 9, 1, 2)
    }

    // Flowers (small colored circles)
    const flowerPositions = [
        { x: 4, y: 4, color: palette.primary },
        { x: 8, y: 3, color: palette.secondary },
        { x: 12, y: 5, color: palette.accent },
        { x: 16, y: 3, color: palette.primary },
        { x: 20, y: 4, color: palette.secondary }
    ]

    for (const flower of flowerPositions) {
        // Flower petals
        ctx.fillStyle = flower.color
        ctx.fillRect(flower.x - 1, flower.y, 3, 3)
        ctx.fillRect(flower.x, flower.y - 1, 1, 1)
        ctx.fillRect(flower.x, flower.y + 3, 1, 1)
        ctx.fillRect(flower.x - 2, flower.y + 1, 1, 1)
        ctx.fillRect(flower.x + 2, flower.y + 1, 1, 1)

        // Flower center
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(flower.x, flower.y + 1, 1, 1)
    }

    return canvas
}

/**
 * Generate a bush decoration (20x18)
 * Small shrubs with 2 shape variants
 */
function generateBushSprite(variant: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 20
    canvas.height = 18
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const bushColors = [
        { base: '#2E8B57', light: '#3CB371', dark: '#1E6B47' }, // Sea green
        { base: '#228B22', light: '#32CD32', dark: '#126B12' } // Forest green
    ]
    const colors = bushColors[variant % bushColors.length]!

    // Main bush body
    ctx.fillStyle = colors.dark
    drawEllipse(ctx, 10, 12, 9, 6)

    ctx.fillStyle = colors.base
    drawEllipse(ctx, 10, 10, 8, 6)

    ctx.fillStyle = colors.light
    drawEllipse(ctx, 8, 8, 5, 4)

    // Bush top highlights
    ctx.fillStyle = colors.light
    ctx.fillRect(5, 5, 2, 2)
    ctx.fillRect(11, 4, 2, 2)

    // Small leaves detail
    ctx.fillStyle = colors.dark
    ctx.fillRect(3, 10, 1, 2)
    ctx.fillRect(16, 11, 1, 2)

    return canvas
}

/**
 * Generate a rock decoration (16x12)
 * Natural boulders in 3 size/shape variants
 */
function generateRockSprite(variant: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    // Different sizes based on variant
    const sizes = [
        { width: 16, height: 12 },
        { width: 12, height: 10 },
        { width: 20, height: 14 }
    ]
    const size = sizes[variant % sizes.length]!
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const rockColors = {
        base: '#808080',
        light: '#A0A0A0',
        dark: '#606060',
        shadow: '#404040'
    }

    const cx = size.width / 2
    const cy = size.height / 2 + 1

    // Rock shadow
    ctx.fillStyle = rockColors.shadow
    drawEllipse(ctx, cx, cy + 2, size.width / 2 - 1, size.height / 3)

    // Main rock body
    ctx.fillStyle = rockColors.dark
    drawEllipse(ctx, cx, cy, size.width / 2 - 1, size.height / 2 - 1)

    ctx.fillStyle = rockColors.base
    drawEllipse(ctx, cx - 1, cy - 1, size.width / 2 - 2, size.height / 2 - 2)

    // Highlight
    ctx.fillStyle = rockColors.light
    ctx.fillRect(cx - 3, cy - 3, 3, 2)
    ctx.fillRect(cx - 2, cy - 4, 2, 1)

    // Cracks/texture
    ctx.fillStyle = rockColors.dark
    ctx.fillRect(cx + 1, cy, 1, 2)
    ctx.fillRect(cx - 1, cy + 1, 2, 1)

    return canvas
}

/**
 * Generate tall grass decoration (24x16)
 * Swaying grass clumps for zone edges
 */
function generateTallGrassSprite(variant: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 24
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const grassColors = [
        { base: '#4A7C59', light: '#6B9C7A', dark: '#3A6A4A' },
        { base: '#5A8C69', light: '#7BAC8A', dark: '#4A7C59' }
    ]
    const colors = grassColors[variant % grassColors.length]!

    // Draw grass blades - varying heights for natural look
    const bladePositions = [
        { x: 2, height: 12, lean: 0 },
        { x: 5, height: 14, lean: -1 },
        { x: 8, height: 10, lean: 1 },
        { x: 11, height: 15, lean: 0 },
        { x: 14, height: 11, lean: -1 },
        { x: 17, height: 13, lean: 1 },
        { x: 20, height: 9, lean: 0 }
    ]

    for (const blade of bladePositions) {
        const baseY = 16
        const tipY = baseY - blade.height

        // Draw blade with slight thickness
        ctx.fillStyle = colors.dark
        ctx.fillRect(blade.x, tipY + 2, 2, blade.height - 2)

        ctx.fillStyle = colors.base
        ctx.fillRect(blade.x, tipY + 1, 2, blade.height - 3)

        // Tip
        ctx.fillStyle = colors.light
        ctx.fillRect(blade.x + blade.lean, tipY, 1, 2)
    }

    return canvas
}

/**
 * Generate barrel decoration (16x20)
 * Wooden storage barrel
 */
function generateBarrelSprite(variant: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 20
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const barrelColors = [
        { wood: '#8B5A2B', woodDark: '#6B4423', band: '#4A4A4A' },
        { wood: '#A0522D', woodDark: '#804020', band: '#3A3A3A' }
    ]
    const colors = barrelColors[variant % barrelColors.length]!

    // Barrel body
    ctx.fillStyle = colors.wood
    ctx.fillRect(2, 4, 12, 14)

    // Barrel sides (curved look via color)
    ctx.fillStyle = colors.woodDark
    ctx.fillRect(2, 4, 2, 14)
    ctx.fillRect(12, 4, 2, 14)

    // Barrel top
    ctx.fillStyle = colors.woodDark
    drawEllipse(ctx, 8, 4, 6, 2)
    ctx.fillStyle = colors.wood
    drawEllipse(ctx, 8, 3, 5, 2)

    // Metal bands
    ctx.fillStyle = colors.band
    ctx.fillRect(1, 6, 14, 2)
    ctx.fillRect(1, 14, 14, 2)

    // Band highlights
    ctx.fillStyle = '#6A6A6A'
    ctx.fillRect(3, 6, 2, 1)
    ctx.fillRect(3, 14, 2, 1)

    // Wood grain lines
    ctx.fillStyle = colors.woodDark
    ctx.fillRect(5, 8, 1, 5)
    ctx.fillRect(9, 8, 1, 5)

    return canvas
}

/**
 * Generate crate decoration (16x16)
 * Wooden supply crate
 */
function generateCrateSprite(variant: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    const crateColors = [
        { wood: '#C4A77D', woodDark: '#A48765', plank: '#8B7355' },
        { wood: '#DEB887', woodDark: '#BEA077', plank: '#9B8365' }
    ]
    const colors = crateColors[variant % crateColors.length]!

    // Main crate body
    ctx.fillStyle = colors.wood
    ctx.fillRect(1, 1, 14, 14)

    // Top edge shadow
    ctx.fillStyle = colors.woodDark
    ctx.fillRect(1, 1, 14, 2)

    // Right edge shadow
    ctx.fillStyle = colors.woodDark
    ctx.fillRect(13, 1, 2, 14)

    // Planks horizontal
    ctx.fillStyle = colors.plank
    ctx.fillRect(1, 5, 14, 1)
    ctx.fillRect(1, 10, 14, 1)

    // Cross planks (X pattern)
    ctx.fillStyle = colors.plank
    // Diagonal from top-left to bottom-right
    for (let i = 0; i < 12; i++) {
        ctx.fillRect(2 + i, 2 + i, 1, 1)
    }
    // Diagonal from top-right to bottom-left
    for (let i = 0; i < 12; i++) {
        ctx.fillRect(13 - i, 2 + i, 1, 1)
    }

    // Corner nails
    ctx.fillStyle = '#4A4A4A'
    ctx.fillRect(2, 2, 1, 1)
    ctx.fillRect(13, 2, 1, 1)
    ctx.fillRect(2, 13, 1, 1)
    ctx.fillRect(13, 13, 1, 1)

    // Outline
    ctx.strokeStyle = '#5D4037'
    ctx.lineWidth = 1
    ctx.strokeRect(1, 1, 14, 14)

    return canvas
}

/**
 * Helper to draw an ellipse
 */
function drawEllipse(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number
): void {
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
}

/**
 * Darken a hex color
 */
function darkenColor(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount))
    const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount))
    const b = Math.max(0, (num & 0xff) * (1 - amount))
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

/**
 * Lighten a hex color
 */
function lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16)
    const r = Math.min(255, ((num >> 16) & 0xff) + 255 * amount)
    const g = Math.min(255, ((num >> 8) & 0xff) + 255 * amount)
    const b = Math.min(255, (num & 0xff) + 255 * amount)
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

/**
 * Generate grass tile pattern
 */
export function generateGrassTile(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Base grass color
    ctx.fillStyle = '#4A7C59'
    ctx.fillRect(0, 0, 16, 16)

    // Add texture variation
    const variations = ['#3D6B4D', '#5A8C69', '#4A7C59', '#3A6A4A']
    for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * 16)
        const y = Math.floor(Math.random() * 16)
        ctx.fillStyle = variations[Math.floor(Math.random() * variations.length)]!
        ctx.fillRect(x, y, 1, 1)
    }

    // Small grass blades
    ctx.fillStyle = '#5A9C6A'
    for (let i = 0; i < 4; i++) {
        const x = 2 + Math.floor(Math.random() * 12)
        const y = 2 + Math.floor(Math.random() * 12)
        ctx.fillRect(x, y, 1, 2)
    }

    return canvas
}

/**
 * Generate plaza/path tile
 */
export function generatePlazaTile(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    // Base sandy color
    ctx.fillStyle = '#D4A574'
    ctx.fillRect(0, 0, 16, 16)

    // Stone pattern
    ctx.fillStyle = '#C49464'
    ctx.fillRect(0, 0, 7, 7)
    ctx.fillRect(8, 8, 8, 8)

    // Grout lines
    ctx.fillStyle = '#A47454'
    ctx.fillRect(7, 0, 1, 16)
    ctx.fillRect(0, 7, 16, 1)

    // Subtle variation
    ctx.fillStyle = '#E4B584'
    ctx.fillRect(2, 2, 2, 2)
    ctx.fillRect(10, 10, 2, 2)

    return canvas
}
