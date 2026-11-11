<script setup lang="ts">
import { AlertTriangle, ExternalLink, Eye, EyeOff } from 'lucide-vue-next'
import { dailymotionVideoId } from '~/utils/media'
import { dailymotionBridge } from '~/utils/dailymotion-bridge'

type Player = {
  play:()=>Promise<unknown>|void
  pause:()=>Promise<unknown>|void
  seek:(time:number)=>Promise<unknown>|void
  setVolume:(volume:number)=>Promise<unknown>|void
  on:(name:string,handler:(state?:Record<string,unknown>)=>void)=>unknown
  destroy?:()=>Promise<unknown>|void
}
type SDK = {
  createPlayer:(elementId:string, options:{video:string;params?:{autoplay:boolean}})=>Promise<Player>
  events?:Record<string,string>
}
declare global { interface Window { dailymotion?:SDK } }
const p=usePlayer()
const runtime=useRuntimeConfig()
const playerId=String(runtime.public.dailymotionPlayerId||'').trim()
const videoId=computed(()=>dailymotionVideoId(p.current.value?.audioUrl||''))
const enabled=computed(()=>!!videoId.value)
const containerId='webmusic-dailymotion-instance'
const ready=ref(false)
const reason=ref('')
let active:Player|null=null
let job=0

function stopPlayer(){
  job++
  ready.value=false
  if(active){
    dailymotionBridge.disconnect(active)
    try {void Promise.resolve(active.pause()).catch(()=>{})}catch{}
    try {void Promise.resolve(active.destroy?.()).catch(()=>{})}catch{}
  }
  active=null
  if(enabled.value) p.playing.value=false
}
function loadSdk(id:string):Promise<SDK>{
  if(window.dailymotion?.createPlayer)return Promise.resolve(window.dailymotion)
  return new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-wm-dailymotion]')
    if(existing){
      const check=()=>window.dailymotion?.createPlayer?resolve(window.dailymotion):reject(new Error('El SDK de Dailymotion no inició'))
      existing.addEventListener('load',check,{once:true})
      existing.addEventListener('error',()=>reject(new Error('No se pudo cargar el SDK')),{once:true})
      return
    }
    const script=document.createElement('script')
    script.setAttribute('data-wm-dailymotion','true')
    script.async=true
    script.src='https://geo.dailymotion.com/libs/player/'+encodeURIComponent(id)+'.js'
    script.onload=()=>window.dailymotion?.createPlayer?resolve(window.dailymotion):reject(new Error('El SDK no está disponible'))
    script.onerror=()=>reject(new Error('No se pudo descargar el SDK de Dailymotion'))
    document.head.append(script)
  })
}
async function begin(){
  if(!videoId.value)return
  stopPlayer()
  const thisJob=job
  reason.value=''
  if(!playerId||!/^[a-z0-9]+$/i.test(playerId)){
    reason.value='Configura NUXT_PUBLIC_DAILYMOTION_PLAYER_ID para iniciar la prueba.'
    p.dmStatus.value='blocked'
    p.buffering.value=false
    return
  }
  p.dmStatus.value='loading'
  p.buffering.value=true
  await nextTick()
  try{
    const sdk=await loadSdk(playerId)
    if(thisJob!==job)return
    const player=await sdk.createPlayer(containerId,{video:videoId.value!,params:{autoplay:false}})
    if(thisJob!==job){void player.destroy?.();return}
    active=player
    dailymotionBridge.connect(player)
    const events=sdk.events||{}
    const on=(name:string,fn:(state?:Record<string,unknown>)=>void)=>{if(events[name])player.on(events[name],fn)}
    on('VIDEO_PLAYING',()=>{p.playing.value=true;p.buffering.value=false;p.dmStatus.value='ready'})
    on('VIDEO_PLAY',()=>{p.playing.value=true;p.buffering.value=false})
    on('VIDEO_PAUSE',()=>{p.playing.value=false;p.buffering.value=false})
    on('VIDEO_TIMECHANGE',(state)=>{const t=Number(state?.videoTime);if(Number.isFinite(t))p.position.value=t})
    on('VIDEO_DURATIONCHANGE',(state)=>{const d=Number(state?.videoDuration);if(d>0)p.duration.value=d})
    on('VIDEO_END',()=>{p.playing.value=false;p.next()})
    on('PLAYER_ERROR',()=>{p.playing.value=false;p.dmStatus.value='blocked';reason.value='Dailymotion no pudo reproducir el video. Usa el reproductor visible o abre el enlace original.';p.dmShowVideo.value=true})
    on('PLAYER_PLAYBACKPERMISSION',(state)=>{if(state?.playerPlaybackPermissionReason&&state.playerPlaybackPermissionReason!=='allowed'){reason.value='El navegador o Dailymotion no permite reproducción oculta. Prueba el modo visible.';p.dmStatus.value='blocked';p.dmShowVideo.value=true}})
    void Promise.resolve(player.setVolume(p.volume.value)).catch(()=>{})
    ready.value=true
    p.dmStatus.value='ready'
    p.buffering.value=false
    // El clic previo puede no autorizar autoplay después de cargar el SDK.
    // No inventamos estado de reproducción: depende del evento VIDEO_PLAYING.
    await Promise.resolve(player.play()).catch(()=>{reason.value='No inició automáticamente. Abre el video visible y pulsa Reproducir.';p.dmShowVideo.value=true})
  }catch(e){
    if(thisJob!==job)return
    reason.value=e instanceof Error?e.message:'Dailymotion no pudo cargar el reproductor.'
    p.dmStatus.value='blocked';p.buffering.value=false;p.dmShowVideo.value=true
  }
}
watch(()=>p.dmRequest.value,()=>{void begin()})
watch(()=>p.current.value?.audioUrl,(url,old)=>{if(url!==old){stopPlayer();if(enabled.value)void begin()} })
onMounted(()=>{if(enabled.value)void begin()})
onUnmounted(stopPlayer)
</script>
<template>
  <div class="dm-test-host" :class="{'dm-test-host--visible':p.dmShowVideo.value}">
    <div v-if="enabled" class="dm-test-content">
      <div class="dm-stage">
        <div :id="containerId" class="dm-sdk-player" :class="{'dm-sdk-player--hidden':!p.dmShowVideo.value}"/>
      </div>
      <div class="dm-test-tools">
        <p class="dm-test-label">Prueba de Dailymotion · {{ready?'SDK conectado':p.dmStatus.value==='loading'?'Cargando…':'Pendiente de reproducción'}}</p>
        <button type="button" class="dm-test-button" @click="p.dmShowVideo.value=!p.dmShowVideo.value">
          <EyeOff v-if="p.dmShowVideo.value" :size="16"/><Eye v-else :size="16"/>
          {{p.dmShowVideo.value?'Ocultar visualización':'Mostrar reproductor'}}
        </button>
        <a :href="p.current.value?.audioUrl" target="_blank" rel="noopener noreferrer" class="dm-test-button"><ExternalLink :size="16"/> Video original</a>
      </div>
      <p v-if="reason" role="alert" class="dm-test-error"><AlertTriangle :size="16"/>{{reason}}</p>
      <p class="dm-test-warning">Esta prueba solo utiliza el SDK oficial. Dailymotion puede exigir que su video, controles o publicidad permanezcan visibles, y bloquear el audio oculto. No se extrae ninguna pista de audio.</p>
    </div>
  </div>
</template>
<style scoped>
.dm-test-host{position:fixed;right:12px;bottom:172px;z-index:99;pointer-events:none}
.dm-test-content{width:min(92vw,390px);pointer-events:auto}
.dm-stage{overflow:hidden;border-radius:14px;border:1px solid rgba(178,147,246,.35);background:#0e1019}
.dm-sdk-player{position:relative;aspect-ratio:16/9;width:100%}
.dm-sdk-player--hidden{width:1px;height:1px;aspect-ratio:auto;opacity:.01;overflow:hidden;pointer-events:none}
.dm-test-host:not(.dm-test-host--visible) .dm-stage{height:1px;width:1px;opacity:.01}
.dm-test-host:not(.dm-test-host--visible) .dm-test-tools,.dm-test-host:not(.dm-test-host--visible) .dm-test-warning{display:none}
.dm-test-host:not(.dm-test-host--visible) .dm-test-content{width:1px}
.dm-test-tools{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:10px;border-radius:12px;background:#181927}
.dm-test-label{flex-basis:100%;color:#dad4ef;font-size:11px}
.dm-test-button{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;color:#d1bbfa;font-size:11px;border:1px solid rgba(255,255,255,.15);border-radius:9px}
.dm-test-warning{padding:10px;border-radius:9px;background:#181927;color:#b2a7c1;font-size:11px;line-height:1.6}
.dm-test-error{display:flex;gap:8px;padding:10px;margin-top:6px;border-radius:10px;background:#3e2d30;color:#faccd3;font-size:12px}
@media(min-width:1024px){.dm-test-host{bottom:122px;right:24px}}
@media(prefers-reduced-motion:reduce){.dm-sdk-player{transition:none}}
</style>
