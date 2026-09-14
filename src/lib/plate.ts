/** Mask plate for privacy: 浙A12348 → 浙A···8 */
export function maskPlate(plate: string): string {
  const p = plate.trim().toUpperCase()
  if (!p) return '···'
  if (p.length <= 3) return `${p[0] ?? ''}···`
  return `${p.slice(0, 2)}···${p.slice(-1)}`
}
