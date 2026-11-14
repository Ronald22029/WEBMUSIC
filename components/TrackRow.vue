<script setup lang="ts">
import { Play, Heart, ListPlus, ListMusic, Plus } from 'lucide-vue-next'
import type { Track, Artist, Album } from '~/types/music'
import type { QueueScope } from '~/composables/usePlayer'
import { formatTime } from '~/utils/format'
const props=defineProps<{track:Track;index:number;artist?:Artist;album?:Album;queue?:Track[];scope?:QueueScope}>()
const player=usePlayer()
const lib=useLocalLibrary()
const selected=computed(()=>player.current.value?.id===props.track.id)
const liked=computed(()=>lib.isFavorite(props.track.id))
function play(){void player.start(props.track,props.queue,props.scope)}
</script>
<template>
<div class="group flex items-center gap-2 rounded-xl px-1 transition duration-200 hover:bg-white/[.055]" :class="{'bg-violet-500/[.08]':selected}">
 <button class="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left sm:gap-4" :aria-label="'Reproducir '+track.title" :disabled="!track.audioUrl" @click="play">
  <span class="flex w-5 flex-none justify-center text-xs" :class="selected?'text-violet-400':'text-[#858a9d]'">
   <EqualizerBars v-if="selected&&player.playing.value" active small/>
   <span v-else class="group-hover:hidden">{{track.trackNumber||index+1}}</span>
   <Play v-if="!(selected&&player.playing.value)" :size="15" class="hidden group-hover:block"/>
  </span>
  <img v-if="track.cover||album?.cover" :src="track.cover||album?.cover" :alt="'Portada de '+track.title" loading="lazy" class="h-11 w-11 flex-none rounded-lg bg-[#272a38] object-cover"/>
  <div v-else class="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-[#272a38] text-violet-300">♪</div>
  <span class="min-w-0 flex-1">
   <span class="block truncate text-sm font-semibold" :class="selected?'text-violet-300':'text-[#ececf5]'">{{track.title}}</span>
   <span class="mt-1 block truncate text-xs text-[#9297a9]">{{artist?.name||'Artista'}}</span>
  </span>
  <span class="hidden max-w-40 flex-1 truncate text-xs text-[#898da0] md:block">{{album?.title}}</span>
 </button>
 <button class="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[#9b9db0] hover:bg-white/10 hover:text-violet-300" :aria-label="liked?'Quitar de favoritos':'Agregar a favoritos'" :aria-pressed="liked" @click="lib.toggleFavorite(track.id)"><Heart :size="17" :fill="liked?'currentColor':'none'"/></button>
 <details class="relative">
  <summary class="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-[#9b9db0] hover:bg-white/10 hover:text-violet-300" :aria-label="'Más opciones para '+track.title"><ListPlus :size="17"/></summary>
  <div class="absolute bottom-full right-0 z-30 mb-1 min-w-52 rounded-xl border border-white/10 bg-[#28283b] p-2 shadow-2xl">
   <button class="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10" @click="player.playNext(track)">Reproducir siguiente</button>
   <button class="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10" @click="player.enqueue(track)">Añadir a la cola</button>
   <div class="my-1 h-px bg-white/10"/>
   <p class="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#a9a2c7]">Mis playlists</p>
   <button v-for="list in lib.playlists.value" :key="list.id" class="block w-full truncate rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10" @click="lib.addToPlaylist(list.id,track.id)">+ {{list.name}}</button>
   <NuxtLink v-if="!lib.playlists.value.length" to="/playlists" class="block rounded-lg px-3 py-2 text-xs text-violet-300 hover:bg-white/10">Crear playlist</NuxtLink>
  </div>
 </details>
 <span class="w-10 flex-none pr-1 text-right text-[11px] tabular-nums text-[#878ba0]">{{track.duration?formatTime(track.duration):'—'}}</span>
</div>
</template>
