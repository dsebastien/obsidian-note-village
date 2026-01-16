import * as ex from 'excalibur'

/**
 * Gives an actor wandering behavior within a radius of home position.
 */
export class WandererComponent extends ex.Component {
    readonly type = 'wanderer'

    /** Current state of wandering */
    state: 'idle' | 'walking' = 'idle'

    /** Time until next state change */
    stateTimer = 0

    /** Current target position when walking */
    targetPosition: ex.Vector | null = null

    constructor(
        public homePosition: ex.Vector,
        public wanderRadius: number = 50,
        public walkSpeed: number = 30,
        public minIdleTime: number = 2000,
        public maxIdleTime: number = 5000,
        public minWalkTime: number = 1000,
        public maxWalkTime: number = 3000
    ) {
        super()
    }

    /**
     * Update home position (called when villager changes zones)
     */
    setHomePosition(position: ex.Vector): void {
        this.homePosition = position
    }
}
