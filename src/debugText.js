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
