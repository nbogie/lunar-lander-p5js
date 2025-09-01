"use strict";
/*
	Lunar Lander #WCCChallenge "Pump"
	https://openprocessing.org/sketch/2711492
    
    See also WIP matter.js branch at https://github.com/nbogie/lunar-lander-p5js

	This is a quick attempt at implementing a "lunar-lander"/"thrust" style game.
	So far, the pump theme isn't very strong in this one, but I though i'd submit for fun as I did write it for the challenge. 
	
	Currently, there's: 
	* fuel pumped from the tank to the ship,
	* association with the winds that blow across the moon
			(I can't decide how much atmosphere is, here!)
	
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
// * switch to using a physics engine (e.g. matter.js Bodies.fromVertices)
// * use constraints to pick up and move cargo between locations
// * have some cavernous levels with a ceiling
// * incorporate ideas from infinite golf game
// * make wind visualisation more efficient (e.g. periodically spawn replacement short-lived wind particles across a loose grid to ensure coverage, rather than relying on coverage through large numbers)

const Engine = Matter.Engine,
    Runner = Matter.Runner,
    Composites = Matter.Composites,
    Composite = Matter.Composite,
    Common = Matter.Common,
    Bodies = Matter.Bodies;

/** matter.js engine */
let engine;

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
    debugMessagesEnabled: true,
    rainbowWindEnabled: false,
    drawSunAsLines: false,
    matter: {
        enabled: false,
        debugRendererEnabled: true,
    }, //needs restart
};

function setupMatterJS() {
    engine = Engine.create();
    config.matter.debugRendererEnabled && setupMatterJSDebugRenderer();
    var runner = Runner.create();
    Runner.run(runner, engine);
}

function setupMatterJSDebugRenderer() {
    const renderFn = Matter.Render.create({
        element: document.body,
        engine: engine,
        options: {
            width,
            height,
        },
    });
    Matter.Render.run(renderFn);
}

function setup() {
    const mainCanvasHeight =
        config.matter.enabled && config.matter.debugRendererEnabled
            ? windowHeight / 2
            : windowHeight;
    createCanvas(windowWidth, mainCanvasHeight);

    config.matter.enabled && setupMatterJS();
    frameRate(60);
    textFont("Courier New");
    postInstructionalMessages();
    restart();
}

function createInitialPhysicsBodies(world) {
    const bodyOptions = {
        frictionAir: 0,
        friction: 0.0001,
        restitution: 0.6,
    };
    const starBodies = world.stars.map((star) => Bodies.circle(star.pos.x, 0, 10, bodyOptions));
    const terrainBody = createBodyForTerrain(world);
    const allBodies = [...starBodies, terrainBody];
    Composite.add(engine.world, allBodies);
    return allBodies;
}

function createBodyForTerrain(world) {
    //if poly-decomp is loaded by the browser (with a script tag), a global variable "decomp" will be available
    Common.setDecomp(decomp);
    //or for other packaging methods
    // Common.setDecomp(require("poly-decomp"));
    const verticesFromTerrain = world.terrain.points.map(({ x, y }) => ({
        x,
        y,
    }));

    const yMax = height + 200;
    const leftmostY = verticesFromTerrain.at(0).y;
    const rightmostY = verticesFromTerrain.at(-1).y;

    const vertexSets = [
        [
            ...verticesFromTerrain,
            //add vertices to complete an area that extends beyond the screen bounds
            { x: width + 100, y: rightmostY },
            { x: width + 100, y: yMax },
            //generate a line of extra vertices along the bottom, in case this helps the polygon decomposition.
            ...[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((d) => ({
                x: width * (d / 10),
                y: yMax,
            })),
            { x: -100, y: yMax },
            { x: -100, y: leftmostY },
        ],
    ];

    const terrainBody = Bodies.fromVertices(
        0,
        0,
        vertexSets,
        {
            isStatic: true,
        },
        true
    );

    // Correct the position of the terrain body
    const lowestYVal = min(vertexSets[0].map((pt) => pt.y));
    const lowestXVal = min(vertexSets[0].map((pt) => pt.x));
    const targetPositionX = lowestXVal; // The x-coordinate for the terrain's  desired top-left corner
    const targetPositionY = lowestYVal;

    // Use Matter.Body.setPosition to move the body
    Matter.Body.setPosition(terrainBody, {
        x: terrainBody.position.x - (terrainBody.bounds.min.x - targetPositionX),
        y: terrainBody.position.y - (terrainBody.bounds.min.y - targetPositionY),
    });

    console.log("num parts in terrain: " + terrainBody.parts.length);
    if (!terrainBody) {
        throw new Error(
            "Unexpected falsy terrain body - perhaps the vertices could not be decomposed into convex bodies?"
        );
    }
    return terrainBody;
}
function restart() {
    //config.seed = 1756680251196;
    config.seed = round(new Date());
    console.log({ seed: config.seed });
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
    background(world.palette.skyBackground);
    push();
    config.screenShakeEnabled && applyAnyScreenShake();
    updateShip();
    updateParticles();
    drawStarfield();
    if (config.drawSunAsLines) {
        drawSunOutline();
    } else {
        drawSunWithHorizontalLines();
    }
    if (config.windEnabled) {
        world.windParticles.forEach(updateWindParticle);
        drawWind();
    }
    drawTerrain();
    world.bodies.forEach(drawBall);
    drawParticles();
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

function createThrustParticle(pos, vel) {
    return {
        pos: pos.copy(),
        vel: vel.copy(),
        isDead: false,
        startFrame: frameCount,
        maxAge: random(60, 120),
        colour: random(world.palette.arr),
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
    const str = JSON.stringify(world.state);
    const outputs = [];
    outputs.push({
        t: "FPS " + frameRate().toFixed(0),
        colour: isFrameRateSlow(60, 0.1) ? "red" : "white",
    });
    outputs.push({
        t: "state: " + str,
    });

    let colour = world.ship.fuel < 0.15 && frameCount % 30 < 15 ? 50 : 255;

    outputs.push({
        t: "fuel " + (world.ship.fuel * 100).toFixed(1) + "%",
        colour,
    });

    outputs.push({
        t: "tilt " + degrees(getTiltAngle(world.ship)).toFixed(0),
    });

    outputs.push({
        t: composeVerticalSpeedMessage(),
    });

    outputs.push({
        t: "seed " + config.seed,
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

function drawParticles() {
    world.particles.forEach(drawParticle);
}

function drawParticle(p) {
    push();
    fill(p.colour);
    noStroke();
    rectMode(CENTER);
    square(p.pos.x, p.pos.y, p.size);
    pop();
}

function createWindParticles() {
    return collect(config.numWindParticles, createWindParticle);
}

function createWindParticle() {
    const pos = createVector(random(width), random(height));

    return {
        pos,
        vel: createWindAt(pos),
        size: 1,
        colour: generateSubtleWindColour(),
        rainbowColour: generateRainbowWindColour(),
    };
}

function generateRainbowWindColour() {
    push();
    colorMode(HSB);
    const colour = color(random(360), 80, 100);
    pop();
    return colour;
}

function generateSubtleWindColour() {
    return random([150, 100]);
}

function drawWindParticle(p) {
    const strength = createWindAt(p.pos);
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
    stroke(world.palette.arr[6]);

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
    fill(world.palette.arr[0]);
    triangle(0, 0, flagWidth, 5, 0, 10);
    pop();
}

function drawShip(ship) {
    function drawBooster() {
        rect(-8, 0, 5, 5);
    }

    const mainBodyHeight = ship.height * 0.8;

    push();
    translate(ship.pos);
    drawShipOverlay(ship);
    rotate(ship.facing);

    stroke(255);
    fill(ship.colour);
    noFill();
    rectMode(CENTER);
    rect(0, 0, mainBodyHeight * 0.8, mainBodyHeight);

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
    fill(100);
    stroke("white");
    strokeWeight(0.5);
    const fullW = 20;
    const h = 2;
    translate(-fullW / 2, 0);
    rectMode(CORNER);
    rect(0, 0, fullW, h);
    const fuelW = ship.fuel * fullW;
    fill("cyan");
    noStroke();
    rect(0, 0, fuelW, h);

    // text("F:" + ((ship.fuel * 100).toFixed(1)) + "%", 0, 0)
}

function updateShip() {
    if (world.state.type === "landed") {
        if (world.ship.fuel < 1) {
            const pad = landingPadAtXOrNull(world.ship.pos.x);
            const amtTransferred = config.refuelPerTick; // * deltaTime;
            world.ship.fuel = constrain(world.ship.fuel + amtTransferred, 0, 1);
            pad.fuel = constrain(pad.fuel - amtTransferred, 0, pad.maxFuel);
            if (world.ship.fuel >= 1) {
                postMessage("Refuelling complete");
            }
        }
    }
    let tookOffThisFrame = false;

    if (keyIsDown(UP_ARROW)) {
        if (world.ship.fuel > 0) {
            fireThrusters();
            if (world.state.type === "landed") {
                world.state = {
                    type: "flying",
                };
                const pad = landingPadAtXOrNull(world.ship.pos.x);
                postMessage("Lift off from " + pad.name + " base");
                tookOffThisFrame = true;
            }
        }
    }

    if (world.state.type !== "landed") {
        if (keyIsDown(LEFT_ARROW)) {
            world.ship.desiredFacing -= config.turnSpeed;
        }

        if (keyIsDown(RIGHT_ARROW)) {
            world.ship.desiredFacing += config.turnSpeed;
        }
    }

    world.ship.facing = lerp(world.ship.facing, world.ship.desiredFacing, 0.1);

    if (world.state.type === "landed") {
        return;
    }

    const gravity = createVector(0, 1).mult(config.gravity);
    if (config.windEnabled) {
        const windSpeed = createWindAt(world.ship.pos);
        world.ship.vel.x += windSpeed;
    }
    world.ship.vel.add(gravity);
    world.ship.pos.add(world.ship.vel);

    if (!tookOffThisFrame) {
        const landingCheck = checkIsOkForLanding(world.ship);
        if (landingCheck.result) {
            setLandedShip(world.ship);
            return;
        }

        if (landingCheck.type === "warning") {
            push();
            fill(world.palette.arr[5]);
            noStroke();
            textSize(18);
            text(landingCheck.reason, 200, 200);
            pop();
        }

        if (isUnderTerrain(world.ship)) {
            //todo: spawn an explosion at crash site
            spawnExplosion(world.ship.pos.copy());
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
                    .setMag(1.5)
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
    if (world.state.type !== "flying") {
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
    return normalizeRotationAsTilt(ship.facing + PI / 2);
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
    world.state = {
        type: "landed",
    };
    ship.vel = createVector(0, 0);
    ship.pos.y = getHeightAt(ship.pos.x) - ship.height / 2;
    setShipUprightImmediately(ship);
    //(no immediate refuel)

    const pad = landingPadAtXOrNull(ship.pos.x);
    postMessage("Landed at " + pad.name + " base");
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
    world.state = {
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
        windParticles: createWindParticles(),
        stars: createStarfield(),
        messages: [],
        palette,
        screenShakeAmt: 0,
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
    const arr = ["#87c3ca", "#7b7377", "#b2475d", "#7d3e3e", "#eb7f64", "#d9c67a", "#f3f2f2"];
    return {
        arr, //the loose colours
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
        colour: palette.skyBackground, //arr[5]
    };
}

function snapTo(val, increment) {
    return round(val / increment) * increment;
}

function createLandingPads(palette) {
    const createOneLandingPad = ({ frac, name }) => ({
        leftX: snapTo(frac * width, config.xStep),
        width: config.padWidth,
        colour: random(palette.arr),
        fuel: 4,
        maxFuel: 4,
        name,
    });

    const baseNames = shuffle(
        "Able Baker Charlie Dog Easy Fox Lima Oscar Shiffman Whiskey".split(" ")
    );
    return zipWith(baseNames, [0.2, 0.8], (name, frac) =>
        createOneLandingPad({
            name,
            frac,
        })
    );
}

function zipWith(arrA, arrB, joinFn) {
    const outputs = [];
    const shorterLen = min(arrA.length, arrB.length);
    for (let ix = 0; ix < shorterLen; ix++) {
        const newElem = joinFn(arrA[ix], arrB[ix]);
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

function drawSunWithHorizontalLines() {
    const x = width * 0.6;
    const y = getHeightAt(x) + frameCount / 100;
    push();
    translate(x, round(y));
    const radius = 100;
    fill(world.palette.skyBackground);
    noStroke();
    // stroke(world.palette.arr[4]);
    circle(0, 0, radius * 2);
    const yStep = radius / 8;
    for (let yOff = -radius + yStep / 2; yOff <= radius; yOff += yStep) {
        const l = lengthOfCircleArc(radius, yOff);
        stroke(world.palette.arr[4]);
        strokeWeight(1);
        line(-l / 2, round(yOff), l / 2, round(yOff));
    }
    pop();
}

function drawSunOutline() {
    const x = width * 0.6;
    const y = getHeightAt(x) + frameCount / 100;
    push();
    translate(x, round(y));
    const radius = 100;
    fill(world.palette.skyBackground);
    stroke(world.palette.arr[4]);
    circle(0, 0, radius * 2);
    pop();
}
function lengthOfCircleArc(radius, y) {
    return 2 * sqrt(radius * radius - y * y);
}
function keyPressed() {
    if (key === "R" || key === "r") {
        restart();
    }
    if (key === "p") {
        togglePause();
    }
    if (key === "l") {
        cheatSetShipForEasyLanding(world.ship);
    }

    if (key === "w") {
        toggleConfigBoolean("windEnabled", "wind");
    }

    if (key === "h") {
        postInstructionalMessages();
    }

    if (key === "d") {
        toggleConfigBoolean("debugMessagesEnabled", "debug messages");
    }
    if (key === "m") {
        world.messages = [];
    }

    if (key === "s") {
        toggleConfigBoolean("screenShakeEnabled", "screen-shake");
    }

    if (key === "L") {
        toggleConfigBoolean("drawSunAsLines", "draw sun as lines");
    }

    if (key === "c") {
        toggleConfigBoolean("rainbowWindEnabled", "rainbow-wind");
    }
}

function toggleConfigBoolean(key, label) {
    config[key] = !config[key];
    const desc = config[key] ? "enabled" : "disabled";
    postMessage(label + " " + desc);
}

function postInstructionalMessages() {
    const msgs = [
        "Arrows to rotate",
        "up arrow to thrust",
        "'R' to restart / regenerate",
        "'w' to toggle wind",
        "'c' to toggle rainbow wind",
        "'d' to toggle debug text",
        "'m' to clear messages",
        "'h' for help",
    ];
    let delayMs = 0;
    const spacingMs = 1500;
    const duration = 15000;
    for (let msg of msgs) {
        postDelayedMessage(msg, delayMs, duration);
        delayMs += spacingMs;
    }
}

function postDelayedMessage(str, delay, durationMs) {
    setTimeout(() => postMessage(str, durationMs), delay);
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
    world.state = {
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
