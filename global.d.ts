// This file will add types for both p5 instanced and global modes
// It lets typescript (run behind the scenes by vscode or other advanced editors) know about what functions and variables are available in p5.js
// and what types those functions they accept and return.
// In such editors, this enables intellisense - auto-completion, inline documentation, as well as type checking.
//
// iirc, I originally copied this from https://github.com/Gaweph/p5-typescript-starter

//This like is all that's needed for global-mode, if we're not referring to the p5 types in JSDocs
import * as p5Global from "p5/global";

// These are needed to make the types available for use in jsdoc comments.
// And for use in instanced mode
import module from "p5";
export = module;
export as namespace p5;
