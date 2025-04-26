export type stateKeyType = (string | number)[]


export interface StateManager {
    setKey<T>({key, value}: {
        key: stateKeyType,
        value: T
    }): void,
    appendKey<T>({key, value}: {
        key: stateKeyType,
        value: T
    }): void,
    wrapKey<T>({key, toArray, innerKey, value}: {
        key: stateKeyType,
        toArray: boolean,
        innerKey: string,
        value: T
    }): void,
    swapKey({key, newIndex}: {
        key: stateKeyType,
        oldIndex: number,
        newIndex: number,
    }): void,
    deleteKey({key, decoupleFrom, removeKeyParent}: {
        key: stateKeyType,
        decoupleFrom?: string,
        removeKeyParent?: stateKeyType
    }): void,
}

