/**
 * @param {number} x
 * @param {LandingPad[]} landingPads
 */
function isNearAnyLandingPad(x, landingPads) {
    return landingPads.some((pad) => isWithinLandingPad(x, pad));
}

/**
 * @param {number} x
 */
function landingPadAtXOrNull(x) {
    return world.terrain.landingPads.find((pad) => isWithinLandingPad(x, pad)) ?? null;
}

function nearestLandingPad(x) {
    return minBy(world.terrain.landingPads, (p) => distanceToLandingPad(p, x));
}
/**
 * @param {number} x
 * @param {LandingPad} pad
 */
function distanceToLandingPad(pad, x) {
    return abs(pad.centreX - x);
}
/**
 * @param {number} x
 * @param {LandingPad} pad
 */
function isWithinLandingPad(x, pad) {
    return x >= pad.leftX && x <= pad.leftX + pad.width;
}

/**
 * @typedef {Object} LandingPad
 * @property {number} leftX - world-space x of left-most edge of pad
 * @property {number} width
 * @property {number} centreX - world-space x of centre of pad
 * @property {p5.Color} colour - colour of the base (might be a string or number or Color object)
 * @property {number} fuel - current fuel
 * @property {number} maxFuel
 * @property {string} name
 */

/**
 * @param {Palette} palette
 * @returns {LandingPad[]}
 */
function createLandingPads(palette) {
    /**
     * @returns {LandingPad}
     */
    function createOneLandingPad({ frac, name, colour }) {
        const leftX = snapTo(frac * width, config.xStep);
        const padWidth = config.padWidth;
        const centreX = leftX + padWidth / 2;

        return {
            leftX,
            centreX,
            width: padWidth,
            colour,
            fuel: 4,
            maxFuel: 4,
            name,
        };
    }

    const baseNames = shuffle(
        "Able Baker Charlie Dog Echo Fox Inigo Lima Oscar Patel Reynolds Tango Shiffman Whiskey".split(
            " "
        )
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

function drawLandingPadExtras() {
    for (let pad of world.terrain.landingPads) {
        drawLandingPadFuelTank(pad);
        // drawLandingPadFlagAt(pad.leftX);
        // drawLandingPadFlagAt(pad.leftX + pad.width);

        drawLandingPadPlatform(pad);
        drawLandingPadLabel(pad);
    }
}
/**
 * @param {LandingPad} pad
 */
function drawLandingPadLabel(pad) {
    push();
    const x = pad.leftX + pad.width / 2;
    translate(x, getHeightAt(x) + 20);
    textAlign(CENTER, TOP);
    fill("white");
    noStroke();
    textSize(12);
    text(pad.name, 0, 0);
    pop();
}

/**
 * @param {LandingPad} pad
 */
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

/**
 * @param {LandingPad} pad
 */
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

/**
 * @param {number} x
 */
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

function snapTo(val, increment) {
    return round(val / increment) * increment;
}
