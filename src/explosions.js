/**
 * @typedef {Object} Explosion
 */

function updateExplosions() {
    world.explosions = world.explosions.filter((exp) => frameCount - exp.startFrame < 30);
}

/**
 * @param {Explosion} explosion
 */
function drawExplosion(explosion) {
    push();

    const numPts = random(3, 7);
    beginShape();
    noFill();
    // fill(world.palette.skyBackground);
    colorMode(HSB);
    stroke(random(0, 50), 100, 100, 50);

    const radius = map(abs(frameCount - explosion.startFrame - 15), 0, 30, 40, 10, true);
    for (let i = 0; i < numPts; i++) {
        const p = p5.Vector.add(
            explosion.pos,
            p5.Vector.random2D().mult(randomGaussian(radius, radius * 0.3))
        );
        vertex(p.x, p.y);
    }
    endShape(CLOSE);
    pop();
}

/**
 *
 * @param {p5.Vector} pos - position at which to spawn explosion
 */
function spawnExplosion(pos) {
    /** @type {Explosion} */
    const explosion = {
        pos: pos.copy(),
        startFrame: frameCount,
    };

    world.explosions.push(explosion);
}
