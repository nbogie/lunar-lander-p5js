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

function keyPressed() {
    //See also: ship controls ('a', 'd', 'w', and arrow keys) processed in updateShip

    if (key === "r") {
        restart();
    }
    if (key === "p") {
        togglePause();
    }

    if (key === "h" || key === "?") {
        postInstructionalMessages({ all: true });
    }

    if (key === "b") {
        toggleConfigBoolean("debugMessagesEnabled", "debug messages");
    }

    if (key === "c") {
        clearMessages();
    }

    if (key === "k") {
        toggleConfigBoolean("screenShakeEnabled", "screen-shake");
    }

    if (key === "1") {
        toggleZoom();
    }
    if (key === "2") {
        toggleConfigBoolean("windEnabled", "wind");
    }

    if (key === "3") {
        toggleConfigBoolean("rainbowWindEnabled", "rainbow-wind");
    }

    if (key === "4") {
        toggleConfigBoolean("starsEnabled", "stars");
    }

    if (key === "5") {
        toggleConfigBoolean("drawSunAsLines", "draw sun as lines");
    }

    if (key === "0" || key === "z") {
        toggleZenMode();
    }

    if (key === "e") {
        console.log({ seed: config.seed });
    }

    if (key === "x") {
        cheatSetShipForEasyLanding(world.ship);
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
