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
