<script setup lang="ts">
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat2, Music, X } from 'lucide-vue-next'
import {formatTime} from '~/utils/format'
const p=usePlayer()
const {data}=useCatalog()
const artist=computed(()=>data.value.artists.find(a=>a.id===p.current.value?.artistId))
const cover=computed(()=>p.current.value?.cover||data.value.albums.find(a=>a.id===p.current.value?.albumId)?.cover)
</script>
<template>
<div class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#161923]/95 px-4 py-3 shadow-[0_-10px_50px_rgba(0,0,0,.3)] backdrop-blur-xl md:px-8">
 <div v-if="p.error.value" class="mx-auto mb-2 flex max-w-5xl items-center justify-between gap-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-200"><span>{{p.error.value}}</span><button aria-label="Cerrar aviso" @click="p.error.value=''"><X :size="15"/></button></div>
 <div class="mx-auto flex max-w-[1700px] items-center gap-4 md:gap-8">
  <div class="flex min-w-0 flex-1 items-center gap-3 md:w-1/3 md:flex-none">
   <img v-if="p.current.value&&cover" :src="cover" alt="" class="h-12 w-12 rounded-lg object-cover md:h-14 md:w-14"/>
   <div v-else class="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2a2d3c] text-violet-300 md:h-14 md:w-14"><Music/></div>
   <div class="min-w-0"><div class="truncate text-sm font-semibold">{{p.current.value?.title||'Selecciona una canción'}}</div><div class="mt-1 truncate text-xs text-[#8d91a5]">{{artist?.name||'Tu biblioteca musical'}}</div></div>
  </div>
  <div class="flex flex-1 flex-col items-center gap-2 md:max-w-[610px]">
   <div class="flex items-center gap-4 md:gap-6">
    <button aria-label="Aleatorio" :aria-pressed="p.shuffle.value" :class="p.shuffle.value?'text-violet-400':'text-[#9498a9]'" class="hidden hover:text-white md:block" @click="p.shuffle.value=!p.shuffle.value"><Shuffle :size="17"/></button>
    <button aria-label="Anterior" class="text-[#c7cad3] hover:text-white" @click="p.previous()"><SkipBack :size="20" fill="currentColor"/></button>
    <button :aria-label="p.playing.value?'Pausar':'Reproducir'" class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#10111b] transition hover:scale-105" @click="p.toggle()"><Pause v-if="p.playing.value" :size="19" fill="currentColor"/><Play v-else :size="19" fill="currentColor"/></button>
    <button aria-label="Siguiente" class="text-[#c7cad3] hover:text-white" @click="p.next()"><SkipForward :size="20" fill="currentColor"/></button>
    <button aria-label="Repetir" :aria-pressed="p.repeat.value" :class="p.repeat.value?'text-violet-400':'text-[#9498a9]'" class="hidden hover:text-white md:block" @click="p.repeat.value=!p.repeat.value"><Repeat2 :size="17"/></button>
   </div>
   <div class="hidden w-full items-center gap-3 text-[11px] text-[#85899b] md:flex">
    <span class="w-9 text-right">{{formatTime(p.position.value)}}</span>
    <input aria-label="Posición de reproducción" type="range" min="0" :max="p.duration.value||1" step="1" :value="p.position.value" class="h-1 flex-1 cursor-pointer" @input="p.seek(Number(($event.target as HTMLInputElement).value))"/>
    <span class="w-9">{{formatTime(p.duration.value||p.current.value?.duration||0)}}</span>
   </div>
  </div>
  <div class="hidden flex-1 items-center justify-end gap-3 text-[#a0a4b4] md:flex"><Volume2 :size="19"/><input aria-label="Volumen" type="range" min="0" max="1" step="0.01" :value="p.volume.value" class="w-24 cursor-pointer" @input="p.setVolume(Number(($event.target as HTMLInputElement).value))"/></div>
 </div>
</div>
</template>
