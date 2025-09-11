/**
 * @typedef {Object} World
 
 * @property {Ship} ship - the player's ship
 * @property {Terrain} terrain
 * @property {NewTerrain} newTerrain
 * @property {Explosion[]} explosions
 * @property {ThrustParticle[]} particles
 * @property {Projectile[]} projectiles
 * @property {WindParticle[]} windParticles
 * @property {Star[]} stars
 * @property {Message[]} messages
 * @property {Palette} palette
 * @property {number} screenShakeAmt - 0 means no screenshake.  diminishes over time.
 * @property {number} moonShadowFraction
 * @property {any[]} bodies - bodies simulated by matter.js (currently  not used in gameplay)
 * @property {Cam} cam - for zooming, tracking ship, etc.
 **/

/**
 *
 * @returns {World}
 */
function createWorld() {
    const palette = createPalette();

    /** @type {World} */
    const createdWorld = {
        ship: createShip(palette),
        terrain: createTerrain(palette),
        newTerrain: createNewTerrain(),
        projectiles: [],
        explosions: [],
        particles: [],
        windParticles: createWindParticles(palette),
        stars: createStarfield(),
        messages: [],
        palette,
        screenShakeAmt: 0,
        moonShadowFraction: random(0.1, 0.5),
        cam: createCam(),
        bodies: [],
    };

    if (config.matter.enabled) {
        const bodies = createInitialPhysicsBodies(createdWorld);
        createdWorld.bodies = bodies;
    }

    return createdWorld;
}
