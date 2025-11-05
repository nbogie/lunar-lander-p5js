//Experimental matter.js support (e.g. for registering the terrain as a set of matter.js bodies)
//if matter.js is enabled in config, the matter.js poly-decomp libraries will be needed

/** matter.js engine */
const Engine = Matter.Engine,
    Runner = Matter.Runner,
    Composites = Matter.Composites,
    Composite = Matter.Composite,
    Common = Matter.Common,
    Bodies = Matter.Bodies;

let engine;

function setupMatterJS() {
    engine = Engine.create();
    config.matter.debugRendererEnabled && setupMatterJSDebugRenderer();
    var runner = Runner.create();
    Runner.run(runner, engine);
}

function setupMatterJSDebugRenderer() {
    const renderFn = Matter.Render.create({
        element: document.body,
        engine: engine,
        options: {
            width,
            height,
        },
    });
    Matter.Render.run(renderFn);
}

function createInitialPhysicsBodies(world) {
    const bodyOptions = {
        frictionAir: 0,
        friction: 0.0001,
        restitution: 0.6,
    };
    const starBodies = world.stars.map((star) => Bodies.circle(star.pos.x, 0, 10, bodyOptions));
    const terrainBody = createPhysicsBodyForTerrain(world);
    const allBodies = [...starBodies, terrainBody];
    Composite.add(engine.world, allBodies);
    return allBodies;
}

//See https://github.com/liabru/matter-js/blob/master/examples/terrain.js and https://brm.io/matter-js/demo/#terrain
function createPhysicsBodyForTerrain(world) {
    //if poly-decomp is loaded by the browser (with a script tag), a global variable "decomp" will be available
    //@ts-ignore
    Common.setDecomp(decomp);
    //or for other packaging methods
    // Common.setDecomp(require("poly-decomp"));
    const verticesFromTerrain = world.terrain.points.map(({ x, y }) => ({
        x,
        y,
    }));

    const yMax = height + 200;
    const leftmostY = verticesFromTerrain.at(0).y;
    const rightmostY = verticesFromTerrain.at(-1).y;

    const vertexSets = [
        [
            ...verticesFromTerrain,
            //add vertices to complete an area that extends beyond the screen bounds
            { x: width + 100, y: rightmostY },
            { x: width + 100, y: yMax },
            //generate a line of extra vertices along the bottom, in case this helps the polygon decomposition.
            ...[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((d) => ({
                x: width * (d / 10),
                y: yMax,
            })),
            { x: -100, y: yMax },
            { x: -100, y: leftmostY },
        ],
    ];

    const terrainBody = Bodies.fromVertices(
        0,
        0,
        vertexSets,
        {
            isStatic: true,
        },
        true
    );

    // Correct the position of the terrain body
    const lowestYVal = min(vertexSets[0].map((pt) => pt.y));
    const lowestXVal = min(vertexSets[0].map((pt) => pt.x));
    const targetPositionX = lowestXVal; // The x-coordinate for the terrain's  desired top-left corner
    const targetPositionY = lowestYVal;

    // Use Matter.Body.setPosition to move the body
    Matter.Body.setPosition(terrainBody, {
        x: terrainBody.position.x - (terrainBody.bounds.min.x - targetPositionX),
        y: terrainBody.position.y - (terrainBody.bounds.min.y - targetPositionY),
    });

    if (!terrainBody) {
        throw new Error(
            "Unexpected falsy terrain body - perhaps the vertices could not be decomposed into convex bodies?"
        );
    }
    return terrainBody;
}

function drawBall(b) {
    push();
    noFill();
    stroke(255);
    circle(b.position.x, b.position.y, 2 * b.circleRadius);

    pop();
}
