#!/bin/bash
set -x
set -e

mkdir -p dist/

OUTPUT_FILE="dist/compiled.js"

# Create or clear the output file
> "$OUTPUT_FILE"

FILES=(
    "header.js"
    "config.js"
    "setup.js"
    "draw.js"
    "keyboard.js"
    "debugText.js"
    "ship.js"
    "world.js"
    "camera.js"
    "explosions.js"
    "flavour.js"
    "globals.js"
    "landingPads.js"
    "messages.js"
    "newTerrain.js"
    "palette.js"
    "projectiles.js"
    "scenery.js"
    "screenShake.js"
    "stars.js"
    "stunts.js"
    "terrain.js"
    "thrustParticles.js"
    "utils.js"
    "wind.js"
    "unsorted.js"
    "myMatterStuff.js"
)

# Concatenate the files
for file in "${FILES[@]}"; do
    cat "src/$file" >> "$OUTPUT_FILE"
done
cp src/indexForSingleScript.html dist/index.html

echo "Build complete. All files concatenated into $OUTPUT_FILE."


