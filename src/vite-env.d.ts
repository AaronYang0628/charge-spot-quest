/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Unset = mock; "/" or "same" = same-origin /api; else absolute API origin */
  readonly VITE_API_BASE?: string
  readonly VITE_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
