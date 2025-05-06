import { DragEvent as ReactDragEvent, HTMLProps, ReactNode, RefObject, useCallback, useEffect, useRef } from 'react';
import Styles from './DragLine.module.css';
import { stateKeyType } from '../polyfills/StateManager';
import { uuidv4 } from '../utils/randomGen';
import { ClosestType, DragContextType, DroppableState } from './types';
import { useDragContext } from './DragContext';
import { DroppableID } from './components';
import Trash from '../icons/TrashWhite.svg';
import { ComponentsProps } from '../Capsule';

export function useDragLine({
    stateKey,
    droppableId,
}: {
    stateKey: stateKeyType;
    droppableId: DroppableID | null;
}): { ref: RefObject<HTMLDivElement | undefined> } & Pick<DragContextType, 'visible' | 'setVisible' | 'keyToDelete'> {
    const { register, unregister, visible, setVisible, keyToDelete } = useDragContext();
    const el = useRef<HTMLDivElement>();

    useEffect(() => {
        if (droppableId === null) return;

        const droppableState: DroppableState = {
            element: el.current || null,
            stateKey,
            droppableId,
        };

        register(droppableState);
        return () => unregister(droppableState);
    }, [register, unregister, droppableId, stateKey]);

    return { ref: el, visible, setVisible, keyToDelete };
}

interface DragLinesProps {
    children: ReactNode,
    data: object,
    stateKey: stateKeyType,
    defaultType?: ClosestType,
    draggable?: boolean,
    dragDisabled?: boolean,
    droppableId: DroppableID | null   // Set to null to disable dropping
    removeKeyParent?: stateKeyType,
    dragKeyToDeleteOverwrite?: ComponentsProps['dragKeyToDeleteOverwrite']
}


export function DragLines(
    { children, data, stateKey, defaultType = ClosestType.UP, draggable = false, dragDisabled = false, droppableId, removeKeyParent, dragKeyToDeleteOverwrite } : DragLinesProps
) {
    const { ref: el, visible, setVisible, keyToDelete } = useDragLine({stateKey, droppableId});

    const onDragStart = useCallback((e: ReactDragEvent) => {
        const json = JSON.stringify(data, null, 4);
        // e.dataTransfer.setData("text/uri-list", "https://www.mozilla.org");
        e.dataTransfer.effectAllowed = "copyMove";
        e.dataTransfer.setData("application/json", json);
        e.dataTransfer.setData("text/plain", json);
        const sessionId = uuidv4();
        keyToDelete.current = typeof dragKeyToDeleteOverwrite !== "undefined" ? { sessionId, ...dragKeyToDeleteOverwrite } : { sessionId, stateKey, removeKeyParent };
        e.dataTransfer.setData("application/x-dsc-builders-id", sessionId);
        e.dataTransfer.setDragImage(el.current!, 0, 0);
        e.stopPropagation();
    }, [data, stateKey, removeKeyParent, dragKeyToDeleteOverwrite]);

    const onMouseDown = useCallback(() => {
        if (droppableId === null || typeof defaultType === "undefined") return;
        setVisible({
            ref: {
                element: el.current || null,
                stateKey,
                droppableId: droppableId,
            },
            type: defaultType,
        });
    }, [setVisible, el, droppableId]);

    const amIVisible = !!el.current && visible?.ref.element === el.current && droppableId !== null;

    const amIVisibleTop = amIVisible && visible.type === ClosestType.UP;
    const amIVisibleBottom = amIVisible && visible.type === ClosestType.DOWN;
    const amIVisibleLeft = amIVisible && visible.type === ClosestType.LEFT;
    const amIVisibleRight = amIVisible && visible.type === ClosestType.RIGHT;
    const amIVisibleCenter = amIVisible && visible.type === ClosestType.CENTER;

    const props: HTMLProps<HTMLDivElement> = !dragDisabled ? {
        onMouseDown,
        onDragStart,
        draggable: true,
    } : {}

    return (
        <div className={Styles.draglines} data-image-role="drag">
            {!draggable && <div className={Styles.draghandler} {...props}>
                {/*{moveMe && <div className={Styles.moveMe}>MOVE ME</div>}*/}
                <svg height={13} width={8} viewBox="0 0 5 8" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.87122 1.12872C1.87122 1.64545 1.45233 2.06433 0.935608 2.06433C0.418886 2.06433 0 1.64545 0 1.12872C0 0.612001 0.418886 0.193115 0.935608 0.193115C1.45233 0.193115 1.87122 0.612001 1.87122 1.12872Z"/>
                    <path d="M4.74243 1.12872C4.74243 1.64545 4.32355 2.06433 3.80682 2.06433C3.2901 2.06433 2.87122 1.64545 2.87122 1.12872C2.87122 0.612001 3.2901 0.193115 3.80682 0.193115C4.32355 0.193115 4.74243 0.612001 4.74243 1.12872Z"/>
                    <path d="M1.87122 3.99994C1.87122 4.51666 1.45233 4.93555 0.935608 4.93555C0.418886 4.93555 0 4.51666 0 3.99994C0 3.48322 0.418886 3.06433 0.935608 3.06433C1.45233 3.06433 1.87122 3.48322 1.87122 3.99994Z"/>
                    <path d="M4.74243 3.99994C4.74243 4.51666 4.32355 4.93555 3.80682 4.93555C3.2901 4.93555 2.87122 4.51666 2.87122 3.99994C2.87122 3.48322 3.2901 3.06433 3.80682 3.06433C4.32355 3.06433 4.74243 3.48322 4.74243 3.99994Z"/>
                    <path d="M1.87122 6.87115C1.87122 7.38788 1.45233 7.80676 0.935608 7.80676C0.418886 7.80676 0 7.38788 0 6.87115C0 6.35443 0.418886 5.93555 0.935608 5.93555C1.45233 5.93555 1.87122 6.35443 1.87122 6.87115Z"/>
                    <path d="M4.74243 6.87115C4.74243 7.38788 4.32355 7.80676 3.80682 7.80676C3.2901 7.80676 2.87122 7.38788 2.87122 6.87115C2.87122 6.35443 3.2901 5.93555 3.80682 5.93555C4.32355 5.93555 4.74243 6.35443 4.74243 6.87115Z"/>
                </svg>
            </div>}
            <div ref={el} {...(draggable ? props : {})} data-image-role="drag">{children}</div>
            {amIVisibleTop && <div key={'top-dragline'} className={Styles.dragline} style={{top: -6}} />}
            {amIVisibleBottom && <div key={'bottom-dragline'} className={Styles.dragline} style={{bottom: -6}} />}
            {amIVisibleLeft && <div key={'left-dragline'} className={Styles.dragline_hor} style={{left: -6}} />}
            {amIVisibleRight && <div key={'right-dragline'} className={Styles.dragline_hor} style={{right: -6}} />}
            {amIVisibleCenter && <div key={'center-dragline'} className={Styles.dragline_cen}>
                <img src={Trash} alt="" />
            </div>}
        </div>
    );
}