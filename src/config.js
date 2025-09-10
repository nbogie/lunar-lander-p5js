/**
 * @typedef {Object} Config
 * @property {number} turnSpeed speed at which ship turns
 * @property {number} thrust force with which ship is propelled
 * @property {number} gravity
 * @property {number} xStep how often in pixels a terrain point is created
 * @property {number} padWidth width of landing pad
 * @property {number} seed random/noise seed used to generate the world (e.g. its terrain)
 * @property {number} fuelUsedPerTick how quickly fuel is used up
 * @property {number} refuelPerTick how quickly we refuel
 * @property {boolean} windEnabled enable/disable wind system
 * @property {number} numWindParticles only relevant to the visualisation of the wind.  lower number for better performance
 * @property {boolean} screenShakeEnabled
 * @property {boolean} gravityEnabled
 * @property {boolean} starsEnabled are stars visible?
 * @property {boolean} debugMessagesEnabled controls display of misc text output about the ship and world useful for debugging
 * @property {boolean} rainbowWindEnabled should the wind particles be rainbow coloured?
 * @property {boolean} drawSunAsLines how should the sun/planets be rendered?
 * @property {boolean} drawNewTerrainEnabled (wip debugging)
 * @property {boolean} zenModeEnabled zen mode causes most non-essential visuals to be removed
 * @property {Object} zenModeBackup stores a copy of the config prior to toggling into zen mode, for later restoration
 * @property {{enabled: boolean, debugRendererEnabled: boolean}} matter config about the experimental use of matter.js
 */
/**
 *
 * @returns {Config}
 */
function createConfig() {
    return {
        turnSpeed: 0.18,
        thrust: 0.15,
        gravity: 0.01,
        xStep: 15,
        padWidth: 90, //should be a multiple of xStep
        fuelUsedPerTick: 0.005,
        refuelPerTick: 0.0035,
        windEnabled: true,
        numWindParticles: 500,
        screenShakeEnabled: false,
        gravityEnabled: false,
        seed: 123, //set later
        starsEnabled: true,
        debugMessagesEnabled: true,
        rainbowWindEnabled: true,
        drawSunAsLines: true,
        zenModeEnabled: false,
        drawNewTerrainEnabled: true,
        zenModeBackup: {},
        matter: {
            enabled: false, //if this is enabled, sketch restart and matter.js and poly-decomp libraries will be required
            debugRendererEnabled: false, //matter.js has its own renderer to its own canvas.  sketch restart required.
        },
    };
}

function toggleConfigBoolean(key, label) {
    config[key] = !config[key];
    const desc = config[key] ? "enabled" : "disabled";
    postMessage(label + " " + desc);
}

function zenModePropertyKeys() {
    return ["windEnabled", "debugMessagesEnabled", "starsEnabled"];
}

function saveConfigForZenMode() {
    const backup = [];
    for (let key of zenModePropertyKeys()) {
        backup[key] = config[key];
    }
    return backup;
}

function toggleZenMode() {
    config.zenModeEnabled = !config.zenModeEnabled;
    if (config.zenModeEnabled) {
        config.zenModeBackup = saveConfigForZenMode();
        let delay = 0;
        for (let key of zenModePropertyKeys()) {
            setTimeout(() => (config[key] = false), delay);
            delay += 500;
        }
        setTimeout(clearMessages, delay);
    } else {
        restoreConfigAfterZenMode();
    }
}

function restoreConfigAfterZenMode() {
    let delay = 0;
    for (let key of [...zenModePropertyKeys()].reverse()) {
        const savedVal = config.zenModeBackup[key];
        if (savedVal !== undefined) {
            setTimeout(() => (config[key] = savedVal), delay);
            delay += 500;
        }
    }
}
