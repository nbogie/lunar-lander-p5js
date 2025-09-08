/**
 * @typedef {Object} Cam
 * @property {number} desiredScale
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
        isZooming: false,
    };
}
function updateCam() {
    world.cam.desiredScale = world.cam.isZooming ? 2 : 1;

    world.cam.scale = lerp(world.cam.scale, world.cam.desiredScale, 0.1);
}

function calcScaledOffsetForFollowCam() {
    return createVector(width / 2, height / 2)
        .div(world.cam.scale)
        .sub(world.ship.pos);
}
