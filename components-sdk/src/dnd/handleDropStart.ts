import {
    Component,
    ComponentType,
    ComponentTypeUnofficial,
    MediaGalleryItem,
    StringSelectComponentOption
} from '../utils/componentTypes';

const fastIsComponent = (arg: object): arg is Component => 'type' in arg && typeof arg.type === 'number';

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


export function guessComponentType(arg: object): ComponentType | ComponentTypeUnofficial | null {
    if (fastIsComponent(arg) && arg.type in ComponentType) {
        return arg.type;
    }
    if (fastIsSelectMenuOption(arg)) {
        return ComponentTypeUnofficial.STRING_SELECT_OPTION;
    }
    if (fastIsMediaGalleryItem(arg)) {
        return ComponentTypeUnofficial.MEDIA_GALLERY_ITEM;
    }
    return null;
}

const mimetypeRegex = /^application\/x-dsc-builders\[(.*)\]$/;

export function getContentType(dataTransfer: DataTransfer | null): ComponentType | ComponentTypeUnofficial | null {
    if (!dataTransfer) return null;

    const mimetype = dataTransfer.types.find(str => mimetypeRegex.test(str));
    const matches = mimetype ? mimetype.match(mimetypeRegex) : null;
    const number = matches ? Number(matches[1]) : NaN;
    if (!(number in ComponentType) && !(number in ComponentTypeUnofficial)) return null;

    return number;
}
