import {
    Component,
    ComponentType,
    MediaGalleryItem,
    parseComponent,
    parseMediaGalleryItem,
    parseStringSelectComponentOption,
    StringSelectComponent,
    StringSelectComponentOption,
} from '../utils/componentTypes';
import { SECTIONABLE } from '../Capsule';
import { uuidv4 } from '../utils/randomGen';
import { DistanceProps, DistanceReturn, DragContextType, KeyToDeleteType } from './types';
import { distanceCenter, distanceHorizontal, distanceVertical } from './distance';
import { stateKeyType, StateManager } from '../polyfills/StateManager';

/*
    * This file gathers all configuration how components can be dragged and dropped
    * I want a single file to manage all drag and drop logic, so it's easier to maintain when new components are added
 */

export enum DroppableID {
    TOP_LEVEL,
    BUTTON,
    SECTION_EDIT_ACCESSORY,
    SECTION_ADD_ACCESSORY,
    SECTION_CONTENT,
    GALLERY_ITEM,
    STRING_SELECT,
    CONTAINER,
}



export function getDroppableOrientation(droppableId: DroppableID): (props: DistanceProps) => DistanceReturn {
    switch (droppableId) {
        case DroppableID.TOP_LEVEL:
        case DroppableID.STRING_SELECT:
        case DroppableID.CONTAINER:
        case DroppableID.SECTION_CONTENT:
            return distanceHorizontal
        case DroppableID.BUTTON:
        case DroppableID.SECTION_ADD_ACCESSORY:
        case DroppableID.GALLERY_ITEM:
            return distanceVertical
        case DroppableID.SECTION_EDIT_ACCESSORY:
            return distanceCenter
        default:
            unknownComponent(droppableId);
    }
}

export const DRAG_SUPPORT = [  // All components should be here
    ComponentType.ACTION_ROW,
    ComponentType.BUTTON,
    ComponentType.STRING_SELECT,
    ComponentType.SECTION,
    ComponentType.TEXT_DISPLAY,
    ComponentType.THUMBNAIL,
    ComponentType.MEDIA_GALLERY,
    ComponentType.FILE,
    ComponentType.SEPARATOR,
    ComponentType.CONTAINER,
];

const fastIsComponent = (arg: object): arg is Component =>
    'type' in arg &&
    typeof arg.type === 'number';

const fastIsSelectMenuOption = (arg: object): arg is StringSelectComponentOption =>
    'label' in arg &&
    typeof arg.label === 'string' &&
    'value' in arg &&
    typeof arg.value === 'string';

const fastIsMediaGalleryItem = (arg: object): arg is MediaGalleryItem =>
    'media' in arg &&
    typeof arg.media === 'object' &&
    arg.media !== null &&
    !Array.isArray(arg.media) &&
    'url' in arg.media &&
    typeof arg.media.url === 'string';

function unknownComponent(p: never): never;
function unknownComponent(p: DroppableID) {
    throw new Error('Unknown component: ' + p.toString());
}

export function isValidLocation(comp: object) {
    const isComp = fastIsComponent(comp) && DRAG_SUPPORT.includes(comp.type);
    const isSelect = !isComp && fastIsSelectMenuOption(comp);
    const isMediaGalleryItem = !isComp && !isSelect && fastIsMediaGalleryItem(comp);

    return (droppableId: DroppableID) => {
        switch (droppableId) {
            case DroppableID.TOP_LEVEL:
                return isComp || isSelect || isMediaGalleryItem;
            case DroppableID.BUTTON:
                return isComp && comp.type == ComponentType.BUTTON;
            case DroppableID.SECTION_ADD_ACCESSORY:
            case DroppableID.SECTION_EDIT_ACCESSORY:
                return (
                    (isComp && [ComponentType.BUTTON, ComponentType.THUMBNAIL].includes(comp.type)) ||
                    isMediaGalleryItem
                );
            case DroppableID.STRING_SELECT:
                return isSelect;
            case DroppableID.CONTAINER:
                return (isComp && comp.type !== ComponentType.CONTAINER) || isSelect || isMediaGalleryItem;
            case DroppableID.SECTION_CONTENT:
                return isComp && SECTIONABLE.includes(comp.type);
            case DroppableID.GALLERY_ITEM:
                return (isComp && comp.type === ComponentType.THUMBNAIL) || isMediaGalleryItem;
            default:
                unknownComponent(droppableId);
        }
    };
}

export function getValidObj(comp: object, droppableId: DroppableID) {
    let compValid;

    // Don't assume that component matches the droppableId as it's not always the case
    if (!isValidLocation(comp)(droppableId)) return null;

    if (fastIsComponent(comp) && DRAG_SUPPORT.includes(comp.type)) {
        if (comp.type === ComponentType.BUTTON && ![DroppableID.BUTTON, DroppableID.SECTION_ADD_ACCESSORY, DroppableID.SECTION_EDIT_ACCESSORY].includes(droppableId)) {
            compValid = parseComponent[ComponentType.ACTION_ROW]({
                components: [comp],
                type: ComponentType.ACTION_ROW,
            } as Component);
        } else if (comp.type === ComponentType.THUMBNAIL) {
            if ([DroppableID.SECTION_ADD_ACCESSORY, DroppableID.SECTION_EDIT_ACCESSORY].includes(droppableId)) {
                compValid = parseComponent[ComponentType.THUMBNAIL](comp);
            } else if (droppableId === DroppableID.GALLERY_ITEM) {
                compValid = parseMediaGalleryItem(comp);
            } else {
                compValid = parseComponent[ComponentType.MEDIA_GALLERY]({
                    items: [comp],
                    type: ComponentType.MEDIA_GALLERY,
                } as Component);
            }
        } else {
            compValid = parseComponent[comp.type](comp) as Component | null;
        }
        if (!compValid) return null;

    } else if (fastIsMediaGalleryItem(comp)) {
        if (droppableId === DroppableID.GALLERY_ITEM) {
            compValid = parseMediaGalleryItem(comp);
        } else if ([DroppableID.SECTION_ADD_ACCESSORY, DroppableID.SECTION_EDIT_ACCESSORY].includes(droppableId)) {
            compValid = parseComponent[ComponentType.THUMBNAIL]({
                ...comp,
                type: ComponentType.THUMBNAIL,
            });
        } else {
            compValid = parseComponent[ComponentType.MEDIA_GALLERY]({
                items: [comp],
                type: ComponentType.MEDIA_GALLERY,
            } as Component);
        }

        if (!compValid) return null;

    } else if (fastIsSelectMenuOption(comp)) {
        if (droppableId === DroppableID.STRING_SELECT) {
            compValid = parseStringSelectComponentOption(comp);
        } else {
            compValid = parseComponent[ComponentType.STRING_SELECT]({
                type: ComponentType.STRING_SELECT,
                custom_id: uuidv4(),
                options: [
                    comp
                ]
            } as StringSelectComponent);
        }

        if (!compValid) return null;
    } else {
        return null;
    }

    return compValid;
}

export function customDropActions({
    stateManager,
    keyToDelete,
    droppableId,
    key,
    value,
} : {
    stateManager: StateManager;
    keyToDelete: KeyToDeleteType | null;
    droppableId: DroppableID;
    key: stateKeyType,
    value: object
}) {
    if (droppableId === DroppableID.SECTION_ADD_ACCESSORY) {
        stateManager.wrapKey({
            key,
            toArray: true,
            innerKey: 'components',
            value: {
                type: 9,
                accessory: value,
            },
        });
        if (typeof keyToDelete?.stateKey !== 'undefined')
            stateManager.deleteKey({
                key: keyToDelete?.stateKey,
                removeKeyParent: keyToDelete?.removeKeyParent,
                decoupleFrom: keyToDelete?.decoupleFrom,
            });
        return true;
    } else if (droppableId === DroppableID.SECTION_EDIT_ACCESSORY) {
        stateManager.setKey({
            key,
            value: value,
        });
        if (typeof keyToDelete?.stateKey !== 'undefined')
            stateManager.deleteKey({
                key: keyToDelete?.stateKey,
                removeKeyParent: keyToDelete?.removeKeyParent,
                decoupleFrom: keyToDelete?.decoupleFrom,
            });
        return true;
    }

    return false;
}