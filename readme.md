# Lunar Lander p5.js

A game in the lunar lander genre, written in javascript with p5.js

Also at https://openprocessing.org/sketch/2711492

Started: 30Aug2025 for WCCChallenge "Pump"

# About project setup

This is a minimal html + js project with no node or bundling requirements.

# Minimal setup for type-checking a global-mode p5 project in vscode

By adding the following `jsconfig.json` and `global.t.ds` to the project root directory, we get type-checking and intellisense (auto-completion, doc lookup) in vscode.

### jsconfig.json

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

### global.t.ds

```js
import * as p5Global from "p5/global";
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
