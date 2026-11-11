<script setup lang="ts">
import { isDailymotionTrack } from '~/utils/media'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat2, Repeat1, Music2, X, ChevronUp, ChevronDown, Heart, Loader2, Headphones } from 'lucide-vue-next'
const p = usePlayer()
const lib = useLocalLibrary()
const { data } = useCatalog()
const artist = computed(() => data.value.artists.find(a => a.id === p.current.value?.artistId))
const album = computed(() => data.value.albums.find(a => a.id === p.current.value?.albumId))
const videoTrack = computed(() => isDailymotionTrack(p.current.value))
const videoUrl = computed(() => videoTrack.value ? 'https://www.dailymotion.com/embed/video/' + encodeURIComponent(p.current.value!.audioUrl.match(/(?:dai\.ly\/|video\/)([a-z0-9]+)/i)?.[1] || '') : '')
const videoPage = computed(() => videoTrack.value ? p.current.value?.audioUrl : '')
const cover = computed(() => p.current.value?.cover || album.value?.cover || '')
const liked = computed(() => !!p.current.value && lib.isFavorite(p.current.value.id))
const repeatLabel = computed(() => p.repeatMode.value === 2 ? 'Repetir canción' : p.repeatMode.value === 1 ? 'Repetir lista' : 'Activar repetición')
const currentTitle = computed(() => p.current.value?.title || 'Selecciona una canción')
const currentArtist = computed(() => artist.value?.name || (p.current.value ? 'Artista desconocido' : 'Descubre tu biblioteca'))
function favorite() { if (p.current.value) lib.toggleFavorite(p.current.value.id) }
function setVolume(e: Event) { p.setVolume(Number((e.target as HTMLInputElement).value)) }
function closeExpanded() { p.expanded.value = false }
function keyDown(e: KeyboardEvent) { if (e.key === 'Escape' && p.expanded.value) closeExpanded() }
onMounted(() => window.addEventListener('keydown',keyDown))
onUnmounted(() => window.removeEventListener('keydown',keyDown))
</script>
<template>
<Teleport to="body">
  <!-- Dock anclado al viewport: evita que un contenedor con transform o scroll oculte el reproductor. -->
  <div class="wm-player-dock" role="region" aria-label="Reproductor musical">
    <div v-if="p.error.value" role="alert" class="wm-player-error mx-auto mb-2 flex max-w-2xl items-start gap-3 rounded-xl border border-amber-300/30 bg-[#392e29] p-3 text-sm text-amber-50 shadow-2xl">
      <span class="flex-1">{{p.error.value}}</span><button aria-label="Cerrar aviso" class="shrink-0 p-1" @click="p.error.value=''"><X :size="18"/></button>
    </div>
    <div class="wm-player-panel relative overflow-hidden border border-white/10 bg-[#161927]/[.98] shadow-[0_-14px_65px_rgba(0,0,0,.65)] backdrop-blur-2xl">
      <div class="pointer-events-none absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-violet-400/65 to-transparent"/>
      <div class="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 pb-2.5 pt-2.5 md:grid-cols-[minmax(170px,1fr)_minmax(230px,1.45fr)_minmax(140px,1fr)] md:gap-x-5 md:px-5 lg:px-8">
        <div class="flex min-w-0 items-center gap-3">
          <button type="button" class="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-[#292a42] shadow-lg transition hover:scale-[1.035]" :aria-label="'Abrir reproductor de '+currentTitle" @click="p.expanded.value=true">
            <img v-if="cover" :src="cover" alt="" class="h-full w-full object-cover"/>
            <span v-else class="flex h-full w-full items-center justify-center text-violet-200"><Music2 :size="25"/></span>
            <span v-if="p.playing.value" class="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-black/65"><EqualizerBars active small/></span>
          </button>
          <div class="min-w-0 flex-1">
            <div v-if="p.current.value" class="mb-0.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-violet-300"><span class="h-1.5 w-1.5 rounded-full bg-violet-400" :class="{'wm-playing-dot':p.playing.value}"/>{{videoTrack?'Video de Dailymotion':p.buffering.value?'Cargando audio':p.playing.value?'Reproduciendo':'En pausa'}}</div>
            <div v-else class="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-violet-300">Tu reproductor</div>
            <button class="block w-full truncate text-left text-[14px] font-extrabold leading-tight text-white hover:text-violet-200 sm:text-[15px]" :title="currentTitle" @click="p.expanded.value=true">{{currentTitle}}</button>
            <div class="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-[#a9adc1]">
              <span class="truncate" :title="currentArtist">{{currentArtist}}</span>
              <span v-if="album" class="hidden shrink-0 text-[#696e83] sm:inline">·</span>
              <span v-if="album" class="hidden min-w-0 truncate sm:inline">{{album.title}}</span>
            </div>
          </div>
          <button v-if="p.current.value" class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#c2c4d4] hover:bg-white/10 hover:text-violet-300 sm:flex" :aria-pressed="liked" :aria-label="liked?'Quitar de favoritos':'Guardar favorito'" @click="favorite"><Heart :size="19" :fill="liked?'currentColor':'none'" :class="{'text-violet-400':liked}"/></button>
        </div>
        <div class="flex items-center justify-end gap-2 md:col-start-2 md:row-start-1 md:justify-center">
          <button class="wm-player-icon hidden md:flex" :aria-pressed="p.shuffle.value" aria-label="Reproducción aleatoria" :class="{'text-violet-300':p.shuffle.value}" @click="p.shuffle.value=!p.shuffle.value"><Shuffle :size="18"/></button>
          <button class="wm-player-icon" aria-label="Anterior" :disabled="!p.current.value" @click="p.previous()"><SkipBack :size="20" fill="currentColor"/></button>
          <button :aria-label="p.playing.value?'Pausar':'Reproducir'" :disabled="!p.current.value" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-[#d9c9f8] text-[#231b35] shadow-[0_3px_18px_rgba(196,155,255,.24)] transition hover:scale-105" @click="p.toggle()">
            <Loader2 v-if="p.buffering.value" :size="21" class="animate-spin"/>
            <Pause v-else-if="p.playing.value" :size="21" fill="currentColor"/>
            <Play v-else :size="21" fill="currentColor"/>
          </button>
          <button class="wm-player-icon" aria-label="Siguiente" :disabled="!p.current.value" @click="p.next()"><SkipForward :size="20" fill="currentColor"/></button>
          <button class="wm-player-icon hidden md:flex" :aria-label="repeatLabel" :title="repeatLabel" :class="{'text-violet-300':p.repeatMode.value>0}" @click="p.cycleRepeat()"><Repeat1 v-if="p.repeatMode.value===2" :size="19"/><Repeat2 v-else :size="19"/></button>
        </div>
        <div class="col-span-2 md:col-span-1 md:col-start-2 md:row-start-2">
          <p v-if="videoTrack" class="py-2 text-center text-[11px] text-violet-300">Video externo · Abrir reproductor para escuchar</p>
          <ProgressTimeline v-else :position="p.position.value" :duration="p.duration.value" :playing="p.playing.value" :buffering="p.buffering.value" @seek="p.seek"/>
        </div>
        <div class="hidden items-center justify-end gap-3 md:col-start-3 md:row-start-1 md:row-span-2 md:flex">
          <VolumeX v-if="!p.volume.value" :size="19" class="text-[#a1a5bc]"/>
          <Volume2 v-else :size="19" class="text-[#a1a5bc]"/>
          <input aria-label="Volumen" type="range" min="0" max="1" step=".01" class="w-[86px]" :value="p.volume.value" @input="setVolume"/>
          <button class="wm-player-icon" aria-label="Abrir reproductor completo" @click="p.expanded.value=true"><ChevronUp :size="22"/></button>
        </div>
      </div>
    </div>
  </div>
  <Transition name="wm-sheet">
    <section v-if="p.expanded.value" class="wm-fullscreen" role="dialog" aria-modal="true" :aria-label="'Reproductor completo: '+currentTitle">
      <div class="pointer-events-none absolute inset-0 overflow-hidden"><div class="absolute -left-24 top-0 h-[480px] w-[480px] rounded-full bg-violet-600/15 blur-3xl"/><div class="absolute -right-16 bottom-0 h-[360px] w-[360px] rounded-full bg-fuchsia-600/15 blur-3xl"/></div>
      <div class="relative mx-auto flex min-h-full max-w-[500px] flex-col justify-center px-5 py-7 md:px-8">
        <header class="mb-7 flex items-center justify-between">
          <button class="flex items-center gap-2 rounded-full px-2 py-2 text-sm text-[#f2eafc] hover:bg-white/10" aria-label="Minimizar reproductor" @click="closeExpanded"><ChevronDown :size="22"/> Minimizar</button>
          <span class="text-[11px] font-extrabold uppercase tracking-[.16em] text-violet-200">Reproduciendo ahora</span>
        </header>
        <div v-if="videoTrack" class="mb-7">
          <div class="relative aspect-video overflow-hidden rounded-2xl border border-violet-400/25 bg-black shadow-2xl">
            <iframe :key="p.current.value?.id" :src="videoUrl" :title="'Dailymotion: '+currentTitle" class="absolute inset-0 h-full w-full" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"/>
          </div>
          <p class="mt-3 text-center text-xs text-[#c7bdd7]">Video integrado desde Dailymotion. Si tu navegador bloquea el reproductor, puedes abrir la fuente original.</p>
          <a v-if="videoPage" :href="videoPage" target="_blank" rel="noopener noreferrer" class="mx-auto mt-3 block w-fit rounded-full border border-white/20 px-5 py-2 text-center text-xs font-semibold text-violet-200 hover:bg-white/10">Abrir video original en Dailymotion ↗</a>
        </div>
        <div v-else class="relative mx-auto mb-9 w-[min(100%,320px)]">
          <div class="wm-disc" :class="{'wm-disc--playing':p.playing.value}"/>
          <div class="relative mx-auto aspect-square w-[92%] overflow-hidden rounded-[28px] border border-white/20 bg-[#29263d] shadow-[0_30px_80px_rgba(0,0,0,.6)]">
            <img v-if="cover" :src="cover" alt="" class="h-full w-full object-cover"/>
            <span v-else class="flex h-full w-full items-center justify-center"><Music2 :size="80" class="text-violet-300"/></span>
            <span v-if="p.playing.value" class="absolute bottom-4 right-4 rounded-full bg-[#11111c]/80 p-3"><EqualizerBars active/></span>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="min-w-0 flex-1"><h2 class="truncate text-2xl font-black text-white" :title="currentTitle">{{currentTitle}}</h2><p class="mt-2 truncate text-sm text-[#c7c0d9]">{{currentArtist}}<span v-if="album"> · {{album.title}}</span></p></div>
          <button v-if="p.current.value" class="rounded-full bg-white/10 p-3 hover:bg-white/15" :aria-label="liked?'Quitar de favoritos':'Guardar favorito'" :aria-pressed="liked" @click="favorite"><Heart :size="21" :fill="liked?'currentColor':'none'" :class="{'text-violet-300':liked}"/></button>
        </div>
        <div class="mt-8"><p v-if="videoTrack" class="rounded-lg bg-white/5 px-4 py-3 text-center text-xs text-[#c7b9dc]">Los controles de tiempo y volumen se manejan desde Dailymotion.</p>
          <ProgressTimeline v-else large :position="p.position.value" :duration="p.duration.value" :playing="p.playing.value" :buffering="p.buffering.value" @seek="p.seek"/></div>
        <div v-if="!videoTrack" class="mt-6 flex items-center justify-between gap-2">
          <button class="rounded-full p-3 text-[#d1c6e9]" :aria-pressed="p.shuffle.value" aria-label="Aleatorio" :class="{'text-violet-300':p.shuffle.value}" @click="p.shuffle.value=!p.shuffle.value"><Shuffle :size="21"/></button>
          <button class="rounded-full p-2" aria-label="Anterior" @click="p.previous()"><SkipBack :size="26" fill="currentColor"/></button>
          <button class="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#1f1730] shadow-2xl transition hover:scale-105" :disabled="!p.current.value" :aria-label="p.playing.value?'Pausar':'Reproducir'" @click="p.toggle()"><Loader2 v-if="p.buffering.value" :size="25" class="animate-spin"/><Pause v-else-if="p.playing.value" :size="26" fill="currentColor"/><Play v-else :size="26" fill="currentColor"/></button>
          <button class="rounded-full p-2" aria-label="Siguiente" @click="p.next()"><SkipForward :size="26" fill="currentColor"/></button>
          <button class="rounded-full p-3 text-[#d1c6e9]" :aria-label="repeatLabel" :class="{'text-violet-300':p.repeatMode.value>0}" @click="p.cycleRepeat()"><Repeat1 v-if="p.repeatMode.value===2" :size="22"/><Repeat2 v-else :size="22"/></button>
        </div>
        <div v-if="!videoTrack" class="mt-7 flex items-center gap-3 text-[#c9c0db]"><Volume2 :size="20"/><input aria-label="Volumen" type="range" min="0" max="1" step=".01" class="flex-1" :value="p.volume.value" @input="setVolume"/></div>
        <p class="mt-7 text-center text-xs text-[#ada4bc]">{{videoTrack?'Reproductor oficial de Dailymotion · Sin descargar ni extraer audio':'Reproducción mediante enlace externo · Disponibilidad según su servidor'}}</p>
      </div>
    </section>
  </Transition>
</Teleport>
</template>
<style scoped>
/* Reglas explícitas evitan que el footer dependa de clases responsive generadas dinámicamente. */
.wm-player-dock{position:fixed;bottom:66px;left:0;right:0;z-index:100;pointer-events:none}
.wm-player-dock>*{pointer-events:auto}
.wm-player-panel{border-radius:16px 16px 0 0}
.wm-player-icon{display:flex;align-items:center;justify-content:center;width:38px;height:38px;flex-shrink:0;border-radius:999px;color:#c2c4d5;transition:background .2s,color .2s}
.wm-player-icon:hover{background:rgba(255,255,255,.08);color:white}
.wm-player-error{pointer-events:auto}
.wm-playing-dot{animation:wm-dot 2s ease-in-out infinite}
.wm-fullscreen{position:fixed;inset:0;z-index:110;overflow-y:auto;background:linear-gradient(140deg,#302044,#191829 55%,#090b12)}
.wm-disc{position:absolute;inset:-4%;border:17px solid #17111f;border-radius:50%;background:repeating-radial-gradient(circle,#15101f 0 2px,#27203b 3px 4px);box-shadow:0 20px 70px rgba(0,0,0,.5)}
.wm-disc--playing{animation:wm-spin 14s linear infinite}
.wm-sheet-enter-active,.wm-sheet-leave-active{transition:opacity .3s ease,transform .35s ease}
.wm-sheet-enter-from,.wm-sheet-leave-to{opacity:0;transform:translateY(22px)}
@keyframes wm-spin{to{transform:rotate(360deg)}}
@keyframes wm-dot{50%{opacity:.35;box-shadow:0 0 10px #a78bfa}}
@media(min-width:1024px){.wm-player-dock{bottom:0;left:248px}}
@media(prefers-reduced-motion:reduce){.wm-disc--playing,.wm-playing-dot{animation:none}.wm-sheet-enter-active,.wm-sheet-leave-active{transition:none}}
</style>
