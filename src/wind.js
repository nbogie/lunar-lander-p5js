/**
 * @param {Palette} palette
 * @returns {WindParticle[]}
 */
function createWindParticles(palette) {
    return collect(config.numWindParticles, () => createWindParticle(palette));
}

/**
 * @typedef {Object} WindParticle
 * @property {p5.Vector} pos
 * @property {number} size
 * @property {p5.Color} colour - used when not in rainbow mode
 * @property {p5.Color} rainbowColour - used in rainbow mode
 */
/**
 * @param {Palette} palette
 * @returns {WindParticle}
 */
function createWindParticle(palette) {
    const pos = createVector(random(width), random(height));

    return {
        pos,
        size: 1,
        colour: generateSubtleWindColour(),
        rainbowColour: random(palette.bases),
    };
}

function generateSubtleWindColour() {
    return random([150, 100]);
}
/**
 * @param {WindParticle} p
 */
function drawWindParticle(p) {
    const strength = createWindAt(p.pos);
    if (strength === 0) {
        return;
    }
    push();
    stroke(config.rainbowWindEnabled ? p.rainbowColour : p.colour);
    strokeWeight(p.size);
    translate(p.pos.x, p.pos.y);
    line(0, 0, strength * 3000, 0);
    pop();
}

/**
 * @param {p5.Vector} pos
 * @returns {number} - x component of the wind.  For now wind has no y component.
 */
function createWindAt(pos) {
    if (!config.windEnabled) {
        return 0;
    }
    const MAX_WIND_SPEED = 0.01;
    const noiseAtPos = noise(5000 + pos.x / 1000, 3000 + pos.y / 100, frameCount / 500);
    const centredNoise = map(noiseAtPos, 0.1, 0.9, -1, 1, true);
    if (abs(centredNoise) < 0.2) {
        return 0;
    }
    const speed = MAX_WIND_SPEED * centredNoise;
    return speed;
}

function drawWind() {
    world.windParticles.forEach(drawWindParticle);
}

/**
 *
 * @param {WindParticle} p
 */
function updateWindParticle(p) {
    const xVel = createWindAt(p.pos) * 100;
    p.pos.x += xVel;

    if (p.pos.x < -20 || p.pos.x > width + 20) {
        p.pos.x = random(width);
    }
}
