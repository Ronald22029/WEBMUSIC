<script setup lang="ts">
import { Play } from 'lucide-vue-next'
import type { Album, Artist, Track, TrackPage } from '~/types/music'
const props=defineProps<{album:Album;artist?:Artist;tracks?:Track[]}>()
const player=usePlayer()
const active=computed(()=>!!player.playing.value&&player.current.value?.albumId===props.album.id)
const loading=ref(false)
async function play(e:Event){
 e.preventDefault();e.stopPropagation()
 if(loading.value)return
 loading.value=true
 try{
  const existing=(props.tracks||[]).filter(t=>t.albumId===props.album.id)
  const list=existing.length?existing:(await $fetch<TrackPage>('/api/tracks',{query:{albumId:props.album.id,limit:250}})).rows
  if(list.length)void player.start(list[0]!,list)
 }finally{loading.value=false}
}
</script>
<template>
<NuxtLink :to="'/album/'+album.slug" class="group motion-rise block min-w-0 rounded-2xl border border-white/[.05] bg-[#181b27]/85 p-3 transition duration-300 hover:-translate-y-1 hover:border-violet-400/20 hover:bg-[#242638] hover:shadow-[0_15px_35px_rgba(0,0,0,.22)]">
 <div class="relative aspect-square overflow-hidden rounded-xl bg-[#292d40]">
  <img v-if="album.cover" :src="album.cover" :alt="'Portada de '+album.title" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-110"/>
  <div v-else class="flex h-full w-full items-center justify-center text-3xl text-violet-300">♫</div>
  <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100"/>
  <button :aria-label="'Reproducir '+album.title" :disabled="loading" class="absolute bottom-3 right-3 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-violet-500 text-white opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100" @click="play"><EqualizerBars v-if="active" active small/><Play v-else :size="20" fill="currentColor"/></button>
 </div>
 <div class="mt-3 truncate text-sm font-bold">{{album.title}}</div>
 <div class="mt-1 truncate text-xs text-[#9ca0b2]">{{artist?.name||'Artista'}} <span v-if="album.year" class="text-[#686d80]">·</span> <span v-if="album.year">{{album.year}}</span></div>
 <p class="mt-1.5 truncate text-[11px] text-violet-300/75">{{album.releaseType||'Álbum'}}</p>
</NuxtLink>
</template>
