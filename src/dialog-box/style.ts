/**
 * Styles of the NPC dialog box, injected by iframe.ts.
 * Kept as a TS string (instead of a .css file) so the module works with any
 * bundler setup without a CSS loader - the whole dialog box stays importable
 * as plain TypeScript.
 */
export const DIALOG_BOX_CSS = `
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root {
    /* Match the WorkAdventure dark theme so the iframe keeps its transparency
       (a color-scheme mismatch with the embedder forces an opaque background). */
    color-scheme: dark;
}

html, body {
    height: 100%;
    background: transparent;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

body {
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.dialog-box {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    min-height: 110px;
    padding: 14px 18px;
    background: rgba(27, 27, 41, 0.95);
    border-radius: 8px;
    color: #ffffff;
    animation: dialog-box-appear 0.15s ease-out;
}

@keyframes dialog-box-appear {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.npc {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    min-width: 64px;
}

.npc-avatar {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    object-fit: contain;
    image-rendering: pixelated;
}

.npc-name {
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
}

.content {
    position: relative;
    flex-grow: 1;
    align-self: stretch;
    display: flex;
    flex-direction: column;
}

.text {
    flex-grow: 1;
    font-size: 14px;
    line-height: 1.4;
    padding-right: 8px;
    display: flex;
    align-items: center;
}

.footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
}

.counter {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
}

.action {
    font-size: 13px;
    font-weight: 600;
    padding: 6px 18px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    background: transparent;
    color: #ffffff;
    cursor: pointer;
}

.action:hover {
    background: rgba(255, 255, 255, 0.15);
}

.action.close {
    background: rgb(86, 234, 255);
    border-color: rgb(86, 234, 255);
    color: rgb(27, 27, 41);
}

.action.close:hover {
    background: rgb(140, 241, 255);
}
`;
