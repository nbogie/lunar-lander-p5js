/**
 *
 * @param {number} x - x co-ordinate at which ground level should be found
 * @returns {number} - y co-ordinate of ground (in world-space) at given x position
 */
function getHeightAt(x) {
    const points = world.terrain.points;
    const ptAfter = points.find((pt) => pt.x > x);
    const ptBefore = [...points].reverse().find((pt) => pt.x <= x);
    if (!ptAfter) {
        return ptBefore.y;
    }
    if (!ptBefore) {
        return ptAfter.y;
    }
    return map(x, ptBefore.x, ptAfter.x, ptBefore.y, ptAfter.y, true);
}

/**
 * @param {Ship} ship
 * @returns {boolean}
 */
function isUnderTerrain(ship) {
    const clearance = calcGroundClearance(ship);
    return clearance < -5;
}

/**
 * @typedef {Object} Terrain
 * @property {p5.Vector[]} points - an array of world-space positions outlining the terrain
 * @property {LandingPad[]} landingPads
 */

/**
 *
 * @param {Palette} palette
 * @returns {Terrain}
 */
function createTerrain(palette) {
    const landingPads = createLandingPads(palette);
    const pts = [];
    let prevY = null;
    for (let x = -config.xStep; x < width + config.xStep; x += config.xStep) {
        const noiseY = map(noise(2000 + x / 300), 0.15, 0.85, height * 0.9, height * 0.3);
        let y = noiseY;
        const nearPad = isNearAnyLandingPad(x, landingPads);
        if (nearPad) {
            y = prevY;
        } else {
            prevY = y;
        }
        const pt = createVector(x, y);
        pts.push(pt);
    }

    return {
        points: pts,
        landingPads,
    };
}

function drawTerrain() {
    push();
    strokeCap(SQUARE);
    strokeWeight(1);
    fill(world.palette.landBackground);
    stroke(world.palette.all[6]);

    beginShape();
    for (let pt of world.terrain.points) {
        vertex(pt.x, pt.y);
    }
    vertex(width + 50, height + 50);
    vertex(-50, height + 50);
    endShape(CLOSE);
    pop();

    drawLandingPadExtras();
}
