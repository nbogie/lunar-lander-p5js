/**
 * @typedef {Object} Editor
 * @property {"line"|"vertex"} selectionMode
 * @property {p5.Vector | null} selectedVertex
 * @property {LineSeg | null} selectedLineSeg
 * @property {p5.Vector|null} prevMousePos
 * @property {{pos:p5.Vector}|null} camCentre
 *
 */

const LOCAL_STORAGE_KEY_FOR_USER_TERRAIN_MAP = "userTerrainMap";
const TERRAIN_DATA_VERSION = "0.0.1";

/**
 * @typedef {Object} LineSeg
 * @property {p5.Vector} a
 * @property {p5.Vector} b
 */

/**
 * @typedef {Object} NewTerrain
 * @property {LineSeg[]} lineSegs
 * @property {FuelTank[]} fuelTanks
 *
 */

/**
 * @param {World} world
 * @returns {Editor}
 */
function createEditor(world) {
    return {
        selectionMode: "vertex",
        selectedVertex: null,
        selectedLineSeg: null,
        prevMousePos: null,
        camCentre: { pos: createVector(width / 2, height / 2) },
    };
}
function drawNewTerrain() {
    const { lineSegs } = world.newTerrain;
    push();
    strokeWeight(1 / world.cam.scale);
    stroke(world.palette.mapEditor.terrain);
    fill(world.palette.landBackground);
    beginShape();
    for (let seg of lineSegs) {
        vertex(seg.a.x, seg.a.y);
        vertex(seg.b.x, seg.b.y);

        if (seg === editor.selectedLineSeg) {
            push();
            strokeWeight(3 / world.cam.scale);
            line(seg.a.x, seg.a.y, seg.b.x, seg.b.y);
            pop();
        }
    }
    endShape(CLOSE);
    if (config.newTerrainVertexAnnotationEnabled) {
        annotateVerticesAndMidpoints(lineSegs);
    }

    pop();
}

/**
 *
 * @param {LineSeg[]} lineSegs
 */
function annotateVerticesAndMidpoints(lineSegs) {
    //annotate vertices
    for (let seg of lineSegs) {
        push();
        const pt = seg.a;
        const isVertexSelected = pt === editor.selectedVertex;
        const isLineSegSelected = seg === editor.selectedLineSeg;

        translate(pt.x, pt.y);

        const vertexColour =
            isLineSegSelected || isVertexSelected
                ? world.palette.mapEditor.selectedVertex
                : world.palette.mapEditor.vertex;

        stroke(vertexColour);
        if (editor.selectionMode === "vertex") {
            fill(vertexColour);
        } else {
            noFill();
        }

        const vertexCircleSize = editor.selectionMode === "vertex" ? 6 : 4;
        circle(0, 0, vertexCircleSize / world.cam.scale);

        noStroke();
        textSize(14);
        fill(world.palette.mapEditor.vertexText);
        const fx = (seg.a.x / width).toFixed(2);
        const fy = (seg.a.y / height).toFixed(2);
        const vertexLabelText = config.vertexLabelsAsFractions
            ? `(${fx}, ${fy})`
            : `(${seg.a.x.toFixed(0)}, ${seg.a.y.toFixed(0)})`;
        text(vertexLabelText, 5, -5);

        pop();

        push();
        const mp = p5.Vector.lerp(seg.a, seg.b, 0.5);
        translate(mp.x, mp.y);
        const midpointCircleSize = editor.selectionMode === "line" ? 6 : 4;
        stroke(world.palette.mapEditor.midpoint);
        if (editor.selectionMode === "line") {
            fill(world.palette.mapEditor.midpoint);
        } else {
            noFill();
        }

        circle(0, 0, midpointCircleSize / world.cam.scale);
        pop();
    }
}

function mapMinimalPoints() {
    /**
     * @type [number, number][]
     */
    const ptsAsFractions = [
        [0.1, 0.5], //x of 0% of the canvas width, y of 50% of the canvas height
        [0.3, 0.9],
        [0.3, 0.5],
    ];
    return convertScreenFractionsToPointVectors(ptsAsFractions);
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
 *
 * @returns {TerrainMapStorageWithMeta}
 */
function map4WithFuelTanks() {
    return {
        terrainDataVersion: "0.0.1",
        data: {
            points: [
                [-50, 500],
                [581, 499],
                [573, 110],
                [773, 83],
                [774, 159],
                [650, 162],
                [657, 307],
                [873, 303],
                [900, 250],
                [1000, 250],
                [1000, 300],
                [950, 400],
                [814.5, 442.5],
                [804, 504],
                [798, 803],
                [898, 803],
                [901, 504],
                [1050, 500],
                [1050, 450],
                [1150, 450],
                [1150, 500],
                [1150, 500],
                [1300, 500],
                [1300, 600],
                [1150, 600],
                [1100, 650],
                [1100, 1150],
                [50, 1150],
                [50, 1450],
                [50, 2050],
                [300, 2050],
                [900, 2050],
                [900, 1700],
                [300, 1700],
                [300, 1500],
                [950, 1500],
                [950, 1600],
                [1400, 1600],
                [1400, 650],
                [1400, 500],
                [1571, 485],
                [1550, 300],
                [1350, 300],
                [1350, 200],
                [1650, 200],
                [1920, 182],
                [1929, 2272],
                [-50, 2272],
                [-50, 500],
            ],
            fuelTanks: [
                {
                    pos: {
                        x: 250,
                        y: 500,
                    },
                    rotation: 0,
                },
                {
                    pos: {
                        x: 1150,
                        y: 500,
                    },
                    rotation: 0,
                },
                {
                    pos: {
                        x: 1100,
                        y: 450,
                    },
                    rotation: 0,
                },
                {
                    pos: {
                        x: 1450,
                        y: 200,
                    },
                    rotation: 0,
                },
                {
                    pos: {
                        x: 950,
                        y: 250,
                    },
                    rotation: 0,
                },
                {
                    pos: {
                        x: 800,
                        y: 2050,
                    },
                    rotation: 0,
                },
                {
                    pos: {
                        x: 400,
                        y: 2050,
                    },
                    rotation: 0,
                },
                {
                    pos: {
                        x: 850,
                        y: 800,
                    },
                    rotation: 0,
                },
            ],
        },
        timestamp: "Thu Sep 11 2025 18:09:31 GMT+0100 (British Summer Time)",
    };
}
/**
 *
 * @returns {p5.Vector[]}
 */
function map3MultiScreen() {
    /**
     * @type [number, number][]
     */
    const points = [
        [-50, 500],
        [581, 499],
        [573, 110],
        [773, 83],
        [774, 159],
        [650, 162],
        [657, 307],
        [873, 303],
        [886, 265],
        [986, 265],
        [1000, 300],
        [950, 400],
        [814.5, 442.5],
        [804, 504],
        [798, 816],
        [898, 816],
        [901, 504],
        [1050, 500],
        [1050, 450],
        [1100, 450],
        [1100, 500],
        [1150, 500],
        [1300, 500],
        [1300, 600],
        [1150, 600],
        [1100, 650],
        [1100, 1150],
        [50, 1150],
        [50, 1450],
        [50, 2050],
        [300, 2050],
        [900, 2050],
        [900, 1700],
        [300, 1700],
        [300, 1500],
        [950, 1500],
        [950, 1600],
        [1400, 1600],
        [1400, 650],
        [1400, 500],
        [1571, 485],
        [1571, 242],
        [1309, 242],
        [1309, 182],
        [1920, 182],
        [1929, 2272],
        [-50, 2272],
        [-50, 500],
    ];
    return points.map((pts) => createVector(...pts));
}

/**
 * @param {[number, number][]} ptsAsFractions
 * @returns {p5.Vector[]}
 */
function convertScreenFractionsToPointVectors(ptsAsFractions) {
    return ptsAsFractions.map(([fx, fy]) => createVector(round(fx * width), round(fy * height)));
}

/**
 *
 * @param {Palette} palette
 * @returns {NewTerrain}
 */
function createNewTerrain(palette) {
    // const choices = [mapMinimalPoints()];
    // const choices = [map1Points(), map2Points(), map3MultiScreen()];
    // return createNewTerrainFromPoints(random(choices));
    return createNewTerrainFromMapData(map4WithFuelTanks(), palette);
}

/**
 *
 * @param {TerrainMapStorageWithMeta} dataWithMeta
 * @param {Palette} palette
 * @returns {NewTerrain}
 */
function createNewTerrainFromMapData(dataWithMeta, palette) {
    const data = dataWithMeta.data;
    const terrain = createNewTerrainFromPoints(data.points.map(([x, y]) => createVector(x, y)));

    terrain.fuelTanks = data.fuelTanks.map((ft) =>
        createFuelTank(createVector(ft.pos.x, ft.pos.y), ft.rotation, palette)
    );
    return terrain;
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

    return { lineSegs, fuelTanks: [] };
}

function moveVertex(selectedVertex, newPos) {
    selectedVertex.x = snapTo(newPos.x, 50);
    selectedVertex.y = snapTo(newPos.y, 50);
}

function mousePressed() {
    if (keyIsDown(SHIFT)) {
        maybeAddVertexAtMouse();
    }

    if (editor.selectionMode === "vertex") {
        selectNearestVertexToMouseOrNull();
    } else if (editor.selectionMode === "line") {
        selectNearestLineSegToMouseOrNull();
    }
}

function selectNearestLineSegToMouseOrNull() {
    const segs = world.newTerrain.lineSegs;
    const nearest = minBy(segs, (seg) =>
        p5.Vector.lerp(seg.a, seg.b, 0.5).dist(mousePosAsWorldSpaceVector())
    );
    if (
        nearest &&
        p5.Vector.lerp(nearest.a, nearest.b, 0.5).dist(mousePosAsWorldSpaceVector()) < 100
    ) {
        editor.selectedLineSeg = nearest;
        editor.prevMousePos = mousePosAsWorldSpaceVector();
    } else {
        editor.selectedLineSeg = null;
    }
}
function selectNearestVertexToMouseOrNull() {
    const pts = allPointsFromNewTerrain(world.newTerrain);

    const ptNearestMouse = minBy(pts, (pt) => pt.dist(mousePosAsWorldSpaceVector()));
    if (ptNearestMouse.dist(mousePosAsWorldSpaceVector()) > 100) {
        editor.selectedVertex = null;
    } else {
        editor.selectedVertex = ptNearestMouse;
    }
}

function mouseWheel(event) {
    if (!world.cam.isZooming) {
        return;
    }
    //todo: move mouse-sensitivity to config / map-editor config
    world.cam.desiredScale = constrain(world.cam.desiredScale + event.delta / 1000, 0.2, 10);
}

function mouseDragged() {
    if (keyIsDown(ALT)) {
        const wMouse = mousePosAsWorldSpaceVector();
        const wPMouse = mousePrevPosAsWorldSpaceVector();
        const mouseDelta = createVector(mouseX - pmouseX, mouseY - pmouseY);
        editor.camCentre.pos.sub(mouseDelta);
        return;
    }
    if (editor.selectionMode === "vertex") {
        if (editor.selectedVertex) {
            moveVertex(editor.selectedVertex, mousePosAsWorldSpaceVector());
        }
    }
    if (editor.selectionMode === "line" && editor.selectedLineSeg) {
        moveLineSeg(editor.selectedLineSeg);
    }
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
    const mouseDelta = p5.Vector.sub(mousePosAsWorldSpaceVector(), editor.prevMousePos);
    const pts = [selectedLineSeg.a, selectedLineSeg.b];
    const isHoriz = abs(mouseDelta.x) > abs(mouseDelta.y);
    if (isHoriz) {
        pts.map((pt) => (pt.x += mouseDelta.x));
    } else {
        pts.map((pt) => (pt.y += mouseDelta.y));
    }
    editor.prevMousePos = mousePosAsWorldSpaceVector();
}
/**
 *
 * @param {Ship} ship
 * @returns {NewTerrainCollisionCheckResult}
 */
function detectNewTerrainCollision(ship) {
    const corners = shipCornersInWorldSpace(ship);
    if (
        corners.some((corner) => isCollidingWithNewTerrain(corner, world.newTerrain) === "inside")
    ) {
        return "inside";
    } else {
        return "outside";
    }
}

/**
 * @typedef {'inside'|'outside'} NewTerrainCollisionCheckResult
 */
/**
 * Determines if a point p is inside or outside of a polygon created by a collection of line segments. (on boundary is not considered)
 * Method:  Ray-cast horizontally to the right from the given point p and count how many line segments the ray intersects with.
 *          An even number of intersections means the point is outside the polygon assumed to be formed by the line-segments.
 * @param {p5.Vector} p The point to check.
 * @param {NewTerrain} terrain The terrain containing the line segments.
 * @returns {NewTerrainCollisionCheckResult}
 */
function isCollidingWithNewTerrain(p, terrain) {
    // A ray extending to the right from point p //TODO: set this high enough that all possible segments will be considered - even on a big scrolling map
    let rayPoint = createVector(p.x + 1000000, p.y);
    const raySeg = { a: p, b: rayPoint };

    const intersectionCount = terrain.lineSegs.filter((terrainLineSeg) =>
        areLineSegmentsIntersecting(terrainLineSeg, raySeg)
    ).length;

    // If the number of intersections is odd, the point is inside.
    return intersectionCount % 2 === 1 ? "inside" : "outside";
}

/**
 * returns true if the given line segments intersect.  This is a bit faster than findIntersectionPointOrNull.
 * Note: this function was generated by an AI (Gemini)
 * @param {LineSeg} seg1
 * @param {LineSeg} seg2
 * @returns {boolean}
 */
function areLineSegmentsIntersecting(seg1, seg2) {
    //name the segment vertices as a to b and c to d
    let { a, b } = seg1;
    let { a: c, b: d } = seg2;

    let denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);

    if (denominator === 0) {
        return false; //segments are parallel
    }

    let t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator;
    let u = -((a.x - b.x) * (a.y - c.y) - (a.y - b.y) * (a.x - c.x)) / denominator;

    // An intersection exists if t and u are both between 0 and 1.
    return t > 0 && t <= 1 && u > 0 && u <= 1;
}

/**
 * returns the intersection of the given two line segments, or undefined if there are none.
 * Note: this function was partly written by an AI (Gemini)
 * @param {LineSeg} seg1
 * @param {LineSeg} seg2
 * @returns {p5.Vector | null} the point of intersection or null
 */
function findIntersectionPointOrNull(seg1, seg2) {
    //name the segment vertices as a to b and c to d
    let { a, b } = seg1;
    let { a: c, b: d } = seg2;

    let denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);

    if (denominator === 0) {
        return null; //segments are parallel
    }

    let t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator;
    let u = -((a.x - b.x) * (a.y - c.y) - (a.y - b.y) * (a.x - c.x)) / denominator;

    // An intersection exists if t and u are both between 0 and 1.
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        // Calculate the intersection point using 't' and the first segment.
        let intersectionX = a.x + t * (b.x - a.x);
        let intersectionY = a.y + t * (b.y - a.y);

        return createVector(intersectionX, intersectionY);
    } else {
        return null;
    }
}
/**
 * edits the terrain linesegs in place.
 * @returns
 */
function maybeAddVertexAtMouse() {
    //find nearest midpoint
    const { lineSeg, distToMidpoint, midpoint } = findNearestLineSegMidpoint(
        mousePosAsWorldSpaceVector()
    );
    if (distToMidpoint > 100) {
        return;
    }

    //break that midpoint's lineseg into two lineseg's
    //  original [A <-> B] becomes [A <-> MP] and new seg [MP <-> B]

    const oldB = lineSeg.b;

    //note that the same vertex is shared by both linesegs, so that if its position is changed, both linesegs reflect that.
    lineSeg.b = midpoint;

    /**
     * @type {LineSeg}
     */
    const newLineSeg = { a: midpoint, b: oldB };
    const ix = world.newTerrain.lineSegs.indexOf(lineSeg);
    if (ix < 0) {
        throw new Error("expected to find lineseg in terrain linesegs: " + JSON.stringify(lineSeg));
    }

    //insert the one new lineSeg into the array immediately after the one we are splitting
    world.newTerrain.lineSegs.splice(ix + 1, 0, newLineSeg);

    //switch into vertex select mode, select the newly created vertex, cancelling any previous lineseg selection
    editor.selectionMode = "vertex";
    editor.selectedLineSeg = null;
    editor.selectedVertex = midpoint;
}

/**
 *
 * @param {p5.Vector} pos
 * @returns {{lineSeg: LineSeg, distToMidpoint: number, midpoint: p5.Vector}}
 */
function findNearestLineSegMidpoint(pos) {
    const fancySegs = world.newTerrain.lineSegs.map((lineSeg) => {
        const midpoint = p5.Vector.lerp(lineSeg.a, lineSeg.b, 0.5);
        const distToMidpoint = pos.dist(midpoint);
        return { lineSeg, midpoint, distToMidpoint };
    });

    return minBy(fancySegs, (fs) => fs.distToMidpoint);
}

/**
 * @typedef {Object} TerrainMapStorageWithMeta
 * @property {string} terrainDataVersion
 * @property {TerrainMapData} data
 * @property {string} timestamp
 *
 */
/**
 * @typedef {Object} TerrainMapData
 * @property {[number, number][]}  points
 * @property {{pos: {x:number, y:number}, rotation: number}[]} fuelTanks
 */

/**
 *
 * @param {p5.Vector} vec
 * @returns {{x:number, y:number}}
 */
function vectorToSimplerRoundedObject(vec) {
    return { x: round(vec.x), y: round(vec.y) };
}

/**
 *
 * @param {{x,y}} vector to simplify
 * @returns {[number, number]}
 */
function vectorToArray({ x, y }) {
    return [x, y];
}
function saveNewTerrainMapAsJSON() {
    const simplifiedPoints = world.newTerrain.lineSegs.map(({ a }) => vectorToArray(a));
    simplifiedPoints.push(vectorToArray(world.newTerrain.lineSegs.at(-1).b));
    /**
     * @type TerrainMapStorageWithMeta
     */
    const objectToStore = {
        terrainDataVersion: TERRAIN_DATA_VERSION,
        data: {
            points: simplifiedPoints,
            fuelTanks: world.newTerrain.fuelTanks.map((ft) => ({
                pos: vectorToSimplerRoundedObject(ft.pos),
                rotation: ft.rotation,
            })),
        },
        timestamp: new Date().toString(),
    };
    storeItem(LOCAL_STORAGE_KEY_FOR_USER_TERRAIN_MAP, objectToStore);
    postMessage("saved map to local storage");
    const string = JSON.stringify(objectToStore, null, 2);
    saveStrings([string], "lunar-lander-map.txt");

    console.log("saved the following userTerrainMap to localstorage", string);
}

function loadSavedTerrainMap() {
    /**@type TerrainMapStorageWithMeta */
    //@ts-ignore
    const storedObject = getItem(LOCAL_STORAGE_KEY_FOR_USER_TERRAIN_MAP);

    const { terrainDataVersion, data } = storedObject;
    if (terrainDataVersion !== TERRAIN_DATA_VERSION) {
        console.warn("won't load user terrain map - different version ${terrainDataVersion}");
    }

    world.newTerrain = createNewTerrainFromMapData(storedObject, world.palette);
    postMessage("loaded map from local storage");
}

function drawMapEditorWorldSpaceUI() {
    push();

    //world-space origin
    circle(0, 0, 20);
    noStroke();
    fill("red");
    textSize(20);
    textAlign(CENTER, CENTER);
    text("(0,0)", 0, 0);

    //circle at mouse world-space co-ords, to check them
    const p = mousePosAsWorldSpaceVector();
    translate(p.x, p.y);
    noFill();
    stroke(255);
    strokeWeight(1 / world.cam.scale);
    circle(0, 0, 30);
    circle(0, 0, 2);

    noStroke();
    fill(255);
    textSize(14);
    text("worldspace: " + p.x.toFixed(0) + ", " + p.y.toFixed(0), 0, 30);
    pop();
}

function drawMapEditorScreenSpaceUI() {
    push();
    const worldSpacePos = roundVec(mousePosAsWorldSpaceVector());
    const screenSpacePos = roundVec(mousePosAsScreenSpaceVector());
    noFill();
    stroke(255);
    strokeWeight(1 / world.cam.scale);
    const lines = [
        "mouse: ",
        "mpos screen: " + screenSpacePos.x + ", " + screenSpacePos.y,
        "mpos world: " + worldSpacePos.x + ", " + worldSpacePos.y,
    ];

    if (world.cam.tracked) {
        const tracked = roundVec(world.cam.tracked.pos);
        lines.push("tracked: " + tracked.x + ", " + tracked.y);
    }

    const lineHeight = 20;
    translate(10, height - lines.length * lineHeight);
    for (let line of lines) {
        text(line, 0, 0);
        translate(0, lineHeight);
    }

    pop();
}

/**
 * @typedef {object} GroundClearanceInfo
 * @property {p5.Vector} point
 * @property {number} distance
 * @property {LineSeg} lineSeg
 */

/**
 * Calculate the ground clearance between the ship and the first line seg directly underneath it.  null if no ground beneath ship.
 * Assumes we are not currently colliding inside of the terrain.
 * @param {Ship} ship
 * @returns {GroundClearanceInfo |null} null if there is no ground beneath us
 */
function calcNewTerrainGroundClearance(ship) {
    const raySegment = { a: ship.pos.copy(), b: p5.Vector.add(ship.pos, createVector(0, 100000)) };
    const allIntersections = findAllLineSegmentIntersections(raySegment, world.newTerrain.lineSegs);
    if (allIntersections.length === 0) {
        return null;
    }
    const firstIntersection = minBy(allIntersections, (intersection) =>
        ship.pos.dist(intersection.point)
    );
    return {
        point: firstIntersection.point,
        distance: firstIntersection.point.dist(ship.pos) - ship.height / 2, //quick hack - we're checking to ship centre, not to all bounding box corners.  pretend it's a circle.
        lineSeg: firstIntersection.lineSeg,
    };
}

/**
 * @param {LineSeg} oneSeg
 * @param {LineSeg[]} otherSegs
 * @returns {{point: p5.Vector, lineSeg: LineSeg}[]} all intersections oneSeg makes with otherSegs
 */
function findAllLineSegmentIntersections(oneSeg, otherSegs) {
    return otherSegs
        .map((otherSeg) => {
            const inter = findIntersectionPointOrNull(otherSeg, oneSeg);
            if (inter) {
                return { point: inter, lineSeg: otherSeg };
            } else {
                return null;
            }
        })
        .filter((intersectionOrNull) => intersectionOrNull !== null);
}

function snapVectorTo(inputVec, gridSize) {
    return createVector(...[inputVec.x, inputVec.y].map((val) => snapTo(val, gridSize)));
}
function editorAddFuelTankAtMouse() {
    const pos = mousePosAsWorldSpaceVector();
    const snappedPos = snapVectorTo(pos, 50);

    world.newTerrain.fuelTanks.push(createFuelTank(snappedPos, 0, world.palette));
    postMessage("added fuel tank at " + vectorToRoundedString(snappedPos));
}
