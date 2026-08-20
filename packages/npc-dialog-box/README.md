# @workadventure/npc-dialog-box

A reusable, video-game-like NPC dialog box for [WorkAdventure](https://workadventu.re) maps:
a fixed iframe at the bottom of the screen displaying multi-step dialogs with a
Zelda-like typewriter effect, an avatar and a next/close button. A click anywhere
on the box (or the space key) reveals the rest of the text, advances to the next
step, or closes the dialog.

The dialog UI runs in its own iframe (a self-contained `npc-dialog.html` page
shipped by this package); your map script drives it through the `openDialog()`
API. The two sides communicate through local player variables.

## Installation

```bash
npm install @workadventure/npc-dialog-box
```

Add the Vite plugin to your map project's Vite config(s) — for the
map-starter-kit, both `web.vite.config.ts` (dev) and `buildmap.vite.config.ts`
(build):

```ts
import { npcDialogBox } from "@workadventure/npc-dialog-box/vite";

export default defineConfig({
    // ...
    plugins: [
        npcDialogBox(),
        // ...the other plugins (map optimizers, etc.)
    ],
});
```

The plugin serves `npc-dialog.html` on the dev server and emits it (same
stable name) at the root of the build output, next to your optimized map.
Extra static files such as an avatar image can be copied along:

```ts
npcDialogBox({ assets: ["npc-avatar.png"] })
```

## Usage (map script)

```ts
import { openDialog, closeDialog } from "@workadventure/npc-dialog-box";

WA.room.area.onEnter("myNpcZone").subscribe(() => {
    openDialog(
        [
            { text: "Hello, adventurer!" },
            {
                text: "Look at this room on your right...",
                // Runs in YOUR script when the step is displayed - move the
                // camera, play a sound, whatever you like.
                onDisplay: () => WA.camera.set(1200, 800, 600, 400, true, true, 1000),
            },
            { text: "Good luck!", onDisplay: () => WA.camera.followPlayer(true) },
        ],
        {
            name: "Robby",
            avatar: "npc-avatar.png", // relative to the dialog page (map root)
            nextLabel: "Next",
            closeLabel: "Bye",
        },
    ).then(() => {
        // The dialog was closed (last step confirmed, or closeDialog() called).
        WA.camera.followPlayer(true);
    });
});

WA.room.area.onLeave("myNpcZone").subscribe(() => {
    closeDialog();
});
```

`openDialog(steps, options)` resolves when the dialog closes. Options:

| Option       | Default             | Description                                        |
| ------------ | ------------------- | -------------------------------------------------- |
| `name`       | –                   | NPC name displayed under the avatar                |
| `avatar`     | –                   | Avatar image URL (absolute, or relative to the dialog page) |
| `nextLabel`  | `"Next"`            | Label of the button while more steps remain        |
| `closeLabel` | `"Close"`           | Label of the button on the last step               |
| `dialogUrl`  | `"npc-dialog.html"` | URL of the dialog page, relative to the map file   |

## Without the Vite plugin

If your setup can't use the plugin, the self-contained dialog page is exported
as `@workadventure/npc-dialog-box/npc-dialog.html` — copy it (and your avatar)
next to your map file with the tool of your choice, or host it anywhere and
point `dialogUrl` at it.

## Development

```bash
npm install
npm run build   # dist/api.js, dist/vite.js, dist/npc-dialog.html + .d.ts files
```
