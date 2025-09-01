/*
	Lunar Lander #WCCChallenge "Pump"
	https://openprocessing.org/sketch/2711492
	
	A quick attempt at implementing a "lunar-lander"/"thrust" style game.	
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
// * incorporate deltaTime to support any frameRate
// * add pumping of oxygen or other gases or liquids?
// * switch to using a physics engine (e.g. matter.js Bodies.fromVertices)
// * use constraints to pick up and move cargo between locations
// * have some cavernous levels with a ceiling
// * incorporate ideas from infinite golf game
// * make wind visualisation more efficient (e.g. periodically spawn replacement short-lived wind particles across a loose grid to ensure coverage, rather than relying on coverage through large numbers)

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
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    postInstructionalMessages();
    restart();
    frameRate(60);
    // drawingContext.font = "24px 'Courier New', Courier, monospace";

    textFont("Courier New");
}

function restart() {
    config.seed = round(new Date());
    noiseSeed(config.seed);

    world = createWorld();
    respawnShip();
}

function draw() {
    background(world.palette.skyBackground);
    push();
    config.screenShakeEnabled && applyAnyScreenShake();
    updateShip();
    updateParticles();
    drawStarfield();
    drawDistantPlanet();
    if (config.windEnabled) {
        world.windParticles.forEach(updateWindParticle);
        drawWind();
    }
    drawTerrain();
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
    world.explosions = world.explosions.filter(
        (exp) => frameCount - exp.startFrame < 30
    );
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
        size: random(0.8, 1),
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
        const radius = map(
            abs(frameCount - explosion.startFrame - 15),
            0,
            30,
            40,
            10,
            true
        );
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
        t: "tilt " + degrees(getAngleFromLevel(world.ship)).toFixed(0),
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
    stroke(p.colour);
    strokeWeight(p.size);
    point(p.pos.x, p.pos.y);
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
        size: random(0.5, 1),
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
    return random(["rgba(195,228,242)", "rgba(211,211,211)"]);
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
    fill(world.palette.landBackground);
    stroke(world.palette.arr[6]);

    // push()
    // strokeWeight(5)
    // for (let x = 0; x < width; x += 5) {
    // 	const y = getHeightAt(x);
    // 	point(x, y)
    // }
    // pop()

    beginShape();
    for (let pt of world.terrain.points) {
        vertex(pt.x, pt.y);
        // push()
        // strokeWeight(10)
        // stroke(pt.colour)
        // point(pt.x, pt.y)
        // pop()
    }
    vertex(width + 50, height + 50);
    vertex(-50, height + 50);
    strokeWeight(1);
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

function drawShip(ship) {
    function drawBooster() {
        rect(-8, 0, 5, 5);
    }

    push();
    translate(ship.pos);
    drawShipOverlay(ship);
    rotate(ship.facing);
    stroke(255);
    fill(ship.colour);
    rectMode(CENTER);
    rect(0, 0, ship.height, ship.height * 1.5);
    fill(150);
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

function updateShip() {
    if (world.state.type === "landed") {
        if (world.ship.fuel < 1) {
            const pad = landingPadAtXOrNull(world.ship.pos.x);
            const amtTransferred = config.refuelPerTick; // * deltaTime;
            world.ship.fuel = constrain(world.ship.fuel + amtTransferred, 0, 1);
            pad.fuel = constrain(pad.fuel - amtTransferred, 0, pad.maxFuel);
            if (world.ship.fuel >= 1) {
                postMessage("Refuelling complete.");
            }
        }
    }

    if (keyIsDown(UP_ARROW)) {
        if (world.ship.fuel > 0) {
            const thrustVec = p5.Vector.fromAngle(
                world.ship.facing,
                config.thrust
            );
            world.ship.vel.add(thrustVec);
            world.ship.fuel -= config.fuelUsedPerTick;
            world.particles.push(
                createThrustParticle(
                    world.ship.pos,
                    thrustVec
                        .copy()
                        .rotate(randomGaussian(PI, PI / 20))
                        .setMag(0.9)
                )
            );
            if (world.state.type === "landed") {
                world.state = {
                    type: "flying",
                };
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

    if (isUnderTerrain(world.ship.pos)) {
        //todo: spawn an explosion at crash site
        spawnExplosion(world.ship.pos.copy());
        respawnShip();
        world.screenShakeAmt = 1;
        postMessage("cause of crash: " + landingCheck.reason + ".");
    }
}

function createWindAt(pos) {
    if (!config.windEnabled) {
        return 0;
    }
    const MAX_WIND_SPEED = 0.01;
    const noiseAtPos = noise(
        5000 + pos.x / 1000,
        3000 + pos.y / 100,
        frameCount / 500
    );
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
    world.messages = world.messages.filter(
        (m) => millis() < m.postTime + m.durationMs
    );
}

function drawMessages() {
    push();
    translate(width - 50, 50);
    for (let m of world.messages) {
        textSize(20);
        textAlign(RIGHT);
        noStroke();
        fill("white");
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
    const distAboveGround = getHeightAt(ship.pos.x) - ship.pos.y;
    if (ship.vel.y > 0.7) {
        return {
            result: false,
            type: "warning",
            reason: "descent too fast",
        };
    }

    if (!isShipLevel(ship)) {
        return {
            result: false,
            type: "warning",
            reason: "not level",
        };
    }

    if (distAboveGround > -2 && distAboveGround < 10) {
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

function getAngleFromLevel(ship) {
    return ship.facing + PI / 2;
}

function isShipLevel(ship) {
    return abs(getAngleFromLevel(ship)) < PI / 5;
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
    postMessage("Landed at " + pad.name + " base.");
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
    return {
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
    };
}

function createPalette() {
    // Kjetil Golid's "Tundra3" https://chromotome-quicker.netlify.app/
    const arr = [
        "#87c3ca",
        "#7b7377",
        "#b2475d",
        "#7d3e3e",
        "#eb7f64",
        "#d9c67a",
        "#f3f2f2",
    ];
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
        height: 20,
        facing: -PI / 2,
        desiredFacing: -PI / 2,
        fuel: 1,
        colour: palette.skyBackground, //arr[5]
    };
}
// 110 should snap to 120 for 30 and 40
// 110/30 = 3.66 round to 4.  4 * 30 = 120
// 110/40 = 2.75 round to 3. 3 * 40 = 120
function snapTo(val, increment) {
    return round(val / increment) * increment;
}

function createLandingPads(palette) {
    const createOnePad = ({ frac, name }) => ({
        leftX: snapTo(frac * width, config.xStep),
        width: config.padWidth,
        colour: random(palette.arr),
        fuel: 4,
        maxFuel: 4,
        name,
    });

    const baseNames = shuffle("Bravo Charlie Dog Lima".split(" "));
    return zipWith(baseNames, [0.2, 0.8], (name, frac) =>
        createOnePad({
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
    for (let x = -config.xStep; x < width + 50; x += config.xStep) {
        const noiseY = map(
            noise(2000 + x / 300),
            0.15,
            0.85,
            height * 0.9,
            height * 0.3
        );
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
    return (
        world.terrain.landingPads.find((pad) => isNearLandingPad(x, pad)) ??
        null
    );
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

function isUnderTerrain(pos) {
    return pos.y > getHeightAt(pos.x);
}

function collect(n, fn) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(fn(i));
    }
    return arr;
}

function drawDistantPlanet() {
    const x = width * 0.6;
    const y = getHeightAt(x) + frameCount / 100;
    push();
    translate(x, y);
    fill(world.palette.skyBackground);
    stroke(world.palette.arr[4]);
    circle(0, 0, 200);
    pop();
}

function keyPressed() {
    if (key === "R" || key === "r") {
        restart();
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

    if (key === "s") {
        toggleConfigBoolean("screenShakeEnabled", "screen-shake");
    }
    if (key === "c") {
        toggleConfigBoolean("rainbowWindEnabled", "rainbow-wind");
    }
}

function toggleConfigBoolean(key, label) {
    config[key] = !config[key];
    const desc = config[key] ? "enabled" : "disabled";
    postMessage(label + " " + desc + ".");
}

function postInstructionalMessages() {
    const msgs = [
        "Arrows to rotate.",
        "up arrow to thrust.",
        "'R' to restart / regenerate.",
        "'w' to toggle wind.",
        "'c' to toggle rainbow wind.",
        "'d' to toggle debug text.",
        "'h' for help.",
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

    const angle = map(
        noise(frameCount * angleSpeed),
        0.1,
        0.9,
        0,
        TWO_PI * 2,
        true
    );
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
