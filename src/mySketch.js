//"use strict";
/*
	Lunar Lander #WCCChallenge "Pump"
	https://openprocessing.org/sketch/2711492
    
    Also on github at https://github.com/nbogie/lunar-lander-p5js

	This is a quick attempt at implementing a "lunar-lander"/"thrust" style game.
	So far, the pump theme isn't very strong in this one, but I though i'd submit for fun as I did write it for the challenge. 
	
    
	Currently, there's: 
	* fuel pumped from the tank to the ship,    
	* pump association with the winds that blow across the moon,
    (I can't decide how much atmosphere is, here!)
    
    Credits: Palette is "Tundra3" from Kjetil Golid's chromotome collection https://chromotome-quicker.netlify.app/ and https://github.com/kgolid
	
	See all challenge submissions: 
	https://openprocessing.org/curation/78544

	Join the Birb's Nest Discord for friendly creative coding community
	and future challenges and contributions: https://discord.gg/S8c7qcjw2b
*/

// TODO:
// * allow fuel-scooping "cosmic winds" (perhaps this is ship fuel or otherwise needed by bases)
// *   paint wind areas by gas colour
// * incorporate deltaTime to support any frameRate
// * add pumping of oxygen or other gases or liquids?
// * use constraints to pick up and move cargo between locations
// * have some cavernous levels with a ceiling
// * incorporate ideas from "desert golf" game
// * make wind visualisation more efficient (e.g. periodically spawn replacement short-lived wind particles across a loose grid to ensure coverage, rather than relying on coverage through large numbers)
// * complete a switch-over to matter.js physics engine
// * space sfx - web audio?
// * garbled radio talk (like scratched w timeshaper?)

let world;

let config = {
    turnSpeed: 0.18,
    thrust: 0.15,
    gravity: 0.01,
    xStep: 15,
    padWidth: 90, //should be a multiple of xStep
    fuelUsedPerTick: 0.005,
    refuelPerTick: 0.0035,
    windEnabled: true,
    numWindParticles: 500,
    screenShakeEnabled: true,
    starsEnabled: true,
    debugMessagesEnabled: true,
    rainbowWindEnabled: true,
    drawSunAsLines: true,
    zenModeEnabled: false,
    zenModeBackup: {},
    matter: {
        enabled: false, //sketch restart and matter.js and poly-decomp libraries will be required if enabled
        debugRendererEnabled: false, //sketch restart required
    },
};

/** Saved only to allow setting focus once the underlying canvas is ready. Seems necessary for openprocessing. */
let p5Canvas;

function setup() {
    const mainCanvasHeight =
        config.matter.enabled && config.matter.debugRendererEnabled
            ? windowHeight / 2
            : windowHeight;
    p5Canvas = createCanvas(windowWidth, mainCanvasHeight);

    config.matter.enabled && setupMatterJS();
    frameRate(60);
    textFont("Courier New");
    postInstructionalMessages();
    restart();
}

function restart() {
    //e.g. config.seed = 1756680251196;
    config.seed = round(new Date());
    noiseSeed(config.seed);

    world = createWorld();
    respawnShip();
}

function drawBall(b) {
    push();
    noFill();
    stroke(255);
    circle(b.position.x, b.position.y, 2 * b.circleRadius);

    pop();
}

function draw() {
    focusCanvasOnce();
    background(world.palette.skyBackground);
    push();
    config.screenShakeEnabled && applyAnyScreenShake();
    updateShip(world.ship);
    updateParticles();
    config.starsEnabled && drawStarfield();
    if (config.drawSunAsLines) {
        drawSunWithHorizontalLines();
    } else {
        drawSunOutline();
    }

    drawOtherMoon();

    if (config.windEnabled) {
        world.windParticles.forEach(updateWindParticle);
        drawWind();
    }
    drawTerrain();

    if (config.matter.enabled) {
        world.bodies.forEach(drawBall);
    }

    drawThrustParticles();
    drawShip(world.ship);
    world.explosions.forEach(drawExplosion);
    drawMessages();
    config.debugMessagesEnabled && drawDebugText();
    pop(); //end effect of screenshake

    updateExplosions();
    updateAnyScreenShake();
    updateMessages();
}

function drawWind() {
    world.windParticles.forEach(drawWindParticle);
}

function updateExplosions() {
    world.explosions = world.explosions.filter((exp) => frameCount - exp.startFrame < 30);
}

function drawStarfield() {
    world.stars.forEach(drawStar);
}

function createStarfield() {
    return collect(100, createStar);
    //todo: prune stars lower than terrain?
}

function createStar() {
    return {
        colour: random() > 0.93 ? random(["skyblue", "pink"]) : 255,
        size: random(0.4, 1),
        pos: createVector(random(width), random(height)),
    };
}

function updateParticles() {
    world.particles.forEach(updateParticle);
    world.particles = world.particles.filter((p) => !p.isDead);
}

function updateWindParticle(p) {
    p.vel = createVector(createWindAt(p.pos), 0);
    p.pos.add(p5.Vector.mult(p.vel, 100));
    if (p.pos.x < -20 || p.pos.x > width + 20) {
        p.pos.x = random(width);
    }
}

function updateParticle(p) {
    p.pos.add(p.vel);

    if (getHeightAt(p.pos.x) < p.pos.y) {
        p.isDead = true;
    }
    if (frameCount - p.startFrame > p.maxAge) {
        p.isDead = true;
    }
}

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

function drawStar(star) {
    push();
    stroke(star.colour);
    strokeWeight(1);
    translate(star.pos.x, star.pos.y);
    scale(star.size);
    line(-3, 0, 3, 0);
    line(0, -3, 0, 3);
    pop();
}

function drawExplosion(explosion) {
    push();
    const numPts = random(3, 7);
    beginShape();
    noFill();
    // fill(world.palette.skyBackground);
    colorMode(HSB);
    stroke(random(0, 50), 100, 100, 50);

    for (let i = 0; i < numPts; i++) {
        const radius = map(abs(frameCount - explosion.startFrame - 15), 0, 30, 40, 10, true);
        const p = p5.Vector.add(
            explosion.pos,
            p5.Vector.random2D().mult(randomGaussian(radius, radius * 0.3))
        );
        vertex(p.x, p.y);
    }
    endShape(CLOSE);
    pop();
}

function isFrameRateSlow(expectedRate, tolerance) {
    return frameRate() < expectedRate * (1 - tolerance);
}

function drawDebugText() {
    push();
    const str = JSON.stringify(world.ship.state);
    const outputs = [];
    outputs.push({
        t: "FPS " + frameRate().toFixed(0),
        colour: isFrameRateSlow(60, 0.1) ? "red" : "white",
    });
    outputs.push({
        t: "state: " + str,
    });

    let colourForFuelMsg = world.ship.fuel < 0.15 && frameCount % 30 < 15 ? 50 : 255;

    outputs.push({
        t: "fuel " + (world.ship.fuel * 100).toFixed(1) + "%",
        colourForFuelMsg,
    });

    outputs.push({
        t: "tilt " + degrees(getTiltAngle(world.ship)).toFixed(0),
    });

    outputs.push({
        t: composeVerticalSpeedMessage(),
    });

    translate(200, 50);
    for (let { t, colour } of outputs) {
        fill(colour ?? 255);
        noStroke();
        textSize(18);
        text(t, 0, 0);
        translate(0, 25);
    }
    pop();
}

function composeVerticalSpeedMessage() {
    const val = world.ship.vel.y;
    let emoji = "0️⃣";
    if (val < 0) {
        emoji = "⬆️";
    } else if (val > 0) {
        emoji = "⬇️";
    }
    return "v speed " + emoji + " " + world.ship.vel.y.toFixed(1);
}

function drawThrustParticles() {
    world.particles.forEach(drawThrustParticle);
}

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

function createWindParticles(palette) {
    return collect(config.numWindParticles, () => createWindParticle(palette));
}

function createWindParticle(palette) {
    const pos = createVector(random(width), random(height));

    return {
        pos,
        vel: createWindAt(pos),
        size: 1,
        colour: generateSubtleWindColour(),
        rainbowColour: random(palette.bases),
    };
}

function generateSubtleWindColour() {
    return random([150, 100]);
}

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

function drawLandingPadExtras() {
    for (let pad of world.terrain.landingPads) {
        drawLandingPadFuelTank(pad);
        // drawLandingPadFlagAt(pad.leftX);
        // drawLandingPadFlagAt(pad.leftX + pad.width);

        drawLandingPadPlatform(pad);
        drawLandingPadLabel(pad);
    }
}

function drawLandingPadLabel(pad) {
    push();
    const x = pad.leftX + pad.width / 2;
    translate(x, getHeightAt(x) + 20);
    textAlign(CENTER, TOP);
    fill("white");
    noStroke();
    text(pad.name, 0, 0);
    pop();
}

function drawLandingPadPlatform(pad) {
    push();
    translate(pad.leftX, getHeightAt(pad.leftX));
    stroke(pad.colour);
    strokeWeight(3);
    strokeCap(SQUARE);
    // drawingContext.setLineDash([config.xStep, config.xStep]);
    line(0, 0, pad.width, 0);
    // stroke(pad.colour2)
    // line(config.xStep, 0, pad.width, 0)
    pop();
}

function drawLandingPadFuelTank(pad) {
    push();
    const w = pad.width / 2.5;
    const h = w / 2;
    const x = pad.leftX + pad.width - w / 2;
    translate(x, getHeightAt(x) - h * 0.5 - 2);
    fill(world.palette.skyBackground);
    stroke(255);
    rectMode(CENTER);
    const cornerRadius = w / 6;
    rect(0, 0, w, h, cornerRadius);
    noStroke();
    fill(255);
    textSize(7);
    textAlign(CENTER, CENTER);
    text("FUEL " + floor(pad.fuel), 0, 0);

    //fuel tank legs
    [-10, 10].map((x) => {
        push();
        fill(150);
        translate(x, h / 2);
        noStroke();
        rectMode(CENTER);
        rect(0, 0, 4, 2);
        pop();
    });
    pop();
}

function drawLandingPadFlagAt(x) {
    const flagHeight = 20;
    const flagWidth = 10;
    push();
    translate(x, getHeightAt(x) - flagHeight);
    stroke("white");
    line(0, 0, 0, flagHeight);
    fill(world.palette.all[0]);
    triangle(0, 0, flagWidth, 5, 0, 10);
    pop();
}

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
    fill(ship.colour);
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
}
function drawShipOverlay(ship) {
    push();
    translate(0, -20);
    drawFuelBar(ship);
    pop();
}

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
    // text("F:" + ((ship.fuel * 100).toFixed(1)) + "%", 0, 0)
    pop();
}

function updateShip(ship) {
    if (ship.state.type === "landed") {
        if (ship.fuel < 1) {
            const pad = landingPadAtXOrNull(ship.pos.x);
            const amtTransferred = config.refuelPerTick; // * deltaTime;
            ship.fuel = constrain(ship.fuel + amtTransferred, 0, 1);
            pad.fuel = constrain(pad.fuel - amtTransferred, 0, pad.maxFuel);
            if (ship.fuel >= 1) {
                postMessage("Refuelling complete");
            }
        }
    }
    let tookOffThisFrame = false;

    if (keyIsDown(UP_ARROW)) {
        if (ship.fuel > 0) {
            fireThrusters();
            if (ship.state.type === "landed") {
                ship.state = {
                    type: "flying",
                };
                const pad = landingPadAtXOrNull(ship.pos.x);
                postMessage("Lift off from " + pad.name + " base");
                tookOffThisFrame = true;
            }
        }
    }

    if (ship.state.type !== "landed") {
        if (keyIsDown(LEFT_ARROW)) {
            ship.desiredFacing -= config.turnSpeed;
        }

        if (keyIsDown(RIGHT_ARROW)) {
            ship.desiredFacing += config.turnSpeed;
        }
    }

    ship.facing = lerp(ship.facing, ship.desiredFacing, 0.1);

    if (ship.state.type === "landed") {
        return;
    }

    const gravity = createVector(0, 1).mult(config.gravity);
    if (config.windEnabled) {
        const windSpeed = createWindAt(ship.pos);
        ship.vel.x += windSpeed;
    }
    ship.vel.add(gravity);
    ship.pos.add(ship.vel);

    if (!tookOffThisFrame) {
        const landingCheck = checkIsOkForLanding(ship);
        if (landingCheck.result) {
            setLandedShip(ship);
            return;
        }

        if (landingCheck.type === "warning") {
            push();
            fill(world.palette.all[5]);
            noStroke();
            textSize(18);
            text(landingCheck.reason, 200, 200);
            pop();
        }

        if (isUnderTerrain(ship)) {
            //todo: spawn an explosion at crash site
            spawnExplosion(ship.pos.copy());
            respawnShip();
            world.screenShakeAmt = 1;
            postMessage("cause of crash: " + landingCheck.reason);
        }
    }
}

function fireThrusters() {
    const thrustVec = p5.Vector.fromAngle(world.ship.facing, config.thrust);
    world.ship.vel.add(thrustVec);
    world.ship.fuel -= config.fuelUsedPerTick;
    addParticleEffectsFromThrusters(thrustVec);
}

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

function postMessage(str, durationMs = 5000) {
    world.messages.push({
        msg: str,
        postTime: millis(),
        durationMs,
    });
}

function updateMessages() {
    world.messages = world.messages.filter((m) => millis() < m.postTime + m.durationMs);
}

function drawMessages() {
    push();
    translate(width - 50, 50);
    for (let m of world.messages) {
        textSize(17);
        textAlign(RIGHT);
        noStroke();
        fill("white");
        // const timePrefix = +" at " + formatMillisecondsToMMSS(m.postTime);
        text(m.msg, 0, 0);
        translate(0, 30);
    }
    pop();
}

function spawnExplosion(pos) {
    world.explosions.push({
        pos: pos.copy(),
        startFrame: frameCount,
    });
}
/**
 * Returns the distance between base of ship and ground at ship's x pos.
 * Negative clearance means the base of the ship is penetrating the ground.
 * Doesn't consider rotation of the ship.
 */
function calcGroundClearance(ship) {
    return getHeightAt(ship.pos.x) - ship.pos.y - ship.height / 2;
}

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

function isShipLevel(ship) {
    return abs(getTiltAngle(ship)) < PI / 5;
}

function setLandedShip(ship) {
    ship.state = {
        type: "landed",
    };
    ship.vel = createVector(0, 0);
    ship.pos.y = getHeightAt(ship.pos.x) - ship.height / 2;
    setShipUprightImmediately(ship);
    //(no immediate refuel)

    const pad = landingPadAtXOrNull(ship.pos.x);
    if (pad) {
        ship.thrustColour = pad.colour;
        postMessage("Landed at " + pad.name + " base");
    }
}

function setShipUprightImmediately(ship) {
    ship.desiredFacing = 0 - PI / 2;
    ship.facing = ship.desiredFacing;
}

function respawnShip() {
    world.ship.pos = spawnPosition();
    world.ship.vel = createVector(0, 0);
    setShipUprightImmediately(world.ship);
    world.ship.fuel = 1;
    world.ship.state = {
        type: "flying",
    };
}

function createWorld() {
    const palette = createPalette();

    const createdWorld = {
        state: {
            type: "flying", //landed | flying
        },
        ship: createShip(palette),
        terrain: createTerrain(palette),
        explosions: [],
        particles: [],
        windParticles: createWindParticles(palette),
        stars: createStarfield(),
        messages: [],
        palette,
        screenShakeAmt: 0,
        moonShadowFraction: random(0.1, 0.5),
        bodies: [],
    };

    if (config.matter.enabled) {
        const bodies = createInitialPhysicsBodies(createdWorld);
        createdWorld.bodies = bodies;
    }

    return createdWorld;
}

function createPalette() {
    // Kjetil Golid's "Tundra3" https://chromotome-quicker.netlify.app/
    const all = ["#87c3ca", "#7b7377", "#b2475d", "#7d3e3e", "#eb7f64", "#d9c67a", "#f3f2f2"];
    return {
        all, //the loose colours
        bases: [0, 2, 4, 5].map((ix) => all[ix]),
        skyBackground: 20,
        landBackground: 20,
    };
}

function createShip(palette) {
    return {
        pos: createVector(width / 2, height / 2),
        vel: createVector(0, 0),
        height: 30,
        facing: -PI / 2,
        desiredFacing: -PI / 2,
        fuel: 1,
        thrustColour: palette.all[2],
        colour: palette.skyBackground, //arr[5]
    };
}

function snapTo(val, increment) {
    return round(val / increment) * increment;
}

function createLandingPads(palette) {
    const createOneLandingPad = ({ frac, name, colour }) => ({
        leftX: snapTo(frac * width, config.xStep),
        width: config.padWidth,
        colour,
        fuel: 4,
        maxFuel: 4,
        name,
    });

    const baseNames = shuffle(
        "Able Baker Charlie Dog Echo Fox Inigo Lima Oscar Patel Tango Shiffman Whiskey".split(" ")
    );
    const colours = shuffle([...palette.bases]);

    const basePositionFractions = random([
        [0.2, 0.8],
        [0.2, 0.4, 0.8],
    ]);
    return zipWith(baseNames, basePositionFractions, (name, frac, ix) =>
        createOneLandingPad({
            name,
            frac,
            colour: colours[ix % colours.length],
        })
    );
}

function zipWith(arrA, arrB, joinFn) {
    const outputs = [];
    const shorterLen = min(arrA.length, arrB.length);
    for (let ix = 0; ix < shorterLen; ix++) {
        const newElem = joinFn(arrA[ix], arrB[ix], ix);
        outputs.push(newElem);
    }
    return outputs;
}

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
        pt.colour = nearPad ? "red" : "green";
        pts.push(pt);
    }

    return {
        points: pts,
        landingPads,
    };
}

function isNearAnyLandingPad(x, landingPads) {
    return landingPads.some((pad) => isNearLandingPad(x, pad));
}

function landingPadAtXOrNull(x) {
    return world.terrain.landingPads.find((pad) => isNearLandingPad(x, pad)) ?? null;
}

function isNearLandingPad(x, pad) {
    return x >= pad.leftX && abs(x - pad.leftX) <= pad.width;
}

function spawnPosition() {
    return createVector(100, 50);
}

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

function isUnderTerrain(ship) {
    const clearance = calcGroundClearance(ship);
    return clearance < -5;
}

function collect(n, fn) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(fn(i));
    }
    return arr;
}
function drawOtherMoon() {
    const { x, y, radius: radiusMain, colour, shadowColour } = defaultOtherMoonData();

    if (!config.drawSunAsLines) {
        push();
        fill(world.palette.skyBackground);
        stroke(colour);
        strokeWeight(1);
        circle(x, round(y), radiusMain * 2);
        pop();
        return;
    }

    push();
    translate(x, round(y));

    //fill in background to obscure stars, etc
    fill(world.palette.skyBackground);
    noStroke();
    circle(0, 0, radiusMain * 2);
    strokeWeight(1);

    const shadowCentreX = -world.moonShadowFraction * radiusMain;
    const shadowRadius = radiusMain;

    const yStep = radiusMain / 5;
    for (let yOff = -radiusMain + yStep / 2; yOff <= radiusMain; yOff += yStep) {
        const chLen = lengthOfCircleChord(radiusMain, yOff);

        const shadowLineLength = lengthOfCircleChord(shadowRadius, yOff);
        const shadowEndX = constrain(shadowCentreX + 0.5 * shadowLineLength, -chLen / 2, chLen / 2);
        const shadowStartX = -chLen / 2; //always on LHS of body
        stroke(shadowColour);
        line(shadowStartX, round(yOff), shadowEndX, round(yOff));
        stroke(colour);
        line(shadowEndX, round(yOff), chLen / 2, round(yOff));
    }
    pop();
}

function drawSunWithHorizontalLines() {
    const { x, y, radius, colour } = defaultSunData();
    push();

    translate(x, round(y));
    // to hide whatever's in background (stars, etc)
    noStroke();
    fill(world.palette.skyBackground);
    circle(0, 0, radius * 2);

    stroke(colour);
    strokeWeight(1);
    const yStep = radius / 8;
    for (let yOff = -radius + yStep / 2; yOff <= radius; yOff += yStep) {
        const l = lengthOfCircleChord(radius, yOff);
        line(-l / 2, round(yOff), l / 2, round(yOff));
    }
    pop();
}

function drawSunOutline() {
    const { x, y, radius, colour } = defaultSunData();
    push();
    translate(x, round(y));
    fill(world.palette.skyBackground);
    stroke(colour);
    circle(0, 0, radius * 2);
    pop();
}

function defaultOtherMoonData() {
    const orbitR = min(width, height) / 2;
    const t =
        1.7 * PI +
        -1 * map((millis() / 90000) % TWO_PI, 0, TWO_PI, 0.1 * TWO_PI, 0.9 * TWO_PI, true);

    const x = width / 2 + width * 0.4 * sin(t);
    const y = height / 2 + orbitR * cos(t);

    const radius = 60;

    return { x, y, radius, colour: world.palette.all[4], shadowColour: world.palette.all[3] };
}

function defaultSunData() {
    const x = width * 0.6;
    const y = round(getHeightAt(x) + frameCount / 100);
    const radius = 100;
    const colour = world.palette.all[4];
    return { x, y, radius, colour };
}

function lengthOfCircleChord(radius, y) {
    return 2 * sqrt(radius * radius - y * y);
}
function keyPressed() {
    if (key === "r") {
        restart();
    }
    if (key === "p") {
        togglePause();
    }

    if (key === "w") {
        toggleConfigBoolean("windEnabled", "wind");
    }

    if (key === "h") {
        postInstructionalMessages({ all: true });
    }

    if (key === "d") {
        toggleConfigBoolean("debugMessagesEnabled", "debug messages");
    }

    if (key === "m") {
        clearMessages();
    }

    if (key === "s") {
        toggleConfigBoolean("screenShakeEnabled", "screen-shake");
    }

    if (key === "a") {
        toggleConfigBoolean("starsEnabled", "stars");
    }

    if (key === "l") {
        toggleConfigBoolean("drawSunAsLines", "draw sun as lines");
    }

    if (key === "c") {
        toggleConfigBoolean("rainbowWindEnabled", "rainbow-wind");
    }

    if (key === "e") {
        console.log({ seed: config.seed });
    }

    if (key === "x") {
        cheatSetShipForEasyLanding(world.ship);
    }

    if (key === "z") {
        toggleZenMode();
    }
}
function zenModePropertyKeys() {
    return ["windEnabled", "debugMessagesEnabled", "starsEnabled"];
}

function saveConfigForZenMode() {
    const backup = [];
    for (let key of zenModePropertyKeys()) {
        backup[key] = config[key];
    }
    return backup;
}

function toggleZenMode() {
    config.zenModeEnabled = !config.zenModeEnabled;
    if (config.zenModeEnabled) {
        config.zenModeBackup = saveConfigForZenMode();
        let delay = 0;
        for (let key of zenModePropertyKeys()) {
            setTimeout(() => (config[key] = false), delay);
            delay += 500;
        }
        setTimeout(clearMessages, delay);
    } else {
        restoreConfigAfterZenMode();
    }
}

function restoreConfigAfterZenMode() {
    let delay = 0;
    for (let key of [...zenModePropertyKeys()].reverse()) {
        const savedVal = config.zenModeBackup[key];
        if (savedVal !== undefined) {
            setTimeout(() => (config[key] = savedVal), delay);
            delay += 500;
        }
    }
}
function clearMessages() {
    world.messages = [];
}
function toggleConfigBoolean(key, label) {
    config[key] = !config[key];
    const desc = config[key] ? "enabled" : "disabled";
    postMessage(label + " " + desc);
}

function postInstructionalMessages({ all } = { all: false }) {
    const coreMessages = [
        "left & right arrows to rotate",
        "up arrow to thrust",
        "'r' to restart / regenerate",
        "'w' to toggle wind",
        "'z' for zen mode",
        "'h' for fuller help",
    ];

    const otherMessages = [
        "'p' to pause",
        "'c' to toggle rainbow wind",
        "'l' to toggle sun as lines",
        "'d' to toggle debug text",
        "'m' to clear these messages",
    ];
    const msgs = [...coreMessages, ...(all ? otherMessages : [])];

    const spacingMs = 1000;
    const duration = 10000;
    let delayMs = 0;
    for (let msg of msgs) {
        postMessageLater(msg, delayMs, duration);
        delayMs += spacingMs;
    }
}

function postMessageLater(str, delay, durationMs) {
    return setTimeout(() => postMessage(str, durationMs), delay);
}

function applyAnyScreenShake() {
    const angleSpeed = 0.05;
    const magSpeed = angleSpeed * 2;
    const maxDisplacement = 6;

    const angle = map(noise(frameCount * angleSpeed), 0.1, 0.9, 0, TWO_PI * 2, true);
    const mag =
        map(noise(2000 + frameCount * magSpeed), 0.1, 0.9, -1, 1, true) *
        maxDisplacement *
        world.screenShakeAmt;
    const offset = p5.Vector.fromAngle(angle, mag);
    translate(offset.x, offset.y);
}
function updateAnyScreenShake() {
    world.screenShakeAmt = constrain(world.screenShakeAmt - 0.01, 0, 1);
}

function cheatSetShipForEasyLanding(ship) {
    const pad = random(world.terrain.landingPads);
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

function formatMillisecondsToMMSS(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (val) => val.toString().padStart(2, "0");
    return [minutes, seconds].map(pad).join(":");
}

function togglePause() {
    if (isLooping()) {
        noLoop();
    } else {
        loop();
    }
}

function focusCanvasOnce() {
    //Only for openprocessing, doing this on earlier frames doesn't reliably work -
    // perhaps it's taking the focus away when loading the sketch?
    if (frameCount === 30) {
        p5Canvas.elt.focus();
    }
}
