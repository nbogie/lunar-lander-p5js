/**
 * @typedef {Object} Editor
 * @property {"line"|"vertex"} selectionMode
 * @property {p5.Vector | null} selectedVertex
 * @property {LineSeg | null} selectedLineSeg
 * @property {p5.Vector|null} prevMousePos
 */
/**
 * @type {Editor} */
let editor = {
    selectionMode: "vertex",
    selectedVertex: null,
    selectedLineSeg: null,
    prevMousePos: null,
};

/**
 * @typedef {Object} LineSeg
 * @property {p5.Vector} a
 * @property {p5.Vector} b
 */

/**
 * @typedef {Object} NewTerrain
 * @property {LineSeg[]} lineSegs
 *
 */

function drawNewTerrain() {
    const { lineSegs } = world.newTerrain;
    push();
    strokeWeight(1);
    stroke("magenta");
    fill(world.palette.landBackground);
    beginShape();
    for (let seg of lineSegs) {
        vertex(seg.a.x, seg.a.y);
        vertex(seg.b.x, seg.b.y);

        if (seg === editor.selectedLineSeg) {
            push();
            strokeWeight(3);
            line(seg.a.x, seg.a.y, seg.b.x, seg.b.y);
            pop();
        }
    }
    endShape(CLOSE);

    //annotate vertices
    for (let seg of lineSegs) {
        push();
        const pt = seg.a;
        const isVertexSelected = pt === editor.selectedVertex;
        const isLineSegSelected = seg === editor.selectedLineSeg;

        translate(pt.x, pt.y);
        stroke(isLineSegSelected || isVertexSelected ? "yellow" : "magenta");
        circle(0, 0, 4);

        noStroke();
        textSize(14);
        fill("lime");
        const fx = (seg.a.x / width).toFixed(2);
        const fy = (seg.a.y / height).toFixed(2);
        text(`(${fx}, ${fy})`, 5, -5);
        pop();

        push();
        const mp = p5.Vector.lerp(seg.a, seg.b, 0.5);
        translate(mp.x, mp.y);
        noStroke();
        fill("skyblue");
        circle(0, 0, 5);
        pop();
    }

    pop();
}

/**
 *
 * @returns {p5.Vector[]}
 */
function map1Points() {
    /**
     * @type [number, number][]
     */
    const ptsAsFractions = [
        [-0.1, 0.5], //x of 0% of the canvas width, y of 50% of the canvas height
        [0.3, 0.5],
        [0.3, 0.7],
        [0.1, 0.7],
        [0.1, 0.95],
        [0.9, 0.95],
        [0.9, 0.7],
        [0.7, 0.7],
        [0.7, 0.5],
        [1.1, 0.5],
        [1.1, 1.1],
        [0, 1.1],
    ];
    return convertScreenFractionsToPointVectors(ptsAsFractions);
}
/**
 *
 * @returns {p5.Vector[]}
 */
function map2Points() {
    /**
     * @type [number, number][]
     */
    const ptsAsFractions = [
        [-0.1, 0.8],
        [0.4, 0.8],
        [0.4, 0.2],
        [0.5, 0.2],
        [0.5, 0.3],
        [0.44, 0.3],
        [0.44, 0.5],
        [0.5, 0.5],
        [0.5, 0.8],
        [0.9, 0.8],
        [0.9, 0.4],
        [0.75, 0.4],
        [0.75, 0.3],
        [1.1, 0.3],
        [1.1, 1.1],
        [0, 1.1],
    ];
    return convertScreenFractionsToPointVectors(ptsAsFractions);
}

/**
 * @param {[number, number][]} ptsAsFractions
 * @returns {p5.Vector[]}
 */
function convertScreenFractionsToPointVectors(ptsAsFractions) {
    return ptsAsFractions.map(([fx, fy]) => createVector(round(fx * width), round(fy * height)));
}

function createNewTerrain() {
    const choices = [map1Points(), map2Points()];
    return createNewTerrainFromPoints(random(choices));
}

/**
 *
 * @param {p5.Vector[]} pts
 * @returns {NewTerrain}
 */
function createNewTerrainFromPoints(pts) {
    const lineSegs = [];
    for (let ix = 0; ix < pts.length - 1; ix++) {
        const a = pts[ix];
        const b = pts[ix + 1];
        lineSegs.push({ a, b });
    }

    return { lineSegs };
}

function moveVertex(selectedVertex, newPos) {
    selectedVertex.x = snapTo(newPos.x, 50);
    selectedVertex.y = snapTo(newPos.y, 50);
}

function mousePressed() {
    if (editor.selectionMode === "vertex") {
        selectNearestVertexToMouseOrNull();
    } else if (editor.selectionMode === "line") {
        selectNearestLineSegToMouseOrNull();
    }
}

function selectNearestLineSegToMouseOrNull() {
    const segs = world.newTerrain.lineSegs;
    const nearest = minBy(segs, (seg) =>
        p5.Vector.lerp(seg.a, seg.b, 0.5).dist(mousePosAsVector())
    );
    if (nearest && p5.Vector.lerp(nearest.a, nearest.b, 0.5).dist(mousePosAsVector()) < 100) {
        editor.selectedLineSeg = nearest;
        editor.prevMousePos = mousePosAsVector();
    } else {
        editor.selectedLineSeg = null;
    }
}
function selectNearestVertexToMouseOrNull() {
    const pts = allPointsFromNewTerrain(world.newTerrain);

    const ptNearestMouse = minBy(pts, (pt) => pt.dist(mousePosAsVector()));
    if (ptNearestMouse.dist(mousePosAsVector()) > 100) {
        editor.selectedVertex = null;
    } else {
        editor.selectedVertex = ptNearestMouse;
    }
}

function mouseDragged() {
    if (editor.selectionMode === "vertex") {
        if (editor.selectedVertex) {
            moveVertex(editor.selectedVertex, mousePosAsVector());
        }
    }
    if (editor.selectionMode === "line" && editor.selectedLineSeg) {
        moveLineSeg(editor.selectedLineSeg);
    }
    fill("lime");
    circle(10, 10, 100);
}

/**
 *
 * @param {NewTerrain} newTerrain
 * @returns {p5.Vector[]}
 */
function allPointsFromNewTerrain(newTerrain) {
    const pts = [];
    for (let s of newTerrain.lineSegs) {
        pts.push(s.a);
    }
    pts.push(newTerrain.lineSegs.at(-1).b);
    return pts;
}

function toggleMapEditorSelectionMode() {
    editor.selectionMode = editor.selectionMode === "line" ? "vertex" : "line";
    editor.selectedLineSeg = null;
    editor.selectedVertex = null;
}
/**
 *
 * @param {LineSeg} selectedLineSeg
 */
function moveLineSeg(selectedLineSeg) {
    const mouseDelta = p5.Vector.sub(mousePosAsVector(), editor.prevMousePos);
    const pts = [selectedLineSeg.a, selectedLineSeg.b];
    const isHoriz = abs(mouseDelta.x) > abs(mouseDelta.y);
    if (isHoriz) {
        pts.map((pt) => (pt.x += mouseDelta.x));
    } else {
        pts.map((pt) => (pt.y += mouseDelta.y));
    }
    editor.prevMousePos = mousePosAsVector();
}
