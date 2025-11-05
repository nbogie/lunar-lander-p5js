# Lunar Lander p5.js

A game in the lunar lander genre, written in javascript with p5.js

Also at https://openprocessing.org/sketch/2711492

Started: 30Aug2025 for WCCChallenge "Pump"

# About project setup

This is a minimal html + _JS_ project with minimal bundling requirements.

In order to produce a single file to make copy-paste easy to openprocessing, there is a small build process that just concatenates all the JS files (in a certain order, for human readability). It might be possible to do this with rollup /vite or tsc but I haven't found a way that maintains the readable js code as is.

# Minimal setup for type-checking a global-mode p5 _JavaScript_ project in vscode

## for p5 versions starting v2.1.0

(Main difference since v1.x setup: There is no longer a need for a hand-crafted global.d.ts as one is published with the new p5 package.)

1. Install the relevant p5 package as a dev dependency. It contains the types.

    example:

```bash
npm i -D p5@v2.1.0-rc.2
```

2. Then either...
   At the top of at least one js file add this require:

```
/// <reference path="../node_modules/p5/types/global.d.ts" />
```

3. And create a jsconfig.json with this content:

```json
{
    "compilerOptions": {
        "checkJs": true,
        "lib": ["ESNext", "dom"]
    },
    "exclude": ["node_modules", "dist"]
}
```

OR

2. create a `jsconfig.json` with the following content which includes the types sources from their local install (within `node_modules` folder).

```
{
    "compilerOptions": {
        "checkJs": true,
        "lib": ["ESNext", "dom"]
    },
    "include": ["node_modules/p5/types/global.d.ts", "src/**/*.js"]
}
```

Because we're using `include` explicitly, typescript will ONLY include those types and won't check all of node_modules or dist for example.

### without node.js

In both of the above alternatives, if you don't have node.js installed, you can just download the p5 v2.x types file - [e.g. this one, but adjusted for the version you need](https://cdn.jsdelivr.net/npm/p5@2.1.0-rc.2/types/global.d.ts) - to a local folder (e.g. `types/`) and adjust the path in the `/// <reference... />` directive or in your `jsconfig.json`

## for p5 versions _before_ v2.1.0

By adding the following `jsconfig.json` and `global.t.ds` to the project root directory, we get type-checking and intellisense (auto-completion, doc lookup) in vscode.

### add a jsconfig.json

```json
{
    "compilerOptions": {
        "checkJs": true,
        "lib": ["esnext", "dom"]
    }
}
```

-   checkJs: If you get too many spurious warnings about your sketch files, you can disable checkJs here.
-   "dom" library is needed for things like `console.log`
-   "esnext" (or similar) is needed for the type-checker to allow the use of newer browser features (e.g. array.find())

### add a `global.d.ts` in the same directory as your new jsconfig.json

```js
//All that's needed for global mode
//IF we're not referring to the p5 types in JSDoc comments
import * as p5Global from "p5/global";

//Needed for instance mode and referring to the
//types (e.g. in jsdoc comments, even in global mode)
import module from "p5";
export = module;
export as namespace p5;
```

On encountering this file, vscode will _automatically_ try to find types for "p5" package from npm (both for instanced and global modes), enabling type-checking and intellisense (auto-completion).

IIRC, I originally copied this from https://github.com/Gaweph/p5-typescript-starter

## JSDoc

Then use [JSDoc](https://jsdoc.app/) comments in your sketch file(s) to describe your types.

```js
/**
 * @typedef {Object} LandingCheckResult
 * @property {boolean} result - True if landing is allowed, false otherwise.
 * @property {string} [reason] - Explanation for failure (optional)
 */

/**
 * Checks if the given ship meets all conditions for a safe landing.
 * @param {Object} ship - The ship object to check.
 * @returns {LandingCheckResult} describing the outcome of the check, possibly including detail.
 */
function checkIsOkForLanding(ship) {
    //...
}
```

## Naming conventions

-   createX(): create and return an X object, without adding it to the world.
-   spawnX(): create an X object and record it in the world.
-   handleAnyUserX(): check for user input and accordingly trigger any associated X (e.g. steering, thrust, weapon fire).
-   processShipX: e.g. processShipLiftOff(). called once we've established that the ship should be put into state X to do so and to carry out associated changes.

# Current type-issues between 1.x and 2.1.0-rc.2

I can't pass a value of type `{number[] | string}` to `fill()` or `background()`.
