/* بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ ﷺ InshaAllah */
import { useEffect, useRef } from "react";

export const useUpdateEffect = (effect, dependencies = []) => {
    const isInitialMount = useRef(true);
    useEffect(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      return effect();
    }, dependencies);
};