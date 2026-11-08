/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STATION_URL?: string;
  readonly VITE_DIRECTORY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
