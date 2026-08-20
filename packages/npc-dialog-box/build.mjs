/**
 * Builds the package into dist/:
 *  - api.js       main-script side API (ESM)
 *  - vite.js      the Vite plugin (Node ESM)
 *  - npc-dialog.html  fully self-contained dialog page: the iframe-side code
 *                 is bundled and inlined so consumers only ever copy/serve
 *                 this single file (which is what the Vite plugin does).
 * Type declarations are emitted separately by `tsc -p tsconfig.json`.
 */
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(root, "dist"), { recursive: true });

await build({
    entryPoints: [join(root, "src/api.ts")],
    outfile: join(root, "dist/api.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    sourcemap: true,
});

await build({
    entryPoints: [join(root, "src/vite-plugin.ts")],
    outfile: join(root, "dist/vite.js"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node18",
    external: ["vite"],
    sourcemap: true,
});

const iframeBundle = await build({
    entryPoints: [join(root, "src/iframe-entry.ts")],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2018",
    minify: true,
    write: false,
});
const iframeJs = iframeBundle.outputFiles[0].text;
if (iframeJs.includes("</script>")) {
    // Would prematurely close the inline <script> tag of the dialog page.
    throw new Error("The iframe bundle contains '</script>'; escape it before inlining.");
}

const template = readFileSync(join(root, "src/npc-dialog.template.html"), "utf-8");
const placeholder = "<!--IFRAME_SCRIPT-->";
if (!template.includes(placeholder)) {
    throw new Error(`Placeholder ${placeholder} not found in npc-dialog.template.html`);
}
writeFileSync(
    join(root, "dist/npc-dialog.html"),
    template.replace(placeholder, () => `<script>\n${iframeJs}</script>`),
);

console.log("Built dist/api.js, dist/vite.js and dist/npc-dialog.html");
