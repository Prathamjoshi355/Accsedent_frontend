export function loadState(key: string) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}
export function saveState(key: string, value: any) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}
export function clearState(key: string) {
  try { localStorage.removeItem(key) } catch {}
}
