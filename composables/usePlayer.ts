import type { Track } from '~/types/music'
export function usePlayer() {
  const current = useState<Track | null>('current-track', () => null)
  const queue = useState<Track[]>('play-queue', () => [])
  const index = useState<number>('play-index', () => -1)
  const playing = useState<boolean>('is-playing', () => false)
  const position = useState<number>('play-position', () => 0)
  const duration = useState<number>('play-duration', () => 0)
  const volume = useState<number>('play-volume', () => 0.8)
  const error = useState<string>('player-error', () => '')
  const shuffle = useState<boolean>('player-shuffle', () => false)
  const repeat = useState<boolean>('player-repeat', () => false)
  const audio = useState<HTMLAudioElement | null>('audio-element', () => null)
  function getAudio() {
    if (!import.meta.client) return null
    if (!audio.value) {
      const element = new Audio()
      element.preload = 'metadata'
      element.volume = volume.value
      element.addEventListener('timeupdate', () => { position.value = element.currentTime || 0 })
      element.addEventListener('durationchange', () => { duration.value = Number.isFinite(element.duration) ? element.duration : 0 })
      element.addEventListener('ended', () => { playing.value = false; if(repeat.value) { element.currentTime=0; void element.play().catch(()=>{}); } else next() })
      element.addEventListener('error', () => { playing.value=false; error.value='No se pudo cargar este audio externo.' })
      audio.value = element
    }
    return audio.value
  }
  async function start(track: Track, list?: Track[]) {
    if (!track.audioUrl || !/^https:\/\//i.test(track.audioUrl)) {
      error.value = 'Esta canción de ejemplo aún no tiene un enlace HTTPS de audio autorizado.'
      return
    }
    const el=getAudio()
    if(!el) return
    error.value=''
    if (list?.length) { queue.value=list; index.value=list.findIndex(t=>t.id===track.id) }
    else if (!queue.value.some(t=>t.id===track.id)) { queue.value=[track]; index.value=0 }
    else index.value=queue.value.findIndex(t=>t.id===track.id)
    current.value=track
    if (el.src!==track.audioUrl) el.src=track.audioUrl
    try { await el.play(); playing.value=true
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({title:track.title,artist:track.artistId,artwork:track.cover?[{src:track.cover}]:[]})
        navigator.mediaSession.setActionHandler('play',()=>{void toggle()})
        navigator.mediaSession.setActionHandler('pause',()=>{void toggle()})
        navigator.mediaSession.setActionHandler('nexttrack',()=>next())
        navigator.mediaSession.setActionHandler('previoustrack',()=>previous())
      }
    } catch { playing.value=false; error.value='El navegador o el servidor externo bloqueó la reproducción.' }
  }
  async function toggle() {
    const el=getAudio(); if(!el) return
    if(playing.value){el.pause(); playing.value=false}
    else if(current.value) {try{await el.play();playing.value=true}catch{error.value='No se pudo reanudar la reproducción.'}}
  }
  function next(){ if(!queue.value.length)return; const nextIndex=shuffle.value ? Math.floor(Math.random()*queue.value.length) : index.value+1; if(nextIndex>=queue.value.length){playing.value=false;return} void start(queue.value[nextIndex]) }
  function previous(){if(!queue.value.length)return;const i=Math.max(0,index.value-1);void start(queue.value[i])}
  function seek(value:number){const el=getAudio();if(el&&Number.isFinite(value))el.currentTime=value}
  function setVolume(value:number){volume.value=value;const el=getAudio();if(el)el.volume=value}
  return {current,queue,playing,position,duration,volume,error,shuffle,repeat,start,toggle,next,previous,seek,setVolume}
}
