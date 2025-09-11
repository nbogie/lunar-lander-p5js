/**
 * @typedef {Object} MapEditorPalette
 * @property {p5.Color} vertex
 * @property {p5.Color} selectedVertex
 * @property {p5.Color} terrain
 * @property {p5.Color} midpoint
 * @property {p5.Color} vertexText
 */

/**
 * @typedef {Object} Palette
 * @property {p5.Color[]} all - all loose colours
 * @property {p5.Color[]} bases - brighter colours for use as bases
 * @property {p5.Color} skyBackground
 * @property {p5.Color} landBackground
 * @property {MapEditorPalette} mapEditor
 */
/**
 *
 * @returns {Palette}
 */
function createPalette() {
    // Kjetil Golid's "Tundra3" https://chromotome-quicker.netlify.app/
    const all = ["#87c3ca", "#7b7377", "#b2475d", "#7d3e3e", "#eb7f64", "#d9c67a", "#f3f2f2"].map(
        (str) => color(str)
    );
    return {
        all: all, //the loose colours
        bases: [0, 2, 4, 5].map((ix) => all[ix]),
        skyBackground: color(20),
        landBackground: color(20),
        mapEditor: {
            midpoint: color("skyblue"),
            vertex: color("orange"),
            selectedVertex: color("magenta"),
            terrain: color("white"),
            vertexText: color("lime"),
        },
    };
}
