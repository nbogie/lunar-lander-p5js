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
    editor = createEditor(world);

    respawnShip();
}
