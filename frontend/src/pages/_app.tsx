import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Disable React DevTools in production (only if properties are configurable)
    if (process.env.NODE_ENV === 'production') {
      const disableDevtools = () => {
        if (typeof window !== 'undefined') {
          const noop = () => {};
          const props = ['__REACT_DEVTOOLS_GLOBAL_HOOK__', '__REACT_DEVTOOLS_TARGET__'] as const;

          const safelyOverride = (prop: (typeof props)[number]) => {
            const descriptor = Object.getOwnPropertyDescriptor(window, prop);
            if (descriptor && descriptor.configurable === false) {
              return; // avoid redefining non-configurable property (prevents hosting error)
            }
            try {
              Object.defineProperty(window, prop, {
                configurable: true,
                get: noop,
                set: noop,
              });
            } catch {
              try {
                // Fallback: delete then assign noop
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                delete (window as any)[prop];
                Object.defineProperty(window, prop, {
                  configurable: true,
                  get: noop,
                  set: noop,
                });
              } catch {
                // swallow errors
              }
            }
          };

          props.forEach(safelyOverride);
        }
      };
      disableDevtools();
    }

    // Remove console methods in production
    if (process.env.NODE_ENV === 'production') {
      const noop = () => {};
      console.log = noop;
      console.debug = noop;
      console.info = noop;
      console.warn = noop;
    }
  }, []);

  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
