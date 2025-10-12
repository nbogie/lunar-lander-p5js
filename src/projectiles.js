/**
 * @typedef {Object} Projectile
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
 * @returns {Projectile}
 */
function createProjectile(pos, vel, colour) {
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

/**
 *
 * @param {p5.Vector} pos
 * @param {p5.Vector} vel
 */
function spawnProjectile(pos, vel) {
    const projectile = createProjectile(pos, vel, world.palette.all[4]);
    world.projectiles.push(projectile);
}

function updateProjectiles() {
    world.projectiles.forEach(updateProjectile);
    world.projectiles = world.projectiles.filter((p) => !p.isDead);
}

function drawProjectiles() {
    world.projectiles.forEach(drawProjectile);
}
/**
 *
 * @param {Projectile} p
 */
function drawProjectile(p) {
    push();

    noFill();
    stroke(p.colour);
    strokeWeight(2 / world.cam.scale);
    translate(p.pos.x, p.pos.y);
    rotate(p.vel.heading());
    line(-2, 0, 2, 0);
    pop();
}

/**
 *
 * @param {Projectile} p
 */
function updateProjectile(p) {
    p.pos.add(p.vel);

    if (getHeightAt(p.pos.x) < p.pos.y) {
        p.isDead = true;
    }
    if (frameCount - p.startFrame > p.maxAge) {
        p.isDead = true;
    }
    if (isCollidingWithNewTerrain(p.pos, world.newTerrain) === "inside") {
        p.isDead = true;
    }
}
