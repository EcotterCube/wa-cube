/// <reference types="@workadventure/iframe-api-typings" />

/**
 * NPC dialog box - main script API.
 *
 * Opens a video-game-like dialog box at the bottom of the screen, rendered by
 * a companion iframe (see iframe.ts and the npc-dialog.html wrapper page).
 * The two scripts communicate through local player variables (see types.ts).
 *
 * Usage:
 *   await openDialog([
 *       { text: "Hello!" },
 *       { text: "Look over there...", onDisplay: () => WA.camera.set(...) },
 *   ], { name: "Robby", nextLabel: "Next", closeLabel: "Bye" });
 *   // resolves once the dialog is closed
 */

import {
    DIALOG_BOX_DATA_VARIABLE,
    DIALOG_BOX_EVENT_VARIABLE,
    DIALOG_VARIABLE_OPTIONS,
    DialogBoxData,
    DialogBoxEvent,
    DialogOptions,
    DialogStep,
} from "./types";

type UIWebsite = Awaited<ReturnType<typeof WA.ui.website.open>>;

interface OpenedDialog {
    website: UIWebsite;
    steps: DialogStep[];
    subscription: { unsubscribe: () => void };
    resolve: () => void;
}

let currentDialog: OpenedDialog | null = null;

function runStepHook(steps: DialogStep[], stepIndex: number): void {
    const hook = steps[stepIndex]?.onDisplay;
    if (!hook) {
        return;
    }
    Promise.resolve(hook()).catch((e) => console.error(`Dialog box: error in step ${stepIndex} onDisplay hook`, e));
}

/**
 * Opens the dialog box and displays the first step.
 * Resolves when the dialog is closed (last step's close button, or closeDialog()).
 * If a dialog is already open, it is closed first.
 */
export async function openDialog(steps: DialogStep[], options: DialogOptions = {}): Promise<void> {
    if (steps.length === 0) {
        return;
    }
    await closeDialog();

    const data: DialogBoxData = {
        steps: steps.map((step) => step.text),
        name: options.name,
        avatar: options.avatar,
        nextLabel: options.nextLabel ?? "Next",
        closeLabel: options.closeLabel ?? "Close",
    };
    // The data must be available before the iframe boots and reads it.
    await WA.player.state.saveVariable(DIALOG_BOX_DATA_VARIABLE, data, DIALOG_VARIABLE_OPTIONS);

    const subscription = WA.player.state.onVariableChange(DIALOG_BOX_EVENT_VARIABLE).subscribe((value) => {
        const event = value as DialogBoxEvent;
        const dialog = currentDialog;
        if (!dialog) {
            return;
        }
        if (event.type === "displayed") {
            runStepHook(dialog.steps, event.stepIndex);
        } else if (event.type === "closed") {
            closeDialog().catch((e) => console.error("Dialog box: error while closing", e));
        }
    });

    let website: UIWebsite;
    try {
        website = await WA.ui.website.open({
            url: options.dialogUrl ?? "npc-dialog.html",
            visible: true,
            allowApi: true,
            allowPolicy: "",
            position: {
                vertical: "bottom",
                horizontal: "middle",
            },
            size: {
                height: "150px",
                width: "700px",
            },
            margin: {
                bottom: "80px",
            },
        });
    } catch (e) {
        subscription.unsubscribe();
        throw e;
    }

    return new Promise<void>((resolve) => {
        currentDialog = { website, steps, subscription, resolve };
        // The iframe only reports steps reached through the "next" button,
        // so the first step's hook is triggered here.
        runStepHook(steps, 0);
    });
}

/**
 * Closes the currently opened dialog box, if any.
 * The promise returned by openDialog() resolves as a consequence.
 */
export async function closeDialog(): Promise<void> {
    const dialog = currentDialog;
    if (!dialog) {
        return;
    }
    // Cleared first so a concurrent call cannot close the same dialog twice.
    currentDialog = null;
    dialog.subscription.unsubscribe();
    try {
        await dialog.website.close();
    } catch (e) {
        console.error("Dialog box: error while closing the iframe", e);
    }
    dialog.resolve();
}
