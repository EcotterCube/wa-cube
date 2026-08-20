/**
 * Shared types and constants for the NPC dialog box.
 * Used by both execution contexts: the main map script (api.ts) and the
 * dialog iframe (iframe.ts).
 */

export interface DialogStep {
    /** The sentence displayed in the dialog box for this step. */
    text: string;
    /**
     * Optional hook executed in the main script when this step is displayed
     * (camera movement, sound, ...). The iframe itself never runs this.
     */
    onDisplay?: () => void | Promise<void>;
}

export interface DialogOptions {
    /** NPC name displayed under the avatar. */
    name?: string;
    /**
     * Avatar image URL (absolute, or relative to the dialog page).
     * If omitted, the default avatar hardcoded in the dialog page (if any) is used.
     */
    avatar?: string;
    /** Label of the button advancing to the next step. Default: "Next". */
    nextLabel?: string;
    /** Label of the button on the last step. Default: "Close". */
    closeLabel?: string;
    /** URL of the dialog page, relative to the map file. Default: "npc-dialog.html". */
    dialogUrl?: string;
}

/** Payload of the DIALOG_BOX_DATA_VARIABLE player variable (main script -> iframe). */
export interface DialogBoxData {
    steps: string[];
    name?: string;
    avatar?: string;
    nextLabel: string;
    closeLabel: string;
}

/**
 * Payload of the DIALOG_BOX_EVENT_VARIABLE player variable (iframe -> main script).
 * `ts` makes each payload unique so that onVariableChange fires even when the
 * same event is emitted twice in a row.
 */
export type DialogBoxEvent =
    | { type: "displayed"; stepIndex: number; ts: number }
    | { type: "closed"; ts: number };

/** Local player variable carrying the dialog content, written before the iframe opens. */
export const DIALOG_BOX_DATA_VARIABLE = "dialogBoxData";
/** Local player variable used by the iframe to notify the main script of user actions. */
export const DIALOG_BOX_EVENT_VARIABLE = "dialogBoxEvent";

/** Options used for every dialog box variable write. */
export const DIALOG_VARIABLE_OPTIONS = {
    public: false,
    persist: false,
    scope: "room" as const,
};
