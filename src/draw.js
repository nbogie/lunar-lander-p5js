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
