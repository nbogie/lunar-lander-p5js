// This file will add both p5 instanced and global intellisence
//
// iirc, I originally copied this from https://github.com/Gaweph/p5-typescript-starter
import * as p5Global from "p5/global";
import module from "p5";
export = module;
export as namespace p5;
