/// <reference types="@workadventure/iframe-api-typings" />

/**
 * Showroom tutorial: an NPC bot in showroom room 1 explains the 5 rooms.
 * Triggered when the player enters the "zoneShowStep1" area (see main.ts).
 * On room-specific steps, the camera pans to the matching zone, then goes
 * back to the player at the end.
 */

import { openDialog } from "@workadventure/npc-dialog-box";

const NPC_NAME = "Cubi";

/** Extra space around a zone when the camera frames it (1 = exact zone). */
const CAMERA_PADDING = 2.5;
const CAMERA_PAN_DURATION_MS = 1500;

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const zoneRects = new Map<string, Rect>();

/** Reads the rectangle of an area object (e.g. "zoneShowStep2") from the Tiled map. */
async function getZoneRect(zoneName: string): Promise<Rect> {
    if (zoneRects.size === 0) {
        const map = await WA.room.getTiledMap();
        const walk = (layers: typeof map.layers) => {
            for (const layer of layers) {
                if (layer.type === "group") {
                    walk(layer.layers);
                } else if (layer.type === "objectgroup") {
                    for (const object of layer.objects) {
                        if (object.name && object.width !== undefined && object.height !== undefined) {
                            zoneRects.set(object.name, {
                                x: object.x ?? 0,
                                y: object.y ?? 0,
                                width: object.width,
                                height: object.height,
                            });
                        }
                    }
                }
            }
        };
        walk(map.layers);
    }
    const rect = zoneRects.get(zoneName);
    if (!rect) {
        throw new Error(`Zone "${zoneName}" not found in the map`);
    }
    return rect;
}

/** Smoothly pans (and locks) the camera on the given zone. */
async function focusZone(zoneName: string): Promise<void> {
    const rect = await getZoneRect(zoneName);
    WA.camera.set(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width * CAMERA_PADDING,
        rect.height * CAMERA_PADDING,
        true,
        true,
        CAMERA_PAN_DURATION_MS,
    );
}

const backToPlayer = () => WA.camera.followPlayer(true);

export async function startShowroomTutorial(): Promise<void> {
    await openDialog(
        [
            { text: "Bonjour, et bienvenue dans le Showroom de l'École Cube" },
            {
                text: "Vous êtes ici dans un lieu d'orientation, qui a pour but de vous aider à y voir plus clair sur les débouchés IA, No-Code et Growth Marketing adaptés à votre profil",
            },
            { text: "Je vais maintenant vous expliquer le fonctionnement du lieu" },
            {
                text: "La salle 2 vous permet de mieux comprendre l'impact de l'IA sur un certain nombre de métiers",
                onDisplay: () => focusZone("zoneShowStep2"),
            },
            {
                text: "Placez-vous sur le rectangle violet, interagissez avec l'application qui s'ouvre à l'écran, et trouvez votre métier",
            },
            {
                text: "La salle 3 a pour but de vous aider à comprendre dans quelle phase professionnelle vous êtes et vous permet d'accéder à des ressources inédites, adaptées à votre profil - Test 2 min",
                onDisplay: () => focusZone("zoneShowStep3"),
            },
            {
                text: "Dans cette salle, placez-vous sur un avatar et découvrez un témoignage de l'un de nos alumni",
                onDisplay: () => focusZone("zoneShowStep4"),
            },
            {
                text: "La terrasse est un lieu où vous pouvez librement échanger avec des personnes de la team, des alumni, des mentors",
                onDisplay: () => focusZone("zoneShowStep5"),
            },
            {
                text: "Si vous souhaitez prendre rendez-vous ou télécharger nos programmes, placez-vous sur le bouton concerné en bas de la terrasse et interagissez avec l'application qui s'ouvre",
            },
            {
                text: "Bonne visite !",
                onDisplay: backToPlayer,
            },
        ],
        {
            name: NPC_NAME,
            // Relative to the dialog page, i.e. served next to the map
            // (see the npcDialogBox({ assets }) option in the Vite configs).
            avatar: "npc-avatar.png",
            nextLabel: "Suivant",
            closeLabel: "Fermer",
        },
    );
    // Runs whatever way the dialog ended (finished, or force-closed because
    // the player walked away): give the camera back to the player.
    backToPlayer();
}
