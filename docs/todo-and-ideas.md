# TODO:

-   [ ] map editor: have mousePressed, mouseDragged, etc only registered when map editor is on.
-   [ ] BUG: crashing with "not close to ground" - though the crash otherwise looks legit.
-   [ ] particles for refuel
-   [ ] particles for stunt award
-   [ ] change the landing check returned object to be a list of checks so that an ILS can display ALL of them
-   [ ] always show best transfer time as leaderboard
-   [ ] incorporate deltaTime to support any frameRate
-   [ ] more with matter.js physics engine
-   [ ] performance: simplify wind visualisation (e.g. periodically spawn replacement short-lived wind particles across a loose grid to ensure coverage, rather than relying on coverage through large numbers)
-   [ ] better terrain with octave noise layers?

### Misc ideas

-   paint wind areas by gas colour
-   allow fuel-scooping "cosmic winds" (perhaps this is ship fuel or otherwise needed by bases)
-   add pumping of oxygen or other gases or liquids?
-   use constraints to pick up and move cargo between locations
-   landings / crashes can be graded / reported in detail
-   award pts for better landings
-   thematic flavour text floats on the wind as partial text strings?
-   auto-zoom into collision / landing sites?

### Stunts ideas

-   award pts (with animated particles) for stunts such as:
-   [x] loop-the-loop (track cumulative rotation)
-   [x] low-altitude, high-speed flying
-   [ ] powered loop (where throttle is held down throughout)
-   [ ] low-altitude loop (keep a separate track of rotation that resets whenever the ship is not at low alt.)
-   [ ] low-altitude inverted - touching nose to gnd. would be easier with retros
-   [ ] inverted traverse (long x traversal while continually inverted)
-   [ ] landing with no fuel left (more of an achievement than a stunt)
-   [ ] fast from base to base
-   [ ] base to base with very little fuel usage
-   [ ] touch and go (land and take off within very short time)
-   [ ] land in high wind
-   have stunts award more fuel mid-flight?
-   consider: do these stunts add to the core gameplay fun, or is this wrong direction?
-   have stunts chain for multiplier bonus if they're performed in close succession (once we have more than loop-the-loop!)
-   have stunts get forgotten about over time if we don't land soon after?

### Threat ideas

-   little walking people pods to rescue like in defender
-   zombies. and you have to get out to pump gas / fix problems from time to time?
    -   you can set them on fire w exhaust / drop stuff on them
-   have some cavernous levels with a ceiling
-   occasional high winds. (with forecast when you're at base)

### Sounds

-   add sound effects:
    -   dynamically synthesised w web audio? But don't kill CPU where sound files would be fine.
    -   glug glug fuel pumping sounds?
    -   garbled radio talk (like scratched w timeshaper?)
-   consider integrating something algorithmic like strudel engine

# DONE:

-   [x] move ILS msg under nearest base. remove it if not near a base
-   [x] add support for adws keys
