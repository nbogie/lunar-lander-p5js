/**
 * @typedef {{detail: StuntDetail, timeMs: number}} StuntRecord
 * @typedef {Object} StuntMonitor
 * @property {number} lastFacing
 * @property {StuntRecord[]} log
 * @property {string|undefined} lastVisitedBaseName
 * @property {number|undefined} lastTakeOffTimeMs
 * @property {number|undefined} lowAltitudeStartTimeMs
 */

/**
 *
 * @returns {StuntMonitor}
 */
function createStuntMonitor() {
    return {
        lastFacing: 0,
        log: [],
        lastVisitedBaseName: undefined,
        lastTakeOffTimeMs: undefined,
        lowAltitudeStartTimeMs: undefined,
    };
}
/**
 * @param {Ship} ship
 */
function monitorStunts(ship) {
    if (abs(ship.stuntMonitor.lastFacing - ship.facing) > TWO_PI) {
        awardStunt(ship, { type: "loop" });
        ship.stuntMonitor.lastFacing = ship.facing;
    }
    //low-level flying streak
    const lowAltitudeThreshold = 40;
    if (
        calcGroundClearance(ship) < lowAltitudeThreshold &&
        abs(ship.vel.x) > 0.4 && //don't give it for hovering
        xDistanceToEdgeOfNearestLandingPad(ship.pos.x) > 20 //don't give this away just for landing!
    ) {
        if (ship.stuntMonitor.lowAltitudeStartTimeMs === undefined) {
            ship.stuntMonitor.lowAltitudeStartTimeMs = millis();
        }
        //check for possible long-low-altitude award
        const duration = millis() - ship.stuntMonitor.lowAltitudeStartTimeMs;
        //TODO: change this to the amount of distance covered in low altitude - that rewards fast passes more.
        if (duration > 3000) {
            awardStunt(ship, { type: "low-altitude", extra: (duration / 1000).toFixed(1) + "s" });
            ship.stuntMonitor.lowAltitudeStartTimeMs = undefined;
            //todo: don't clear this tracker but mark this duration awarded, allowing longer runs to be awarded too on same run.
        }
    } else {
        ship.stuntMonitor.lowAltitudeStartTimeMs = undefined;
    }
}

/**
 *
 * @param {number} x
 * @returns  horizontal distance from the given x position to the nearest edge of the nearest landing pad. Elevation is not considered.
 */
function xDistanceToEdgeOfNearestLandingPad(x) {
    const pad = nearestLandingPad(x);
    return max(0, abs(x - pad.centreX) - pad.width / 2);
}
/**
 * @param {Ship} ship
 */
function clearStunts(ship) {
    ship.stuntMonitor.lastFacing = ship.facing;
    ship.stuntMonitor.log = [];
    ship.stuntMonitor.lastTakeOffTimeMs = undefined;
    ship.stuntMonitor.lastVisitedBaseName = undefined;
    ship.stuntMonitor.lowAltitudeStartTimeMs = undefined;
}

/**
 * @typedef {Object} StuntDetail
 * @property {"loop" |"fast-transfer"|"low-altitude"} type
 * @property {string} [extra]
 *
 * @param {Ship} ship - ship that performed the stunt
 * @param {StuntDetail} detail
 */
function awardStunt(ship, detail) {
    ship.stuntMonitor.log.push({ detail: detail, timeMs: millis() });
    const extraOrNothing = detail.extra ? ` (${detail.extra})` : "";
    postMessage(`${detail.type}${extraOrNothing}!`);
}

/**
 * If we have flown from one base to another (without crashing), post flight time, and possibly log fast-transfer "stunt".
 * @param {Ship} ship
 * @param {LandingPad} pad
 */
function processAnyBaseToBaseFlightTime(ship, pad) {
    if (
        ship.stuntMonitor.lastVisitedBaseName !== undefined &&
        pad.name !== ship.stuntMonitor.lastVisitedBaseName
    ) {
        const timeSinceTakeOff = millis() - ship.stuntMonitor.lastTakeOffTimeMs;
        const timeStr = (timeSinceTakeOff / 1000).toFixed(3) + "s";
        postMessage("Flight time: " + timeStr);

        if (timeSinceTakeOff < 10000) {
            const medalType = timeSinceTakeOff < 5000 ? "GOLD" : "Silver";
            awardStunt(ship, { type: "fast-transfer", extra: timeStr + " " + medalType });
        }
    }
}
