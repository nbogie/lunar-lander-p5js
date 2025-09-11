/**
 * @typedef {Object} LandedFlyingState
 * @property {"flying"|"landed"} type
 */

/**
 * @typedef {Object} WeaponSystem
 * @property {number} lastFiredMillis
 * @property {number} cooldownMillis
 */

/**
 * @typedef {Object} Ship
 * @property {LandedFlyingState} state - whether the ship is landed / flying / respawning, etc.
 * @property {p5.Vector} pos - position in world-space
 * @property {p5.Vector} vel - velocity
 * @property {number} height - height of ship - useful in ground-clearance checking
 * @property {number} facing - current facing of ship, in radians (animates smoothly towards desiredRotation)
 * @property {number} desiredFacing - desired facing of ship, in radians
 * @property {number} fuel
 * @property {p5.Color} thrustColour - colour to use for thrust particles
 * @property {p5.Color} colour - colour of ship
 * @property {LandingCheckResult} lastLandingCheck - result of last landing check (cleared each frame)
 * @property {StuntMonitor} stuntMonitor
 * @property {NewTerrainCollisionCheckResult} lastNewTerrainCollisionCheckResult
 * @property {WeaponSystem} weaponSystem
 * //TODO: consider aliasing bugs caused by  holding references here to line segments, vertices, etc.
 * @property {GroundClearanceInfo|null} groundClearanceOnNewTerrain - info about what's beneath the ship!
 *
 */

/**
 *
 * @param {Ship} ship
 */
function drawShip(ship) {
    function drawBooster() {
        rect(-8, 0, 5, 5);
    }

    const mainBodyHeight = round(ship.height * 0.8);

    push();
    translate(round(ship.pos.x), round(ship.pos.y));
    drawShipOverlay(ship);
    rotate(ship.facing);

    stroke(255);
    const colour =
        ship.lastNewTerrainCollisionCheckResult === "inside" ? color("magenta") : ship.colour;
    fill(colour);
    rectMode(CENTER);
    rect(0, 0, round(mainBodyHeight * 0.8), mainBodyHeight);

    //debug ship height
    // noFill();
    // stroke("lime");
    // rect(0, 0, ship.height, ship.height);

    //boosters
    push();
    translate(-4, -10);
    drawBooster();
    pop();
    push();
    translate(-4, 10);
    drawBooster();
    pop();

    pop();

    push();
    const cornerPts = shipCornersInWorldSpace(ship);
    for (const pt of cornerPts) {
        noStroke();
        fill("lime");
        circle(pt.x, pt.y, 3);
    }

    pop();
}

/**
 * @param {Ship} ship
 */
function drawShipOverlay(ship) {
    push();
    translate(0, -20);
    drawFuelBar(ship);

    const clearance = ship.groundClearanceOnNewTerrain;
    if (clearance) {
        push();
        noStroke();
        fill("yellow");
        textAlign(CENTER, CENTER);
        text(round(clearance.distance), 0, -20);
        pop();
    }

    pop();
}

/**
 * @typedef {Object} LandingCheckResult
 * @property {boolean} result - True if landing is allowed, false otherwise.
 * @property {string} [reason] - Explanation for failure or warning.
 * @property {"warning"} [type] - Indicates a warning (optional).
 */

/**
 * Checks if the ship meets all conditions for a safe landing.  Crashing is not handled here.
 * @param {Object} ship - The ship object to check.
 * @returns {LandingCheckResult} Landing check result object.
 */
function checkIsOkForLanding(ship) {
    if (ship.state.type !== "flying") {
        return {
            result: false,
            reason: "not flying",
        };
    }

    if (!isNearAnyLandingPad(ship.pos.x, world.terrain.landingPads)) {
        return {
            result: false,
            type: "warning",
            reason: "not over landing pad",
        };
    }
    const groundClearance = calcGroundClearance(ship);
    if (ship.vel.y > 0.7) {
        return {
            result: false,
            type: "warning",
            reason: `descent too fast (${ship.vel.y.toFixed(2)})`,
        };
    }

    if (!isShipLevel(ship)) {
        const angleDeg = degrees(getTiltAngle(ship)).toFixed(1);
        return {
            result: false,
            type: "warning",
            reason: `not level (${angleDeg})`,
        };
    }

    if (groundClearance > -2 && groundClearance <= 0) {
        return {
            result: true,
        };
    } else {
        return {
            result: false,
            reason: "not close to ground",
        };
    }
}
/**
 * @param {Ship} ship
 * @returns number angle between -PI and PI (-180 to 180), where 0 represents a perfectly level ship.
 */
function getTiltAngle(ship) {
    return normalizeRotationAsTiltAlternativeMethod(ship.facing + PI / 2);
}

// see normalizeRotationAsTilt.  Achieves the same result, but with one more division.
function modFlooredAlwaysPositive(n, m) {
    return ((n % m) + m) % m;
}

//converts a rotation in range -inf to +inf into range -179.999 to +180
function normalizeRotationAsTiltAlternativeMethod(rawRotation) {
    return -PI + modFlooredAlwaysPositive(rawRotation - PI, TWO_PI);
}

//converts a rotation in range -inf to +inf into range -179.999 to +180
function normalizeRotationAsTilt(rawRotation) {
    //into range -360 to +360
    let normalized = rawRotation % TWO_PI;

    //into range -179 to 180
    if (normalized > PI) {
        normalized -= TWO_PI;
    }
    //into range -179, 180
    else if (normalized <= -PI) {
        normalized += TWO_PI;
    }

    return normalized;
}

/**
 * @param {Palette} palette - palette to draw colours from
 * @returns {Ship}
 */
function createShip(palette) {
    /**@type {Ship} */
    const createdShip = {
        state: {
            type: "flying",
        },
        pos: createVector(width / 2, height / 2),
        vel: createVector(0, 0),
        height: 30,
        facing: -PI / 2,
        desiredFacing: -PI / 2,
        fuel: 1,
        thrustColour: palette.all[2],
        colour: palette.skyBackground, //arr[5],
        lastLandingCheck: undefined,
        lastNewTerrainCollisionCheckResult: undefined,
        groundClearanceOnNewTerrain: null,
        weaponSystem: createDefaultWeapon(),
        stuntMonitor: createStuntMonitor(),
    };
    clearStunts(createdShip);

    return createdShip;
}

/**
 * @param {Ship} ship
 */
function cheatSetShipForEasyLanding(ship) {
    /**@type {LandingPad[]} */
    const allPads = world.terrain.landingPads;
    const pad = random(allPads);
    ship.pos = createVector(
        pad.leftX + pad.width / 2,
        getHeightAt(pad.leftX) - 40 - ship.height / 2
    );
    setShipUprightImmediately(ship);
    ship.vel = createVector(0, 0.5);
    postMessage("cheat! easy landing prepared");
    world.ship.state = {
        type: "flying",
    };
}

function shipSpawnPosition() {
    return createVector(100, 50);
}

/**
 * @param {Ship} ship - ship to update
 */
function setShipUprightImmediately(ship) {
    ship.desiredFacing = 0 - PI / 2;
    ship.facing = ship.desiredFacing;
}

function respawnShip() {
    world.ship.pos = shipSpawnPosition();
    world.ship.vel = createVector(0, 0);
    setShipUprightImmediately(world.ship);
    world.ship.fuel = 1;
    world.ship.state = {
        type: "flying",
    };
    clearStunts(world.ship);
}

/**
 * Returns the distance between base of ship and ground at ship's x pos.
 * Negative clearance means the base of the ship is penetrating the ground.
 * Doesn't consider rotation of the ship.
 * @param {Ship} ship
 */
function calcGroundClearance(ship) {
    return getHeightAt(ship.pos.x) - ship.pos.y - ship.height / 2;
}

/**
 * @param {Ship} ship
 */
function isShipLevel(ship) {
    return abs(getTiltAngle(ship)) < PI / 5;
}

/**
 *
 * @param {Ship} ship
 */
function processShipTakeOff(ship) {
    ship.state = {
        type: "flying",
    };
    const pad = landingPadAtXOrNull(ship.pos.x);
    postMessage("Lift off from " + pad.name + " base");
    ship.stuntMonitor.lastVisitedBaseName = pad.name;
    ship.stuntMonitor.lastTakeOffTimeMs = millis();
}

/**
 * @param {Ship} ship - ship to update
 */
function processShipLanded(ship) {
    ship.state = {
        type: "landed",
    };

    ship.vel = createVector(0, 0);
    ship.pos.y = getHeightAt(ship.pos.x) - ship.height / 2;
    setShipUprightImmediately(ship);
    //(note: we don't do an immediate refuel - it happens gradually each frame in updateShip if we're in suitable state)

    const pad = landingPadAtXOrNull(ship.pos.x);
    if (pad) {
        ship.thrustColour = pad.colour;
        postMessage("Landed at " + pad.name + " base");
        processAnyBaseToBaseFlightTime(ship, pad);

        //award points for all stunts
        // postMessage("Stunt count: " + ship.stuntMonitor.log.length);
    }
    clearStunts(ship);
}

/**
 *
 * @param {Ship} ship
 * @param {LandingCheckResult} landingCheck
 */
function processShipCrash(ship, landingCheck) {
    spawnExplosion(ship.pos.copy());
    respawnShip();
    world.screenShakeAmt = 1;
    postMessage("cause of crash: " + landingCheck.reason);
}

/**
 * @param {Ship} ship
 */
function drawFuelBar(ship) {
    push();
    fill(50);
    stroke("white");
    strokeWeight(0.5);
    const fullW = 20;
    const h = 2;
    translate(-fullW / 2, 0);
    rectMode(CORNER);
    rect(0, 0, fullW, h);
    const fuelW = ship.fuel * fullW;
    fill(ship.thrustColour);
    noStroke();
    rect(0, 0, fuelW, h);

    fill(255);
    // text("F:" + ((ship.fuel * 100).toFixed(1)) + "%", 0, 0)
    // text("S:" + ship.stuntMonitor.log.length, 0, -10);
    pop();
}

/**
 *
 * @param {Ship} ship
 */
function refuelShipOneTick(ship) {
    const pad = landingPadAtXOrNull(ship.pos.x);
    const amtTransferred = config.refuelPerTick; // * deltaTime;
    ship.fuel = constrain(ship.fuel + amtTransferred, 0, 1);
    pad.fuel = constrain(pad.fuel - amtTransferred, 0, pad.maxFuel);
    if (ship.fuel >= 1) {
        postMessage("Refuelling complete");
    }
}

/**
 *
 * @param {Ship} ship
 */
function updateShip(ship) {
    ship.lastLandingCheck = undefined;

    monitorStunts(ship);

    if (ship.state.type === "landed") {
        if (ship.fuel < 1) {
            refuelShipOneTick(ship);
        }
    }
    let { tookOffThisFrame } = handleAnyUserThrust(ship);
    handleAnyUserWeaponFiring(ship);

    if (ship.state.type !== "landed") {
        handleAnyUserSteering(ship);
    }

    const collisionCheckResult = detectNewTerrainCollision(ship);
    ship.lastNewTerrainCollisionCheckResult = collisionCheckResult;
    ship.groundClearanceOnNewTerrain = calcNewTerrainGroundClearance(ship);
    ship.facing = lerp(ship.facing, ship.desiredFacing, 0.1);

    if (ship.state.type === "landed") {
        return;
    }

    //accelerate ship with gravity...
    if (config.gravityEnabled) {
        const gravity = createVector(0, config.gravity);
        ship.vel.add(gravity);
    }
    //...and with wind
    if (config.windEnabled) {
        const windSpeed = createWindAt(ship.pos);
        ship.vel.x += windSpeed;
    }

    ship.pos.add(ship.vel);

    if (config.disableOldTerrain) {
        return;
    }

    if (!tookOffThisFrame) {
        const landingCheck = checkIsOkForLanding(ship);

        ship.lastLandingCheck = landingCheck; // store for later rendering (e.g. in ILS)

        if (landingCheck.result) {
            processShipLanded(ship);
        } else if (isUnderTerrain(ship)) {
            processShipCrash(ship, landingCheck);
        } //else normal flight
    }
}

/**
 * @param {Ship} ship
 */
function drawLastLandingCheckWarning(ship) {
    const lastLandingCheck = ship.lastLandingCheck;
    if (!lastLandingCheck || lastLandingCheck.type !== "warning") {
        return;
    }
    const pad = nearestLandingPad(ship.pos.x);

    if (distanceToLandingPad(pad, ship.pos.x) > pad.width) {
        return;
    }

    push();
    fill(world.palette.all[5]);
    noStroke();
    textSize(12);

    textAlign(CENTER);
    translate(pad.centreX, getHeightAt(pad.centreX) + 60);
    text(lastLandingCheck.reason, 0, 0);
    pop();
}

function fireThrusters() {
    const thrustVec = p5.Vector.fromAngle(world.ship.facing, config.thrust);
    world.ship.vel.add(thrustVec);
    world.ship.fuel -= config.fuelUsedPerTick;
    addParticleEffectsFromThrusters(thrustVec);
}

/**
 *
 * @param {Ship} ship
 */
function fireWeapon(ship) {
    const projectileSpeed = 3;
    const velocity = p5.Vector.fromAngle(world.ship.facing, projectileSpeed).add(world.ship.vel);
    spawnProjectile(ship.pos.copy(), velocity);
    ship.weaponSystem.lastFiredMillis = millis();
}

function shipCornersInWorldSpace(ship) {
    const cornerOffsets = [
        createVector(-10, -10),
        createVector(-10, 10),
        createVector(10, -10),
        createVector(10, 10),
    ];
    return cornerOffsets.map((cornerOffset) =>
        getRotatedPositionOfOffsetPoint(ship.pos, ship.facing, cornerOffset)
    );
}

/**
 * @param {p5.Vector} thrustVec - direction and magnitude of the thrust particle (direction already rotated)
 */
function addParticleEffectsFromThrusters(thrustVec) {
    //Currently the body of the ship gets drawn rotated by -PI/2.  These offsets reflect that.
    const thrusterOffsets = [createVector(-10, 10), createVector(-10, -10)];

    thrusterOffsets.forEach((thrusterOffset) => {
        const rotatedThrustEmitterPos = getRotatedPositionOfOffsetPoint(
            world.ship.pos,
            world.ship.facing,
            thrusterOffset
        );

        world.particles.push(
            createThrustParticle(
                rotatedThrustEmitterPos,
                thrustVec
                    .copy()
                    .rotate(randomGaussian(PI, PI / 20))
                    .setMag(random(1.45, 1.55)),
                world.ship.thrustColour
            )
        );
    });
}

/**
 * Calculates the world-space coordinates of a point on a rotated body,
 * given its local offset from the rotated body's centre.
 * @param {p5.Vector} parentPos The parent's world-space position vector.
 * @param {number} parentRotation The parent body's rotation in radians.
 * @param {p5.Vector} relativePosition The point's local offset from the centre of the parent body
 * @returns {p5.Vector} A new vector representing the point's world-space coordinates after following the body's rotation.
 */
function getRotatedPositionOfOffsetPoint(parentPos, parentRotation, relativePosition) {
    let rotatedOffset = relativePosition.copy();
    rotatedOffset.rotate(parentRotation);
    return p5.Vector.add(parentPos, rotatedOffset);
}

/**
 * @param {Ship} ship
 * @returns {{tookOffThisFrame:boolean}} indicates if the thrust action has caused lift-off (if we were landed)
 */
function handleAnyUserThrust(ship) {
    if (
        keyIsDown(UP_ARROW) ||
        keyIsDown(87) //'w' key
    ) {
        if (ship.fuel > 0) {
            fireThrusters();
            if (ship.state.type === "landed") {
                processShipTakeOff(ship);
                return { tookOffThisFrame: true };
            }
        }
    }
    return { tookOffThisFrame: false };
}

/**
 * take user inputs and steer ship accordingly
 * @param {Ship} ship
 */
function handleAnyUserSteering(ship) {
    if (
        keyIsDown(LEFT_ARROW) ||
        keyIsDown(65) //'a' key
    ) {
        ship.desiredFacing -= config.turnSpeed;
    }

    if (
        keyIsDown(RIGHT_ARROW) ||
        keyIsDown(68) //'d' key
    ) {
        ship.desiredFacing += config.turnSpeed;
    }
}
/**
 *
 * @param {Ship} ship
 */
function handleAnyUserWeaponFiring(ship) {
    const { lastFiredMillis, cooldownMillis } = ship.weaponSystem;
    if (keyIsDown(SHIFT)) {
        if (lastFiredMillis + cooldownMillis < millis()) {
            fireWeapon(ship);
        }
    }
}

/**
 * @returns {WeaponSystem}
 */
function createDefaultWeapon() {
    return {
        lastFiredMillis: -1000000,
        cooldownMillis: 300,
    };
}
