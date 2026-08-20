/**
 * Vite plugin integrating the NPC dialog box into a WorkAdventure map project.
 *
 * - Build: emits the self-contained dialog page as `npc-dialog.html` at the
 *   root of the build output (a stable, un-hashed name: it is the default
 *   `dialogUrl` that openDialog() resolves relative to the map file), plus
 *   any extra static assets.
 * - Dev: serves the same files on the dev server, so the URLs are identical
 *   in dev and production.
 */
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

export interface NpcDialogBoxOptions {
    /**
     * Extra static files (e.g. an NPC avatar image) copied as-is next to the
     * map in the build output and served at /<basename> by the dev server.
     * Paths are relative to the directory Vite is run from.
     */
    assets?: string[];
}

const DIALOG_PAGE_NAME = "npc-dialog.html";

const MIME_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
};

export function npcDialogBox(options: NpcDialogBoxOptions = {}): Plugin {
    // The built dialog page sits next to this file (dist/) in the published package.
    const dialogPagePath = fileURLToPath(new URL(`./${DIALOG_PAGE_NAME}`, import.meta.url));
    const assets = options.assets ?? [];

    return {
        name: "npc-dialog-box",

        generateBundle() {
            this.emitFile({
                type: "asset",
                fileName: DIALOG_PAGE_NAME,
                source: readFileSync(dialogPagePath, "utf-8"),
            });
            for (const asset of assets) {
                this.emitFile({
                    type: "asset",
                    fileName: basename(asset),
                    source: readFileSync(asset),
                });
            }
        },

        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const path = (req.url ?? "").split("?")[0];
                if (path === `/${DIALOG_PAGE_NAME}`) {
                    res.setHeader("Content-Type", "text/html; charset=utf-8");
                    res.end(readFileSync(dialogPagePath, "utf-8"));
                    return;
                }
                const asset = assets.find((a) => path === `/${basename(a)}`);
                if (asset !== undefined) {
                    const mime = MIME_TYPES[extname(asset).toLowerCase()];
                    if (mime !== undefined) {
                        res.setHeader("Content-Type", mime);
                    }
                    res.end(readFileSync(asset));
                    return;
                }
                next();
            });
        },
    };
}
