//most from chat gpt - mostly for ideas and inspiration.
// a distorted text-to-speech could say this stuff a bit garbled.
const thematicCommsMessages = {
    preFlight: [
        "All stations, go for launch.",
        "Final systems check, standby for engine ignition.",
        "We have liftoff.",
        "Roger that, we are in the black.",
        "Separation complete, heading to the lunar surface.",
    ],
    inFlight: [
        "Approaching descent phase.",
        "Initiating retro-burn.",
        "We are on final approach.",
        "Stabilizing attitude, adjusting thrust.",
        "Touchdown sequence initiated.",
    ],
    landing: [
        "Altitude: 100 meters.",
        "50 meters, good to go.",
        "We have contact. Roger that, we have contact.",
        "The Eagle has landed.",
        "Mission accomplished. The lunar surface is secure.",
    ],
    errorsAndEmergencies: [
        "Warning: high-speed descent.",
        "We are off course. Correcting vector.",
        "We have a low fuel warning.",
        "Aborting descent, repeat, aborting descent.",
        "Mayday, Mayday. We've lost an engine.",
        "Impact imminent.",
        "Looks like we're out of gas.",
        "I've got a bad feeling about this.",
        "Houston, we have a problem.",
    ],
    routineChecks: [
        "Guidance and navigation, all green.",
        "Propellant quantity reads nominal.",
        "Telemetry data confirms a stable attitude.",
        "System two power levels, checking.",
        "Copy, we have a good lock on the landing site.",
    ],
    procedural: [
        "Switching to manual.",
        "Throttle up one percent.",
        "Initiating burn in T-minus ten seconds.",
        "Burn complete.",
        "Stand by for landing leg deployment.",
    ],
    questionsAndClarifications: [
        "Houston, what's our current velocity?",
        "Confirming on the altitude call.",
        "Say again on that last bit, we had a dropout.",
        "Is that a hard or soft ground reading?",
    ],
    lowStakesCommentary: [
        "Okay, let's see what this thing can do.",
        "Looks like a good spot down there.",
        "Alright, let's bring her home.",
        "It's quieter down here than I expected.",
        "Well, that was a heck of a ride.",
        "I'll be seeing you.",
    ],
};
