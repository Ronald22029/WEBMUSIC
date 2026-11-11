import type { Track } from '~/types/music'
const STORAGE_KEY = 'webmusic.library.v1'
export function useLocalLibrary() {
  const favorites = useState<string[]>('wm-favorites', () => [])
  const recent = useState<string[]>('wm-recent', () => [])
  const hydrated = useState('wm-hydrated', () => false)
  function save() {
    if (import.meta.server || !hydrated.value) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ favorites: favorites.value, recent: recent.value })) }
    catch { /* modo privado o almacenamiento bloqueado */ }
  }
  function hydrate() {
    if (import.meta.server || hydrated.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          const data = parsed as Record<string, unknown>
          favorites.value = Array.isArray(data.favorites) ? data.favorites.filter((id): id is string => typeof id === 'string').slice(0, 2000) : []
          recent.value = Array.isArray(data.recent) ? data.recent.filter((id): id is string => typeof id === 'string').slice(0, 40) : []
        }
      }
    } catch { /* datos locales inválidos */ }
    hydrated.value = true
  }
  function isFavorite(id: string) { return favorites.value.includes(id) }
  function toggleFavorite(id: string) {
    favorites.value = isFavorite(id) ? favorites.value.filter(x => x !== id) : [id, ...favorites.value]
    save()
  }
  function remember(id: string) { recent.value = [id, ...recent.value.filter(x => x !== id)].slice(0, 30); save() }
  function favoriteTracks(tracks: Track[]) { const lookup = new Map(tracks.map(t => [t.id, t])); return favorites.value.map(id => lookup.get(id)).filter((x): x is Track => !!x) }
  function recentTracks(tracks: Track[]) { const lookup = new Map(tracks.map(t => [t.id, t])); return recent.value.map(id => lookup.get(id)).filter((x): x is Track => !!x) }
  return { favorites, recent, hydrated, hydrate, isFavorite, toggleFavorite, remember, favoriteTracks, recentTracks }
}
