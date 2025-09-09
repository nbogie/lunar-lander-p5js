/**
 * @typedef {Object} Message
 * @property {string} msg - text of message
 * @property {number} postTime - time message was posted, in milliseconds
 * @property {number} durationMs - duration (in milliseconds) for which the message should be displayed
 */

/**
 * @param {string} str - text of the message
 * @param {number?} durationMs  - duration in milliseconds for the message to be displayed. defaults if not provided.
 */
function postMessage(str, durationMs = 5000) {
    /** @type {Message} */
    const message = {
        msg: str,
        postTime: millis(),
        durationMs,
    };
    world.messages.push(message);
}

function updateMessages() {
    world.messages = world.messages.filter((m) => millis() < m.postTime + m.durationMs);
}

function drawMessages() {
    push();
    translate(width - 50, 50);
    for (let m of world.messages) {
        textSize(18);
        textAlign(RIGHT);
        noStroke();
        fill("white");
        // const timePrefix = +" at " + formatMillisecondsToMMSS(m.postTime);
        text(m.msg, 0, 0);
        translate(0, 30);
    }
    pop();
}
/**
 * @param {{all?:boolean}} options - option.all controls whether all messages are posted or just the most fundamental ones.
 */
function postInstructionalMessages({ all } = { all: false }) {
    const coreMessages = [
        "'a' & 'd' or left & right arrows to rotate",
        "'w' or up arrow to thrust",
        "'r' to restart / regenerate",
        "'2' to toggle wind",
        "'z' to toggle zen mode",
        "'h' to get complete help",
    ];

    const otherMessages = [
        "'p' to pause",
        "'1' to toggle janky zoom",
        "'3' to toggle rainbow wind",
        "'4' to toggle stars",
        "'5' to toggle sun as lines",
        "'b' to toggle debug text",
        "'k' to toggle screenshake",
        "'c' to clear messages",
    ];
    const msgs = [...coreMessages, ...(all ? otherMessages : [])];

    postMessagesAtIntervals(msgs);
}

/**
 * @param {string[]} msgs
 */
function postMessagesAtIntervals(msgs) {
    const spacingMs = 1000;
    const duration = 10000;
    let delayMs = 0;
    for (let msg of msgs) {
        postMessageLater(msg, delayMs, duration);
        delayMs += spacingMs;
    }
}

function postMessageLater(str, delay, durationMs) {
    return setTimeout(() => postMessage(str, durationMs), delay);
}

function clearMessages() {
    world.messages = [];
}

function postFlavourMessages() {
    const msgs = [
        "Guidance and navigation, all green",
        "Propellant quantity reads nominal",
        "Telemetry data confirms a stable attitude",
        "Switching to manual",
        "('h' for help)",
    ];
    postMessagesAtIntervals(msgs);
}
