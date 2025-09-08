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
    
    Slow frame-rate?  
    If you're getting a frame rate below 60FPS, consider disabling wind with 'w' - wind is the main burden.
    (You can also enter zen mode with 'z')
    
    Credits: Palette is "Tundra3" from Kjetil Golid's chromotome collection https://chromotome-quicker.netlify.app/ and https://github.com/kgolid
    
    See all challenge submissions: 
    https://openprocessing.org/curation/78544

    Join the Birb's Nest Discord for friendly creative coding community
    and future challenges and contributions: https://discord.gg/S8c7qcjw2b
   
    
*/

/** @type {World} */
let world;

/** @type {Config} */
let config;

/** Saved only to allow setting focus once the underlying canvas is ready. Seems necessary for openprocessing. */
let p5Canvas;

function setup() {
    config = createConfig();
    const mainCanvasHeight =
        config.matter.enabled && config.matter.debugRendererEnabled
            ? windowHeight / 2
            : windowHeight;
    p5Canvas = createCanvas(windowWidth, mainCanvasHeight);

    config.matter.enabled && setupMatterJS();
    frameRate(60);
    textFont("Courier New");

    postFlavourMessages();
    // postInstructionalMessages();

    restart();
}

function restart() {
    //e.g. config.seed = 1756680251196;
    config.seed = round(new Date().getMilliseconds());
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

    updateCam();

    scale(world.cam.scale);

    if (world.cam.isZooming) {
        const offset = calcScaledOffsetForFollowCam();
        translate(offset.x, offset.y);
    }

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
    drawLastLandingCheckWarning(world.ship);

    world.explosions.forEach(drawExplosion);
    drawMessages();

    config.debugMessagesEnabled && drawDebugText();
    pop(); //end effect of screenshake

    updateExplosions();
    updateAnyScreenShake();
    updateMessages();
}

function isFrameRateSlow(expectedRate, tolerance) {
    return frameRate() < expectedRate * (1 - tolerance);
}

function drawDebugText() {
    push();
    const str = JSON.stringify(world.ship.state);

    /** @type {Array<{t: string, colour?: number|string}>} */
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
        colour: colourForFuelMsg,
    });

    outputs.push({
        t: "tilt " + degrees(getTiltAngle(world.ship)).toFixed(0),
    });

    outputs.push({
        t: composeVerticalSpeedMessage(),
    });
    outputs.push({
        t: composeHorizontalSpeedMessage(),
    });

    outputs.push({
        t: world.ship.stuntMonitor.log.length + " stunt(s)",
    });
    outputs.push({
        t: composeLocatorMessage(),
    });

    translate(200, 50);
    for (let { t, colour } of outputs) {
        // @ts-ignore
        fill(colour ?? 255);
        noStroke();
        textSize(18);
        text(t, 0, 0);
        translate(0, 25);
    }
    pop();
}

function composeLocatorMessage() {
    const pos = world.ship.pos;
    let xIndicator = "><";
    if (pos.x < 0 || pos.x > width) {
        const multiple = 1 + floor(abs((3 * pos.x) / width));
        const symbol = pos.x < 0 ? "<" : ">";
        xIndicator = symbol.repeat(multiple);
    }
    let yIndicator = "-";
    if (pos.y < 0) {
        const multiple = 1 + floor(abs((2 * pos.y) / height));
        yIndicator = "^".repeat(multiple);
    }
    return xIndicator + " " + yIndicator;
}
function composeHorizontalSpeedMessage() {
    const val = world.ship.vel.x;
    let emoji = "0️⃣";
    if (val < 0) {
        //left arrow emoji
        emoji = "⬅️";
    } else if (val > 0) {
        emoji = "➡️";
    }
    return "h speed " + emoji + " " + world.ship.vel.x.toFixed(1);
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

function snapTo(val, increment) {
    return round(val / increment) * increment;
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
    if (key === "2") {
        toggleZoom();
    }
    if (key === "q") {
        save("lunar-lander-screenshot");
    }
}

function toggleZoom() {
    world.cam.isZooming = !world.cam.isZooming;
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

function toggleConfigBoolean(key, label) {
    config[key] = !config[key];
    const desc = config[key] ? "enabled" : "disabled";
    postMessage(label + " " + desc);
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
