/** Prefix public/ URLs with Vite base (needed for GitHub Pages). */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const clean = path.replace(/^\/+/, '')
  return `${base}${clean}`
}
