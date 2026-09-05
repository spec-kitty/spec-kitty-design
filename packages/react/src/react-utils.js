import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function mergeRefs(target, forwardedRef) {
  if (!forwardedRef) {
    return;
  }

  if (typeof forwardedRef === "function") {
    forwardedRef(target);
  } else {
    forwardedRef.current = target;
  }
}

export function createForwardedRefHandler(localRef, forwardedRef) {
  return (node) => {
    localRef.current = node;
    mergeRefs(node, forwardedRef);
  };
}

export function useProperties(targetElement, propName, value, resetValue) {
  useEffect(() => {
    const el = targetElement?.current;
    const nextValue = value === undefined && resetValue ? resetValue() : value;
    if (!el || nextValue === undefined || el[propName] === nextValue) {
      return;
    }

    try {
      el[propName] = nextValue;
    } catch (e) {
      console.warn(e);
    }
  }, [targetElement, propName, value]);
}

export function useEventListener(targetElement, eventName, eventHandler) {
  // keep a ref to the latest handler so we don't need to re-register the event listener
  // whenever the handler changes (avoids duplicate listeners on re-renders)
  const handlerRef = useRef(eventHandler);
  handlerRef.current = eventHandler;

  useIsomorphicLayoutEffect(() => {
    const el = targetElement?.current;
    if (!el || eventName === undefined) {
      return;
    }

    // capture the handler at the time the listener is attached so we can call cancel on it
    const eventListener = (event) => {
      const handler = handlerRef.current;
      if (handler) {
        handler(event);
      }
    };

    el.addEventListener(eventName, eventListener);

    return () => {
      const handler = handlerRef.current;
      if (handler?.cancel) {
        handler.cancel();
      }
      el.removeEventListener(eventName, eventListener);
    };
  }, [eventName, targetElement?.current]);
}
