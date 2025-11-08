import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Disable React DevTools in production
    if (process.env.NODE_ENV === 'production') {
      const disableDevtools = () => {
        if (typeof window !== 'undefined') {
          const noop = () => {};
          const props = ['__REACT_DEVTOOLS_GLOBAL_HOOK__', '__REACT_DEVTOOLS_TARGET__'];
          props.forEach(prop => {
            Object.defineProperty(window, prop, {
              get: noop,
              set: noop,
            });
          });
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
