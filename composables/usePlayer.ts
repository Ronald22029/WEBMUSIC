import type { Catalog, Track } from '~/types/music'

// El objeto Audio nunca se guarda en useState: no es serializable para SSR de Nuxt.
let element: HTMLAudioElement | null = null
export function usePlayer() {
  const current = useState<Track | null>('current-track', () => null)
  const queue = useState<Track[]>('play-queue', () => [])
  const index = useState('play-index', () => -1)
  const playing = useState('is-playing', () => false)
  const buffering = useState('is-buffering', () => false)
  const position = useState('play-position', () => 0)
  const duration = useState('play-duration', () => 0)
  const volume = useState('play-volume', () => 0.8)
  const error = useState('player-error', () => '')
  const shuffle = useState('player-shuffle', () => false)
  const repeatMode = useState<0 | 1 | 2>('player-repeat-mode', () => 0)
  const expanded = useState('player-expanded', () => false)
  const { data: catalog } = useNuxtData<Catalog>('music-catalog')
  const library = useLocalLibrary()

  function ensureAudio() {
    if (import.meta.server) return null
    if (!element) {
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.volume = volume.value
      audio.addEventListener('timeupdate', () => { position.value = audio.currentTime || 0 })
      audio.addEventListener('durationchange', () => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0 })
      audio.addEventListener('loadedmetadata', () => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0 })
      audio.addEventListener('waiting', () => { buffering.value = true })
      audio.addEventListener('canplay', () => { buffering.value = false })
      audio.addEventListener('playing', () => { buffering.value = false; playing.value = true })
      audio.addEventListener('pause', () => { playing.value = false })
      audio.addEventListener('ended', () => {
        playing.value = false
        if (repeatMode.value === 2) {
          audio.currentTime = 0
          void audio.play().catch(() => { error.value = 'No se pudo repetir esta canción.' })
        } else next()
      })
      audio.addEventListener('error', () => {
        playing.value = false
        buffering.value = false
        error.value = 'No se pudo reproducir este enlace. Puede estar caído o bloquear reproducción externa.'
      })
      element = audio
    }
    return element
  }

  function syncMediaSession(track: Track) {
    if (import.meta.server || !('mediaSession' in navigator) || !('MediaMetadata' in window)) return
    const artist = catalog.value?.artists.find(a => a.id === track.artistId)?.name || ''
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title, artist, album: catalog.value?.albums.find(a => a.id === track.albumId)?.title || '',
      artwork: track.cover ? [{ src: track.cover, sizes: '512x512' }] : []
    })
    const safeHandler = (name: MediaSessionAction, handler: MediaSessionActionHandler) => {
      try { navigator.mediaSession.setActionHandler(name, handler) } catch { /* acción no soportada */ }
    }
    safeHandler('play', () => { void resume() })
    safeHandler('pause', () => pause())
    safeHandler('nexttrack', () => next())
    safeHandler('previoustrack', () => previous())
    safeHandler('seekto', ({ seekTime }) => { if (typeof seekTime === 'number') seek(seekTime) })
  }

  async function start(track: Track, list?: Track[]) {
    if (!/^https:\/\//i.test(track.audioUrl)) {
      error.value = 'Esta canción todavía no tiene un enlace HTTPS de audio válido.'
      return
    }
    const audio = ensureAudio()
    if (!audio) return
    if (list?.length) {
      queue.value = list
      index.value = Math.max(0, list.findIndex(t => t.id === track.id))
    } else {
      const found = queue.value.findIndex(t => t.id === track.id)
      if (found < 0) { queue.value = [track]; index.value = 0 }
      else index.value = found
    }
    error.value = ''
    const different = current.value?.id !== track.id || audio.src !== track.audioUrl
    current.value = track
    if (different) {
      audio.pause()
      position.value = 0
      duration.value = track.duration || 0
      audio.src = track.audioUrl
      audio.load()
    }
    buffering.value = true
    try {
      await audio.play()
      playing.value = true
      buffering.value = false
      syncMediaSession(track)
      library.remember(track.id)
    } catch {
      playing.value = false
      buffering.value = false
      error.value = 'No se pudo iniciar el audio. Revisa el enlace y los permisos del servidor externo.'
    }
  }
  function pause() { ensureAudio()?.pause(); playing.value = false }
  async function resume() {
    const audio = ensureAudio()
    if (!audio || !current.value) return
    try { await audio.play(); playing.value = true; error.value = '' }
    catch { playing.value = false; error.value = 'El navegador no permitió reanudar la reproducción.' }
  }
  function toggle() { if (playing.value) pause(); else void resume() }
  function next() {
    if (!queue.value.length) return
    let i = index.value + 1
    if (shuffle.value && queue.value.length > 1) {
      i = (index.value + 1 + Math.floor(Math.random() * (queue.value.length - 1))) % queue.value.length
    }
    if (i >= queue.value.length && repeatMode.value === 1) i = 0
    if (i >= queue.value.length) { pause(); return }
    const track = queue.value[i]
    if (track) void start(track)
  }
  function previous() {
    const audio = ensureAudio()
    if (audio && audio.currentTime > 3) { seek(0); return }
    if (index.value > 0 && queue.value[index.value - 1]) void start(queue.value[index.value - 1])
    else seek(0)
  }
  function seek(seconds: number) {
    const audio = ensureAudio()
    if (audio && Number.isFinite(seconds)) audio.currentTime = Math.max(0, Math.min(seconds, duration.value || seconds))
  }
  function setVolume(value: number) {
    volume.value = Math.max(0, Math.min(1, value))
    const audio = ensureAudio()
    if (audio) audio.volume = volume.value
  }
  function cycleRepeat() { repeatMode.value = ((repeatMode.value + 1) % 3) as 0 | 1 | 2 }
  return { current, queue, index, playing, buffering, position, duration, volume, error, shuffle, repeatMode, expanded, start, pause, resume, toggle, next, previous, seek, setVolume, cycleRepeat }
}
