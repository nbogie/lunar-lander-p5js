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
