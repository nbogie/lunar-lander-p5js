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
