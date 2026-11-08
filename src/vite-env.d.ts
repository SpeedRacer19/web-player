/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STATION_URL?: string;
  readonly VITE_DIRECTORY_URL?: string;
}

/** package.json version, injected by vite.config.ts. */
declare const __APP_VERSION__: string;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
