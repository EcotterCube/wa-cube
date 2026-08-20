/// <reference types="@workadventure/iframe-api-typings" />

/**
 * NPC dialog box - iframe side.
 *
 * This script runs inside the iframe opened by api.ts (see npc-dialog.html).
 * It reads the dialog content from a local player variable, renders the
 * dialog box, and reports user actions (next / close) back to the main
 * script through another local player variable. It performs no side effect
 * besides rendering: camera movements etc. are handled by the main script.
 */

import {
    DIALOG_BOX_DATA_VARIABLE,
    DIALOG_BOX_EVENT_VARIABLE,
    DIALOG_VARIABLE_OPTIONS,
    DialogBoxData,
    DialogBoxEvent,
} from "./types";
import { DIALOG_BOX_CSS } from "./style";

/** Delay between two characters of the typewriter effect. */
const TYPEWRITER_INTERVAL_MS = 25;

function sendEvent(event: DialogBoxEvent): void {
    WA.player.state
        .saveVariable(DIALOG_BOX_EVENT_VARIABLE, event, DIALOG_VARIABLE_OPTIONS)
        .catch((e) => console.error("Dialog box: could not notify the main script", e));
}

function render(data: DialogBoxData): void {
    const style = document.createElement("style");
    style.textContent = DIALOG_BOX_CSS;
    document.head.appendChild(style);

    const box = document.createElement("div");
    box.className = "dialog-box";

    // Avatar column. The wrapper page may embed a default avatar image in
    // <template id="default-avatar"> ; data.avatar (if set) takes precedence.
    const defaultAvatar = (document.querySelector("#default-avatar") as HTMLTemplateElement | null)?.content
        .querySelector("img")
        ?.getAttribute("src");
    const avatarUrl = data.avatar ?? defaultAvatar ?? undefined;
    if (avatarUrl !== undefined || data.name !== undefined) {
        const npc = document.createElement("div");
        npc.className = "npc";
        if (avatarUrl !== undefined) {
            const avatar = document.createElement("img");
            avatar.className = "npc-avatar";
            avatar.alt = data.name ?? "";
            avatar.src = avatarUrl;
            npc.appendChild(avatar);
        }
        if (data.name !== undefined) {
            const name = document.createElement("span");
            name.className = "npc-name";
            name.textContent = data.name;
            npc.appendChild(name);
        }
        box.appendChild(npc);
    }

    const content = document.createElement("div");
    content.className = "content";
    const text = document.createElement("p");
    text.className = "text";
    // The full step text is always in the DOM (revealed + hidden remainder),
    // so the layout/line-wrapping never shifts while the typewriter runs.
    // Both spans share one inline wrapper: .text is a flex container, and as
    // direct flex items the two spans would not wrap as a single paragraph.
    const textInner = document.createElement("span");
    const revealed = document.createElement("span");
    const pending = document.createElement("span");
    pending.className = "text-pending";
    textInner.append(revealed, pending);
    text.append(textInner);
    const footer = document.createElement("div");
    footer.className = "footer";
    const counter = document.createElement("span");
    counter.className = "counter";
    const button = document.createElement("button");
    button.className = "action";
    footer.append(counter, button);
    content.append(text, footer);
    box.appendChild(content);
    document.body.appendChild(box);

    // Zelda-like typewriter effect: the text appears character by character.
    let chars: string[] = [];
    let revealedCount = 0;
    let typingTimer: number | null = null;

    const applyReveal = () => {
        revealed.textContent = chars.slice(0, revealedCount).join("");
        pending.textContent = chars.slice(revealedCount).join("");
    };

    const stopTyping = () => {
        if (typingTimer !== null) {
            window.clearInterval(typingTimer);
            typingTimer = null;
        }
    };

    const finishTyping = () => {
        stopTyping();
        revealedCount = chars.length;
        applyReveal();
    };

    const startTyping = (fullText: string) => {
        stopTyping();
        // Split into code points (not UTF-16 units) so no character is ever half-shown.
        chars = Array.from(fullText);
        revealedCount = 0;
        applyReveal();
        typingTimer = window.setInterval(() => {
            revealedCount++;
            applyReveal();
            if (revealedCount >= chars.length) {
                stopTyping();
            }
        }, TYPEWRITER_INTERVAL_MS);
    };

    let stepIndex = 0;
    const update = () => {
        const isLastStep = stepIndex === data.steps.length - 1;
        startTyping(data.steps[stepIndex]);
        counter.textContent = `${stepIndex + 1}/${data.steps.length}`;
        button.textContent = isLastStep ? data.closeLabel : data.nextLabel;
        button.classList.toggle("close", isLastStep);
    };
    update();

    // The whole dialog box is clickable, not just the button (clicks on the
    // button bubble up to this same handler).
    box.addEventListener("click", () => {
        // First click while the text is still typing: reveal it instantly.
        if (typingTimer !== null) {
            finishTyping();
            return;
        }
        if (stepIndex < data.steps.length - 1) {
            stepIndex++;
            update();
            sendEvent({ type: "displayed", stepIndex, ts: Date.now() });
        } else {
            // The main script closes this iframe in reaction to this event.
            sendEvent({ type: "closed", ts: Date.now() });
        }
    });
}

/**
 * Entry point, to be called by the wrapper HTML page once iframe_api.js is loaded.
 */
export function initDialogBox(): void {
    WA.onInit()
        .then(() => {
            const data = WA.player.state.loadVariable(DIALOG_BOX_DATA_VARIABLE) as DialogBoxData | undefined;
            if (!data || !Array.isArray(data.steps) || data.steps.length === 0) {
                console.error(`Dialog box: no usable "${DIALOG_BOX_DATA_VARIABLE}" player variable found`);
                return;
            }
            render(data);
        })
        .catch((e) => console.error("Dialog box: error while initializing", e));
}
