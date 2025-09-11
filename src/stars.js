function drawStarfield() {
    world.stars.forEach(drawStar);
}

/**
 * @typedef {Object} Star
 * @property {p5.Vector} pos
 * @property {p5.Color} colour
 * @property {number} size
 */

/**
 * @returns {Star[]}
 */
function createStarfield() {
    return collect(100, createStar);
    //todo: prune stars lower than terrain?
}

/**
 * @returns {Star}
 */
function createStar() {
    return {
        colour: color(random() > 0.93 ? random(["skyblue", "pink"]) : 255),
        size: random(0.4, 1),
        pos: createVector(random(-0.5, 1.5) * width, random(-0.5, 1) * height),
    };
}

/**
 * @param {Star} star
 */
function drawStar(star) {
    push();
    stroke(star.colour);
    strokeWeight(1);
    translate(star.pos.x, star.pos.y);
    scale(star.size);
    line(-3, 0, 3, 0);
    line(0, -3, 0, 3);
    pop();
}
