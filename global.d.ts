// This file will add types for both p5 instanced and global modes
// It lets vscode (or other advanced editors) know about what functions and variables are available in p5.js
// and what types those functions they accept and return.
// This enables intellisense - auto-completion, inline documentation, and type checking.
//
// iirc, I originally copied this from https://github.com/Gaweph/p5-typescript-starter
import * as p5Global from "p5/global";
import module from "p5";
export = module;
export as namespace p5;
