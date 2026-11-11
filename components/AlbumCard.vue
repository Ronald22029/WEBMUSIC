<script setup lang="ts">
import {Play} from 'lucide-vue-next'
import type {Album,Artist,Track} from '~/types/music'
const props=defineProps<{album:Album;artist?:Artist;tracks?:Track[]}>()
const player=usePlayer()
function play(e:Event){e.preventDefault();e.stopPropagation();const list=props.tracks?.filter(t=>t.albumId===props.album.id)||[];if(list[0])void player.start(list[0],list)}
</script>
<template>
<NuxtLink :to="'/album/'+album.slug" class="group min-w-0 rounded-2xl border border-white/[.035] bg-[#171a25]/80 p-3 transition duration-200 hover:-translate-y-1 hover:bg-[#202432]">
 <div class="relative aspect-square overflow-hidden rounded-xl bg-[#292a39]"><img :src="album.cover" :alt="'Portada de '+album.title" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><button :aria-label="'Reproducir '+album.title" class="absolute bottom-3 right-3 flex h-11 w-11 translate-y-3 items-center justify-center rounded-full bg-violet-500 text-white opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100" @click="play"><Play :size="21" fill="currentColor"/></button></div>
 <div class="mt-3 truncate text-sm font-bold">{{album.title}}</div><div class="mt-1 truncate text-xs text-[#9a9eaf]">{{artist?.name}} · {{album.year}}</div>
</NuxtLink>
</template>
