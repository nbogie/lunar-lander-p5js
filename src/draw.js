function draw() {
    focusCanvasOnce();
    background(world.palette.skyBackground);
    push();

    updateCam();

    scale(world.cam.scale);

    if (world.cam.isZooming) {
        const offset = calcScaledOffsetForFollowCam();
        translate(round(offset.x), round(offset.y)); //TODO: always round, or only at scale 1 where we round up to pixel units?
    }

    config.screenShakeEnabled && applyAnyScreenShake();
    updateShip(world.ship);
    updateFuelTanks();

    updateParticles();
    updateProjectiles();
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
    !config.disableOldTerrain && drawTerrain();
    config.drawNewTerrainEnabled && drawNewTerrain();

    world.newTerrain.fuelTanks.forEach(drawFuelTank);

    drawMapEditorWorldSpaceUI();

    if (config.matter.enabled) {
        world.bodies.forEach(drawBall);
    }

    drawThrustParticles();
    drawProjectiles();
    drawShip(world.ship);
    drawLastLandingCheckWarning(world.ship);

    world.explosions.forEach(drawExplosion);

    pop(); //end effect of screenshake
    config.debugMessagesEnabled && drawDebugText();
    drawMapEditorScreenSpaceUI();
    drawMessages();

    updateExplosions();
    updateAnyScreenShake();
    updateMessages();
}
