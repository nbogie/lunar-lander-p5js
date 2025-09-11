/**
 * Return the minimum element in the given input array as evaluated by the given function.
 * @template A
 * @param {A[]} arr
 * @param {function(A): number} evalByFn - function to use to extract a value from each element in turn for comparison with < operator.
 * @returns {A|undefined} - the element from the input arr which yielded the least value when passed through evalByFn.  Or undefined if the array is empty or undefined.
 */
function minBy(arr, evalByFn) {
    if (!arr || arr.length === 0) {
        return undefined;
    }
    let minVal = Infinity;
    let minElement = undefined;
    for (const candidateElement of arr) {
        const val = evalByFn(candidateElement);
        if (val < minVal) {
            minVal = val;
            minElement = candidateElement;
        }
    }
    return minElement;
}

/**
 * Creates an array by running a function a specified number of times.
 *
 * @template T
 * @param {number} n The number of times to run the function.
 * @param {function(number): T} fn The function to run for each iteration. It receives the current index as an argument and should return the value to be added to the array.
 * @returns {Array<T>} An array containing the values returned by the function.
 */
function collect(n, fn) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(fn(i));
    }
    return arr;
}

/**
 * @template A, B, C
 * @param {A[]} arrA
 * @param {B[]} arrB
 * @param {function(A, B, number): C} joinFn - function to use to combine each pair of elements from arrA and arrB.  Must return an element of final type C, which will be stored in the output array.
 * @returns {C[]} - the collected array of new result elements after calling joinFn on each pair.
 */
function zipWith(arrA, arrB, joinFn) {
    const outputs = [];
    const shorterLen = min(arrA.length, arrB.length);
    for (let ix = 0; ix < shorterLen; ix++) {
        const newElem = joinFn(arrA[ix], arrB[ix], ix);
        outputs.push(newElem);
    }
    return outputs;
}

function formatMillisecondsToMMSS(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (val) => val.toString().padStart(2, "0");
    return [minutes, seconds].map(pad).join(":");
}

/**
 * @returns {p5.Vector} mouse position as vector (a new copy on each call).
 */
function mousePosAsScreenSpaceVector() {
    return createVector(mouseX, mouseY);
}

function mousePosAsWorldSpaceVector() {
    const screenSpacePos = mousePosAsScreenSpaceVector();
    return convertFromScreenSpaceToWorldSpace(screenSpacePos);
}

function mousePrevPosAsWorldSpaceVector() {
    return convertFromScreenSpaceToWorldSpace(createVector(pmouseX, pmouseY));
}

function convertFromScreenSpaceToWorldSpace(ssPos) {
    if (!world.cam.tracked) {
        return ssPos.copy();
    }
    const offset = world.cam.tracked.pos;
    const screenCentre = createVector(width / 2, height / 2);
    //TODO: adjust for the camera's current scaling
    const scaling = world.cam.scale;
    return ssPos.add(offset).sub(screenCentre);
}
