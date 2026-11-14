import type { Catalog, Track } from '~/types/music'

export type QueueScope = {
  source: 'album' | 'artist' | 'search'
  albumId?: string; artistId?: string; genre?: string; q?: string
  offset: number; loaded?: number; total?: number
}
let element: HTMLAudioElement | null = null
let revision = 0
let bufferingTimer: ReturnType<typeof setTimeout> | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let recoveryPending = false
let failuresInRow = 0
const attempts = new Map<string, number>()
const MAX_CONSECUTIVE_FAILURES = 6
const START_TIMEOUT_MS = 16000
const STALL_TIMEOUT_MS = 22000
function clearRecoveryTimers() {
  if (bufferingTimer) clearTimeout(bufferingTimer)
  if (retryTimer) clearTimeout(retryTimer)
  bufferingTimer = retryTimer = null
}
// Un objeto Audio compartido durante la sesión; nunca serializarlo en useState.
export function usePlayer() {
  const current = useState<Track | null>('current-track', () => null)
  const queue = useState<Track[]>('play-queue', () => [])
  const index = useState('play-index', () => -1)
  const queueScope = useState<QueueScope | null>('play-queue-scope', () => null)
  const playing = useState('is-playing', () => false)
  const buffering = useState('is-buffering', () => false)
  const loadingMore = useState('play-loading-more', () => false)
  const position = useState('play-position', () => 0)
  const duration = useState('play-duration', () => 0)
  const volume = useState('play-volume', () => 0.8)
  const error = useState('player-error', () => '')
  const shuffle = useState('player-shuffle', () => false)
  const repeatMode = useState<0 | 1 | 2>('player-repeat-mode', () => 0)
  const expanded = useState('player-expanded', () => false)
  const { data: catalog } = useNuxtData<Catalog>('music-catalog')
  const library = useLocalLibrary()

  function scheduleStallTimeout(timeout: number, currentRevision = revision) {
    if (bufferingTimer) clearTimeout(bufferingTimer)
    bufferingTimer = setTimeout(() => {
      if (currentRevision === revision && current.value && buffering.value) {
        handlePlaybackFailure('El servidor dejó de responder.', currentRevision)
      }
    }, timeout)
  }

  function handlePlaybackFailure(reason: string, currentRevision = revision, permissionBlocked = false) {
    if (currentRevision !== revision || recoveryPending || !current.value) return
    recoveryPending = true
    clearRecoveryTimers()
    buffering.value = false
    playing.value = false
    const audio = element
    audio?.pause()
    const track = current.value
    if (permissionBlocked) {
      error.value = 'El navegador bloqueó la reproducción. Pulsa Reproducir para continuar.'
      recoveryPending = false
      return
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      error.value = 'Sin conexión. Comprueba internet y pulsa Reproducir para reintentar.'
      recoveryPending = false
      return
    }
    const count = attempts.get(track.id) || 0
    if (count < 1) {
      attempts.set(track.id, count + 1)
      error.value = `Problema con «${track.title}». Reintentando una vez…`
      retryTimer = setTimeout(() => {
        if (revision !== currentRevision) return
        recoveryPending = false
        void start(track, undefined, undefined, true)
      }, 800)
    } else {
      failuresInRow++
      error.value = failuresInRow >= MAX_CONSECUTIVE_FAILURES
        ? 'Varias canciones consecutivas fallaron. Se detuvo la reproducción para evitar un ciclo.'
        : `No se pudo escuchar «${track.title}»: ${reason} Saltando a la siguiente canción.`
      if (failuresInRow >= MAX_CONSECUTIVE_FAILURES) {
        recoveryPending = false
        audio?.pause()
        return
      }
      retryTimer = setTimeout(() => {
        if (revision !== currentRevision) return
        recoveryPending = false
        void next(true)
      }, 550)
    }
  }

  function ensureAudio() {
    if (import.meta.server) return null
    if (!element) {
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.volume = volume.value
      audio.addEventListener('timeupdate', () => {
        position.value = audio.currentTime || 0
        if (buffering.value && !audio.paused) scheduleStallTimeout(STALL_TIMEOUT_MS)
        // Unos segundos de audio real demuestran que el enlace funciona;
        // no considerar un simple evento "playing" como reproducción estable.
        if (!buffering.value && audio.currentTime >= 5 && current.value) {
          failuresInRow = 0
          attempts.delete(current.value.id)
        }
      })
      audio.addEventListener('durationchange', () => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0 })
      audio.addEventListener('loadedmetadata', () => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0 })
      audio.addEventListener('waiting', () => {
        if (!audio.paused) { buffering.value = true; scheduleStallTimeout(STALL_TIMEOUT_MS) }
      })
      audio.addEventListener('stalled', () => {
        if (!audio.paused) { buffering.value = true; scheduleStallTimeout(STALL_TIMEOUT_MS) }
      })
      audio.addEventListener('canplay', () => { if (!audio.paused) buffering.value = false })
      audio.addEventListener('playing', () => {
        if (bufferingTimer) clearTimeout(bufferingTimer)
        bufferingTimer = null
        buffering.value = false; playing.value = true
      })
      audio.addEventListener('pause', () => { playing.value = false })
      audio.addEventListener('ended', () => {
        playing.value = false
        if (repeatMode.value === 2) {
          audio.currentTime = 0
          const endedRevision = revision
          void audio.play().catch(() => handlePlaybackFailure('No se pudo repetir la pista.',endedRevision))
        } else void next(true)
      })
      audio.addEventListener('error', () => {
        if (current.value) handlePlaybackFailure('El enlace externo no responde.')
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
      try { navigator.mediaSession.setActionHandler(name, handler) } catch { /* no soportado */ }
    }
    safeHandler('play', () => { void resume() })
    safeHandler('pause', () => pause())
    safeHandler('nexttrack', () => { void next() })
    safeHandler('previoustrack', () => previous())
    safeHandler('seekto', ({ seekTime }) => { if (typeof seekTime === 'number') seek(seekTime) })
  }

  async function start(track: Track, list?: Track[], scope?: QueueScope, automatic = false) {
    const thisRevision = ++revision
    clearRecoveryTimers()
    recoveryPending = false
    if (!automatic) { failuresInRow = 0; attempts.clear() }
    if (!/^https:\/\//i.test(track.audioUrl)) {
      if (automatic) {
        current.value = track
        handlePlaybackFailure('No contiene enlace HTTPS.', thisRevision)
      } else error.value = 'La canción no tiene un enlace HTTPS válido. Revisa el catálogo.'
      return
    }
    const audio = ensureAudio()
    if (!audio) return
    if (list?.length) {
      queue.value = [...list]
      index.value = Math.max(0, list.findIndex(t => t.id === track.id))
      queueScope.value = scope ? { ...scope, loaded: list.length } : null
    } else {
      const found = queue.value.findIndex(t => t.id === track.id)
      if (found < 0) { queue.value = [track]; index.value = 0; queueScope.value = null }
      else index.value = found
    }
    if (!automatic) error.value = ''
    const different = current.value?.id !== track.id || audio.src !== track.audioUrl || !!audio.error || (automatic && (attempts.get(track.id)||0)>0)
    current.value = track
    if (different) {
      audio.pause()
      position.value = 0
      duration.value = track.duration || 0
      audio.src = track.audioUrl
      audio.load()
    }
    buffering.value = true
    scheduleStallTimeout(START_TIMEOUT_MS, thisRevision)
    try {
      await audio.play()
      if (thisRevision !== revision) return
      playing.value = true
      buffering.value = false
      if (bufferingTimer) clearTimeout(bufferingTimer)
      bufferingTimer = null
      syncMediaSession(track)
      library.remember(track.id)
    } catch (cause) {
      if (thisRevision !== revision) return
      const permissionBlocked = cause instanceof DOMException && cause.name === 'NotAllowedError'
      handlePlaybackFailure('El servidor externo impidió reproducirla.', thisRevision, permissionBlocked)
    }
  }
  function pause() {
    ++revision
    clearRecoveryTimers()
    recoveryPending = false
    ensureAudio()?.pause()
    buffering.value = false
    playing.value = false
  }
  async function resume() {
    const audio = ensureAudio()
    if (!audio || !current.value) return
    const currentTrack = current.value
    if (audio.error || !audio.src) { await start(currentTrack); return }
    const thisRevision = ++revision
    clearRecoveryTimers()
    recoveryPending = false
    buffering.value = true
    scheduleStallTimeout(START_TIMEOUT_MS, thisRevision)
    try {
      await audio.play()
      if (revision !== thisRevision) return
      playing.value = true; buffering.value = false; error.value = ''
      if (bufferingTimer) clearTimeout(bufferingTimer)
      bufferingTimer = null
    } catch (cause) {
      if (revision !== thisRevision) return
      handlePlaybackFailure('No se pudo reanudar.', thisRevision,cause instanceof DOMException && cause.name==='NotAllowedError')
    }
  }
  function toggle() { if (playing.value) pause(); else void resume() }

  async function loadNextPage(): Promise<boolean> {
    const scope = queueScope.value
    if (!scope || loadingMore.value || (scope.total !== undefined && (scope.offset + (scope.loaded || 0)) >= scope.total)) return false
    loadingMore.value = true
    try {
      const response = await $fetch<{rows:Track[];total:number}>('/api/tracks', {
        query: {
          albumId:scope.albumId,artistId:scope.artistId,genre:scope.genre,q:scope.q,
          offset:scope.offset + (scope.loaded || 0),limit:100
        }
      })
      if (response.rows.length) {
        const present = new Set(queue.value.map(t => t.id))
        queue.value = [...queue.value,...response.rows.filter(t => !present.has(t.id))]
        queueScope.value = {...scope,loaded:(scope.loaded || 0) + response.rows.length,total:response.total}
      } else {
        queueScope.value = {...scope,total:scope.offset + (scope.loaded || 0)}
      }
      return response.rows.length > 0
    } catch {
      error.value = 'No se pudo cargar la siguiente página de canciones.'
      return false
    } finally { loadingMore.value = false }
  }

  async function next(automatic = false) {
    if (!automatic) { failuresInRow = 0; attempts.clear(); clearRecoveryTimers(); recoveryPending = false }
    const originRevision = revision
    if (!queue.value.length || loadingMore.value) return
    if (index.value < queue.value.length - 1) {
      if (shuffle.value && queue.value.length > 1) {
        const choices = queue.value.map((_, i) => i).filter(i => i !== index.value)
        const selected = choices[Math.floor(Math.random() * choices.length)]
        if (selected !== undefined && queue.value[selected]) void start(queue.value[selected],undefined,undefined,automatic)
      } else {
        const following = queue.value[index.value+1]
        if (following) void start(following,undefined,undefined,automatic)
      }
      return
    }
    if (await loadNextPage()) {
      if (originRevision !== revision) return
      const following = queue.value[index.value+1]
      if (following) void start(following)
      return
    }
    if (repeatMode.value === 1 && queue.value[0]) void start(queue.value[0],undefined,undefined,automatic)
    else pause()
  }
  function previous() {
    const audio = ensureAudio()
    if (audio && audio.currentTime > 3) { seek(0); return }
    const i = index.value > 0 ? index.value - 1 : (repeatMode.value === 1 ? queue.value.length-1 : -1)
    if (i >= 0 && queue.value[i]) void start(queue.value[i])
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
  function enqueue(track:Track) {
    if (!/^https:\/\//i.test(track.audioUrl)) return
    if (!current.value) { void start(track,[track]);return }
    if (!queue.value.some(t=>t.id===track.id)) { queue.value=[...queue.value,track];queueScope.value=null }
  }
  function playNext(track:Track) {
    if (!/^https:\/\//i.test(track.audioUrl))return
    if (!current.value){void start(track,[track]);return}
    if (current.value.id===track.id)return
    const trimmed=queue.value.filter((t,i)=>t.id!==track.id||i===index.value)
    queue.value=[...trimmed.slice(0,index.value+1),track,...trimmed.slice(index.value+1)]
    queueScope.value=null
  }
  function removeFromQueue(position:number){
    if(position<=index.value||position>=queue.value.length)return
    queue.value=queue.value.filter((_,i)=>i!==position)
    // Una cola modificada manualmente deja de tener paginación automática coherente.
    queueScope.value=null
  }
  function clearUpcoming(){queue.value=queue.value.slice(0,index.value+1);queueScope.value=null}
  function cycleRepeat() { repeatMode.value = ((repeatMode.value + 1) % 3) as 0 | 1 | 2 }
  return { current, queue, index, queueScope, playing, buffering, loadingMore, position, duration, volume, error, shuffle, repeatMode, expanded,
    start, pause, resume, toggle, next, previous, seek, setVolume, enqueue, playNext, removeFromQueue, clearUpcoming, cycleRepeat }
}
