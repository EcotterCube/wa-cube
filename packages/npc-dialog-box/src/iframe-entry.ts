/**
 * Entry point of the iframe bundle inlined into dist/npc-dialog.html by
 * build.mjs. The page's iframe_api.js loader script runs before this bundle
 * (both are parser-blocking), so the WA global is available here.
 */
import { initDialogBox } from "./iframe";

initDialogBox();
