#!/bin/bash
set -x
set -e

mkdir -p dist/

OUTPUT_FILE="dist/compiled.js"

# Create or clear the output file
> "$OUTPUT_FILE"

FILES=(
    "mySketch.js"
    "config.js"
    "ship.js"
    "world.js"
    "camera.js"
    "explosions.js"
    "flavour.js"
    "landingPads.js"
    "messages.js"
    "palette.js"
    "scenery.js"
    "stars.js"
    "stunts.js"
    "terrain.js"
    "thrustParticles.js"
    "utils.js"
    "wind.js"
    "myMatterStuff.js"
)

# Concatenate the files
for file in "${FILES[@]}"; do
    cat "src/$file" >> "$OUTPUT_FILE"
done
cp src/indexForSingleScript.html dist/index.html

echo "Build complete. All files concatenated into $OUTPUT_FILE."


