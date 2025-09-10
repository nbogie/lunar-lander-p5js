/**
 * @typedef {Object} Cam
 * @property {number} desiredScale
 * @property {{pos:p5.Vector}|undefined} tracked
 * @property {number} scale
 * @property {boolean} isZooming
 */

/**
 * @returns {Cam}
 */
function createCam() {
    return {
        desiredScale: 1,
        scale: 1,
        tracked: undefined,
        isZooming: false,
    };
}
function updateCam() {
    // world.cam.desiredScale = world.cam.isZooming ? 2 : 1;

    world.cam.scale = lerp(world.cam.scale, world.cam.desiredScale, 0.1);
}

function calcScaledOffsetForFollowCam() {
    return createVector(width / 2, height / 2)
        .div(world.cam.scale)
        .sub(world.cam.tracked.pos);
}

function toggleZoomToShip() {
    world.cam.isZooming = !world.cam.isZooming;
    if (world.cam.isZooming) {
        world.cam.tracked = world.ship;
    }
}

function toggleMapEditorCamFollow() {
    world.cam.isZooming = !world.cam.isZooming;
    if (world.cam.isZooming) {
        world.cam.tracked = editor.camCentre;
        world.cam.desiredScale = 1;
    }
}
