<script setup lang="ts">
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat2, Repeat1, Music2, X, ChevronUp, ChevronDown, Heart, Loader2 } from 'lucide-vue-next'
import { formatTime } from '~/utils/format'
const p = usePlayer()
const lib = useLocalLibrary()
const { data } = useCatalog()
const artist = computed(() => data.value.artists.find(a => a.id === p.current.value?.artistId))
const album = computed(() => data.value.albums.find(a => a.id === p.current.value?.albumId))
const cover = computed(() => p.current.value?.cover || album.value?.cover || '')
const isFavorite = computed(() => !!p.current.value && lib.isFavorite(p.current.value.id))
const label = computed(() => p.repeatMode.value === 2 ? 'Repetir una canción' : p.repeatMode.value === 1 ? 'Repetir lista' : 'Repetición desactivada')
function changeSeek(e: Event) { p.seek(Number((e.target as HTMLInputElement).value)) }
function changeVolume(e: Event) { p.setVolume(Number((e.target as HTMLInputElement).value)) }
function favorite() { if (p.current.value) lib.toggleFavorite(p.current.value.id) }
</script>
<template>
<div>
  <div v-if="p.error.value" role="status" class="fixed bottom-[158px] left-3 right-3 z-[65] mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-amber-400/30 bg-[#3c3027] p-3 text-sm text-amber-100 shadow-2xl lg:bottom-[112px]">
    <span class="flex-1">{{p.error.value}}</span><button aria-label="Cerrar aviso" @click="p.error.value=''"><X :size="18"/></button>
  </div>
  <div class="fixed bottom-[66px] left-0 right-0 z-40 border-t border-violet-400/10 bg-[#171a26]/95 px-3 py-2.5 shadow-[0_-12px_36px_rgba(0,0,0,.38)] backdrop-blur-2xl lg:bottom-0 lg:px-7 lg:py-3">
    <div class="mx-auto flex max-w-[1600px] items-center gap-3 lg:gap-7">
      <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left lg:w-1/3 lg:flex-none" aria-label="Abrir reproductor completo" @click="p.expanded.value=true">
        <div class="relative h-12 w-12 flex-none overflow-hidden rounded-xl bg-[#2b2942] lg:h-14 lg:w-14">
          <img v-if="cover" :src="cover" alt="" class="h-full w-full object-cover"/>
          <div v-else class="flex h-full w-full items-center justify-center text-violet-300"><Music2/></div>
          <div v-if="p.playing.value" class="absolute inset-0 flex items-center justify-center bg-black/50"><EqualizerBars active small/></div>
        </div>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-bold">{{p.current.value?.title || 'Elige una canción'}}</span>
          <span class="mt-1 block truncate text-xs text-[#9297ad]">{{artist?.name || 'Descubre tu música'}}</span>
        </span>
        <ChevronUp :size="18" class="hidden text-[#8e91a8] lg:block"/>
      </button>
      <div class="flex flex-none items-center gap-3 lg:flex-1 lg:flex-col lg:gap-1.5">
        <div class="flex items-center gap-3 lg:gap-5">
          <button class="hidden text-[#9fa2b6] hover:text-white lg:block" aria-label="Alternar aleatorio" :aria-pressed="p.shuffle.value" :class="{'!text-violet-400':p.shuffle.value}" @click="p.shuffle.value=!p.shuffle.value"><Shuffle :size="18"/></button>
          <button class="hidden text-[#ccd0de] hover:text-white sm:block" aria-label="Anterior" @click="p.previous()"><SkipBack :size="19" fill="currentColor"/></button>
          <button class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111322] transition hover:scale-105" :aria-label="p.playing.value?'Pausar':'Reproducir'" :disabled="!p.current.value" @click="p.toggle()">
            <Loader2 v-if="p.buffering.value" :size="20" class="animate-spin"/>
            <Pause v-else-if="p.playing.value" :size="20" fill="currentColor"/>
            <Play v-else :size="20" fill="currentColor"/>
          </button>
          <button class="text-[#cdd0df] hover:text-white" aria-label="Siguiente" @click="p.next()"><SkipForward :size="19" fill="currentColor"/></button>
          <button class="hidden text-[#9fa2b6] hover:text-white lg:block" :aria-label="label" :title="label" @click="p.cycleRepeat()"><Repeat1 v-if="p.repeatMode.value===2" :size="19" class="text-violet-400"/><Repeat2 v-else :size="19" :class="{'text-violet-400':p.repeatMode.value===1}"/></button>
        </div>
        <div class="hidden w-full max-w-xl items-center gap-3 text-xs text-[#9599ae] lg:flex">
          <span class="w-10 text-right tabular-nums">{{formatTime(p.position.value)}}</span>
          <input aria-label="Posición de reproducción" type="range" min="0" :max="p.duration.value||1" step="1" :value="p.position.value" class="h-1 w-full flex-1" @input="changeSeek"/>
          <span class="w-10 tabular-nums">{{p.duration.value?formatTime(p.duration.value):'--:--'}}</span>
        </div>
      </div>
      <div class="hidden flex-1 items-center justify-end gap-3 lg:flex">
        <button v-if="p.current.value" aria-label="Agregar o quitar de favoritos" :aria-pressed="isFavorite" class="mr-2 text-[#a5a7b6] hover:text-violet-400" @click="favorite"><Heart :size="19" :fill="isFavorite?'currentColor':'none'" :class="{'text-violet-400':isFavorite}"/></button>
        <Volume2 v-if="p.volume.value" :size="19" class="text-[#9ba0b3]"/><VolumeX v-else :size="19"/>
        <input aria-label="Volumen" type="range" min="0" max="1" step=".01" :value="p.volume.value" class="w-24" @input="changeVolume"/>
        <button class="ml-2 rounded-lg p-2 text-[#9ca0b4] hover:bg-white/10 hover:text-white" aria-label="Abrir reproductor completo" @click="p.expanded.value=true"><ChevronUp :size="20"/></button>
      </div>
    </div>
    <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 lg:hidden"><div class="h-full bg-violet-400 transition-[width] duration-200" :style="{width:p.duration.value?((p.position.value/p.duration.value)*100)+'%':'0%'}"/></div>
  </div>
  <Transition name="player-sheet">
    <div v-if="p.expanded.value" class="fixed inset-0 z-[80] overflow-auto bg-gradient-to-br from-[#32224b] via-[#151827] to-[#090a10]">
      <div class="pointer-events-none absolute inset-0 overflow-hidden"><div class="motion-glow absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-3xl"/><div class="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-3xl"/></div>
      <div class="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-8">
        <div class="mb-6 flex items-center justify-between">
          <button class="flex items-center gap-2 rounded-full px-2 py-2 text-sm text-[#e7dcf8] hover:bg-white/10" @click="p.expanded.value=false"><ChevronDown :size="21"/> Minimizar</button>
          <span class="text-[11px] font-bold uppercase tracking-[.24em] text-[#ae9bc8]">Reproduciendo ahora</span>
          <span class="w-12"/>
        </div>
        <div class="relative mx-auto mb-10 w-full max-w-[330px]">
          <div class="motion-disc absolute inset-[2%] rounded-full bg-[#08090f] shadow-2xl" :class="{'motion-paused':!p.playing.value}"><div class="absolute inset-4 rounded-full border border-white/10"/><div class="absolute inset-[45%] rounded-full bg-[#1b1d2d]"/></div>
          <div class="relative mx-auto aspect-square w-[87%] overflow-hidden rounded-[30px] border border-white/10 bg-[#242138] shadow-[0_24px_80px_rgba(0,0,0,.42)]">
            <img v-if="cover" :src="cover" alt="" class="h-full w-full object-cover"/>
            <div v-else class="flex h-full w-full items-center justify-center"><Music2 :size="80" class="text-violet-300"/></div>
            <div v-if="p.playing.value" class="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#121225]/80 backdrop-blur"><EqualizerBars active/></div>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="min-w-0 flex-1"><h2 class="truncate text-2xl font-black tracking-tight">{{p.current.value?.title||'Tu música'}}</h2><p class="mt-2 truncate text-sm text-[#c9bfdc]">{{artist?.name||'Selecciona una canción'}} · {{album?.title||'Biblioteca'}}</p></div>
          <button v-if="p.current.value" class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Agregar o quitar de favoritos" :aria-pressed="isFavorite" @click="favorite"><Heart :size="22" :fill="isFavorite?'currentColor':'none'" :class="{'text-violet-300':isFavorite}"/></button>
        </div>
        <div class="mt-9">
          <input class="w-full" type="range" min="0" :max="p.duration.value||1" step="1" :value="p.position.value" aria-label="Posición de reproducción" @input="changeSeek"/>
          <div class="mt-1 flex justify-between text-xs tabular-nums text-[#afa6c1]"><span>{{formatTime(p.position.value)}}</span><span>{{p.duration.value?formatTime(p.duration.value):'--:--'}}</span></div>
        </div>
        <div class="mt-8 flex items-center justify-between">
          <button class="p-2" :class="p.shuffle.value?'text-violet-300':'text-[#b8accb]'" aria-label="Modo aleatorio" :aria-pressed="p.shuffle.value" @click="p.shuffle.value=!p.shuffle.value"><Shuffle :size="21"/></button>
          <button class="p-2 text-[#ece6f8]" aria-label="Canción anterior" @click="p.previous()"><SkipBack :size="28" fill="currentColor"/></button>
          <button class="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#20162e] shadow-lg transition hover:scale-105" :disabled="!p.current.value" :aria-label="p.playing.value?'Pausar':'Reproducir'" @click="p.toggle()"><Loader2 v-if="p.buffering.value" :size="26" class="animate-spin"/><Pause v-else-if="p.playing.value" :size="27" fill="currentColor"/><Play v-else :size="27" fill="currentColor"/></button>
          <button class="p-2 text-[#ece6f8]" aria-label="Siguiente canción" @click="p.next()"><SkipForward :size="28" fill="currentColor"/></button>
          <button class="p-2" :class="p.repeatMode.value?'text-violet-300':'text-[#b8accb]'" :aria-label="label" @click="p.cycleRepeat()"><Repeat1 v-if="p.repeatMode.value===2" :size="22"/><Repeat2 v-else :size="22"/></button>
        </div>
        <div class="mt-9 flex items-center gap-3 text-[#c6bdd8]"><Volume2 :size="19"/><input aria-label="Volumen" class="flex-1" type="range" min="0" max="1" step=".01" :value="p.volume.value" @input="changeVolume"/></div>
        <div class="mt-8 text-center text-xs text-[#a79cbb]">Música desde enlaces externos · Disponibilidad según la fuente</div>
      </div>
    </div>
  </Transition>
</div>
</template>
<style scoped>
.player-sheet-enter-active,.player-sheet-leave-active{transition:opacity .28s ease,transform .35s cubic-bezier(.2,.9,.2,1)}
.player-sheet-enter-from,.player-sheet-leave-to{opacity:0;transform:translateY(20px)}
@media(prefers-reduced-motion:reduce){.player-sheet-enter-active,.player-sheet-leave-active{transition:none}}
</style>
