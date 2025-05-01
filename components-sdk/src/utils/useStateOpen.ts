import {
    createContext, createElement, Dispatch, MutableRefObject, ReactNode,
    SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState
} from 'react';

type ContextValue = {
  increment: () => void;
  decrement: () => void;
  isOpen: boolean;
};

const OpenCountContext = createContext<ContextValue>({
    increment: () => {}, decrement: () => {}, isOpen: false,
});

export const useOpenCountContext = () => useContext(OpenCountContext);

export const OpenCountProvider = ({children}: {children: ReactNode}) => {
    const [openCount, setOpenCount] = useState(0);

    const increment = useCallback(() => {
        setOpenCount(c => c + 1);
    }, []);

    const decrement = useCallback(() => {
        setOpenCount(c => Math.max(0, c - 1));
    }, []);

    const isOpen = openCount > 0;

    const value = useMemo(() => ({
        increment, decrement, isOpen,
    }), [increment, decrement, isOpen]);

    return createElement(
      OpenCountContext.Provider,
      { value: value },
      children
    );
}


export function useStateOpen<T>(defaultValue: T): {
    open: T
    setOpen: Dispatch<SetStateAction<T>>,
    ignoreRef: MutableRefObject<HTMLDivElement | null>,
    closeLockRef: MutableRefObject<any>
} {
    const [open, setOpen] = useState(defaultValue);
    const ignoreRef = useRef<HTMLDivElement>(null);
    const closeLockRef = useRef<HTMLDivElement>(null);
    const { increment, decrement } = useOpenCountContext();
    useEffect(() => {
        if (!open) return;
        increment();
        return () => decrement();
    }, [open, increment, decrement]);
    const documentClick = useCallback((ev: MouseEvent) => {
        if (ignoreRef.current && ignoreRef.current.contains(ev.target as HTMLElement)) return;
        if (closeLockRef.current) return; // if there is any input you cannot close manually
        setOpen(defaultValue);
    }, [ignoreRef.current]);

    const documentKeyDown = useCallback((ev: KeyboardEvent) => {
        if (ev.key == "Enter" || ev.key == "Escape") {
            setOpen(defaultValue);
        }
    }, [])

    useEffect(() => {
        document.addEventListener('mousedown', documentClick);
        document.addEventListener('keydown', documentKeyDown);
        return () => {
            document.removeEventListener('mousedown', documentClick);
            document.removeEventListener('keydown', documentKeyDown);
        }
    }, []);

    return { open, setOpen, ignoreRef, closeLockRef }
}