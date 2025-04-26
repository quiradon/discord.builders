import {COMPONENTS, SECTIONABLE} from "./Capsule";
import CapsuleStyles from "./Capsule.module.css";
import {CapsuleButton, capsuleButtonCtx} from "./CapsuleButton";
import {SectionFrame} from "./components/Section";
import { ReactElement, useEffect, useState } from 'react';
import {stateKeyType, StateManager} from "./polyfills/StateManager";
import {Component, ComponentType, PassProps} from "./utils/componentTypes";
import TimesSolid from "./icons/times-solid.svg";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates, arrayMove
} from '@dnd-kit/sortable';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';


type commonProps = {
    showSectionButton?: boolean,
    stateManager: StateManager,
    removeKeyParent?: stateKeyType,
    passProps: PassProps,
    buttonContext: capsuleButtonCtx,
    buttonClassName?: string
}

type props = {
    state: Component[],
    stateKey: stateKeyType,
} & commonProps

export function CapsuleInner({state, stateKey, stateManager, showSectionButton = true, removeKeyParent, passProps, buttonContext, buttonClassName}: props) {
    const [items, setItems] = useState<string[]>([]);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {distance: 5}
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setItems(state.map((comp) => comp._uuid));
    }, [state]);

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setItems(() => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);

                stateManager.swapKey({key: stateKey, oldIndex: oldIndex, newIndex: newIndex});
                return arrayMove(items, oldIndex, newIndex);
            })
        }
    };

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {state.map((comp, i) => <CapsuleInnerItem
                    id={comp._uuid}
                    key={comp._uuid}
                    state={comp}
                    stateKey={[...stateKey, i]}
                    stateManager={stateManager}
                    showSectionButton={showSectionButton}
                    removeKeyParent={removeKeyParent}
                    passProps={passProps}
                    buttonContext={buttonContext}
                />)}
            </SortableContext>
            <CapsuleButton context={buttonContext} className={buttonClassName} callback={value => stateManager.appendKey({key: stateKey, value})} />

            {/* CapsuleButton is inline, so you can add more buttons after <CapsuleInner .../> */}
        </DndContext>
    );
}

type itemProps = {
    id: string,
    state: Component,
    stateKey: stateKeyType,
} & commonProps;

function CapsuleInnerItem({id, state, stateKey, stateManager, showSectionButton, removeKeyParent, passProps}: itemProps) {
    const Component = COMPONENTS[state.type];
    if (typeof Component === "undefined") return null;

    // FIXME: Disable dragging when a menu is open or when editing a field `, disabled: true`
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: id});
    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return <div className={CapsuleStyles.component} ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className={CapsuleStyles.component_remove} onClick={() => {
            if (state.type === 9 || state.type === 17) {
                stateManager.deleteKey({key: stateKey, decoupleFrom: 'components', removeKeyParent});
                return;
            }

            stateManager.deleteKey({key: stateKey, removeKeyParent});
        }}><img width={14} height={14} src={TimesSolid} alt={'x'}/></div>
        <MaybeSection type={state.type} showSectionButton={showSectionButton} stateKey={stateKey} stateManager={stateManager}>
            <Component state={state} stateKey={stateKey} stateManager={stateManager} passProps={passProps}/>
        </MaybeSection>
    </div>
}

function MaybeSection({showSectionButton, type, stateKey, stateManager, children}: {
    showSectionButton: itemProps['showSectionButton'],
    stateKey: itemProps['stateKey'],
    stateManager: itemProps['stateManager']
    type: ComponentType,
    children: ReactElement
}): ReactElement {
    return (showSectionButton && SECTIONABLE.includes(type)) ?
        <SectionFrame stateKey={stateKey} stateManager={stateManager} children={children} /> : children
}