/**
 * @typedef {Object} FuelTank
 * @property {p5.Vector} pos
 * @property {number} rotation
 * @property {p5.Color} colour
 * @property {boolean} isDead needs to be culled from world
 * @property {number|undefined} tractoredStreakStartMillis
 */

/**
 * @param {p5.Vector} pos - position of pivot point
 * @param {number} rotation
 * @param {Palette} palette
 * @returns {FuelTank}
 */

function createFuelTank(pos, rotation, palette) {
    return {
        pos: pos.copy(),
        rotation: rotation,
        colour: random(palette.bases),
        tractoredStreakStartMillis: undefined,
        isDead: false,
    };
}

/**
 * @param {FuelTank} fuelTank
 */
function drawFuelTank(fuelTank) {
    function drawOrigin() {
        stroke(255);
        line(-2, 0, 2, 0);
        line(0, -2, 0, 2);
        // circle(0, 0, 2);
    }

    function drawLegs() {
        push();
        fill(world.palette.skyBackground);
        stroke(fuelTank.colour);
        strokeWeight(1 / world.cam.scale);
        translate(0, -10);
        rectMode(CENTER);
        [-1, 1].map((sign) => rect(sign * 20, -1, 5, 20));
        pop();
    }

    function drawTankAndLabel() {
        push();
        translate(0, -20);
        fill(world.palette.skyBackground);
        stroke(fuelTank.colour);
        ellipse(0, 0, 50, 30);
        noStroke();
        fill("white");
        textSize(10);
        textAlign(CENTER, CENTER);
        text("FUEL", 0, 0);
        pop();
    }

    push();
    translate(fuelTank.pos.x, fuelTank.pos.y);
    rotate(fuelTank.rotation);
    drawOrigin();
    drawLegs();
    drawTankAndLabel();
    pop();
}

/**
 *
 * @param {FuelTank} fuelTank
 */
function updateFuelTank(fuelTank) {
    // fuelTank.rotation += TWO_PI / 100;
    //TODO: in reality, just check if the ship tractor beam is on and in range.  break tractor streak if not

    if (world.ship.pos.dist(fuelTank.pos) < 50) {
        if (!fuelTank.tractoredStreakStartMillis) {
            fuelTank.tractoredStreakStartMillis = millis();
        }
        if (millis() - fuelTank.tractoredStreakStartMillis > 1000) {
            refuelShipFromFuelTank(fuelTank, world.ship);
            fuelTank.isDead = true;
        }
    } else {
        fuelTank.tractoredStreakStartMillis = undefined;
    }
}

function updateFuelTanks() {
    world.newTerrain.fuelTanks.forEach(updateFuelTank);
    world.newTerrain.fuelTanks = world.newTerrain.fuelTanks.filter((ft) => !ft.isDead);
}
