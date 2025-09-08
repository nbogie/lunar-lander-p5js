function drawBall(b) {
    push();
    noFill();
    stroke(255);
    circle(b.position.x, b.position.y, 2 * b.circleRadius);

    pop();
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
