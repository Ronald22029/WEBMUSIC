<script setup lang="ts">
import {Play,Music2} from 'lucide-vue-next'
import {formatTime} from '~/utils/format'
import type {Track,Artist,Album} from '~/types/music'
const props=defineProps<{track:Track;index:number;artist?:Artist;album?:Album;queue?:Track[]}>()
const p=usePlayer()
function play(){void p.start(props.track,props.queue)}
</script>
<template>
<button class="group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-white/[.06]" :aria-label="'Reproducir '+track.title" @click="play">
 <span class="w-5 text-center text-sm text-[#85899c] group-hover:hidden">{{track.trackNumber||index+1}}</span><Play :size="15" class="hidden w-5 text-violet-400 group-hover:block"/>
 <img :src="track.cover||album?.cover" :alt="'Portada de '+track.title" loading="lazy" class="h-11 w-11 rounded-lg bg-[#292d3d] object-cover"/>
 <span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold">{{track.title}}</span><span class="mt-1 block truncate text-xs text-[#9094a6]">{{artist?.name}}</span></span>
 <span class="hidden max-w-32 flex-1 truncate text-xs text-[#9296a5] sm:block">{{album?.title}}</span>
 <span class="text-xs text-[#9296a5]">{{track.duration?formatTime(track.duration):'—'}}</span>
</button>
</template>
