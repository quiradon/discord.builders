import { ClosestState, DistanceProps, DragContextType } from './types';
import { MOVE_THRESHOLD } from './distance';
import { ComponentType, ComponentTypeUnofficial, TextDisplayComponent } from '../utils/componentTypes';
import { default_settings } from '../Capsule';
import { getDroppableOrientation, isValidLocation } from './components';
import { getContentType } from './handleDropStart';

function assertValidJSON(arg: unknown): asserts arg is object {
    if (typeof arg !== 'object' || arg === null) throw new Error('Invalid component type');
    if (Array.isArray(arg)) throw new Error('Invalid component type');
}


export function getJSON(dataTransfer: DataTransfer | null): object | null {
    if (!dataTransfer) return null;

    const data = dataTransfer.getData('application/json') || dataTransfer.getData('text/plain');
    // if (!data) return null;

    let jsonData;
    try {
        jsonData = JSON.parse(data);
        assertValidJSON(jsonData);
    } catch (e) {
        jsonData = {
            ...default_settings.TextDisplay(),
            content: data
        } as TextDisplayComponent;
    }

    return jsonData;
}

export const handleDragOver = (
    e: DragEvent,

    {
        refs,
        visible,
        setVisible
    }: {
        refs: DragContextType['refs'];
        visible: DragContextType['visible'];
        setVisible: DragContextType['setVisible'];
    }
) => {
    if (!e.dataTransfer) return null;

    const comp = getContentType(e.dataTransfer);
    e.preventDefault();

    const mouseY: number = e.clientY;
    const mouseX: number = e.clientX;
    let closest: ClosestState | undefined;
    let closestDistance: number = +Infinity;
    let activeDistance: number = +Infinity;

    const locationChecker = isValidLocation(comp);
    refs.current.forEach((ref) => {
        if (ref.element === null || !document.body.contains(ref.element)) return; // skip if not in DOM
        if (!locationChecker(ref.droppableId)) return;

        const distanceProps = {
            closest,
            closestDistance,
            ref,
            visible,
            activeDistance,
            mouseY,
            mouseX
        } as DistanceProps;
        const distanceFunc = getDroppableOrientation(ref.droppableId);
        ({
            closest,
            closestDistance,
            activeDistance
        } = distanceFunc(distanceProps));
    });

    const hasChanged = closest?.ref?.element !== visible?.ref?.element || closest?.type !== visible?.type;
    const totalDistance = Math.abs(activeDistance - closestDistance);
    if (hasChanged && totalDistance > MOVE_THRESHOLD) setVisible(closest ?? null);
};