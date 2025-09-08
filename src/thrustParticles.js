function updateParticles() {
    world.particles.forEach(updateParticle);
    world.particles = world.particles.filter((p) => !p.isDead);
}

function drawThrustParticles() {
    world.particles.forEach(drawThrustParticle);
}
/**
 *
 * @param {ThrustParticle} p
 */
function drawThrustParticle(p) {
    push();
    stroke(p.colour); //all[2] is vibrant
    translate(p.pos.x, p.pos.y);
    //perpendicular to direction of movement
    rotate(p.vel.heading() + PI / 2);
    //line gets bigger with particle age, up to a limit
    const ageScaling = map(frameCount - p.startFrame, 0, 30, 1, 4, true);
    line(-ageScaling * p.size, 0, ageScaling * p.size, 0);
    pop();
}

/**
 *
 * @param {ThrustParticle} p
 */
function updateParticle(p) {
    p.pos.add(p.vel);

    if (getHeightAt(p.pos.x) < p.pos.y) {
        p.isDead = true;
    }
    if (frameCount - p.startFrame > p.maxAge) {
        p.isDead = true;
    }
}
/**
 * @typedef {Object} ThrustParticle
 * @property {p5.Vector} pos
 * @property {p5.Vector} vel
 * @property {boolean} isDead
 * @property {number} startFrame
 * @property {number} maxAge
 * @property {p5.Color} colour
 * @property {number} size
 */

/**
 * @param {p5.Vector} pos
 * @param {p5.Vector} vel
 * @param {p5.Color} colour
 * @returns {ThrustParticle}
 */
function createThrustParticle(pos, vel, colour) {
    return {
        pos: pos.copy(),
        vel: vel.copy(),
        isDead: false,
        startFrame: frameCount,
        maxAge: random(60, 120),
        colour,
        size: random([1, 2]),
    };
}
