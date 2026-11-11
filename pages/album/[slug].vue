<script setup lang="ts">
import { Play, Disc3, ListMusic } from 'lucide-vue-next'
const route=useRoute()
const {data}=useCatalog()
const player=usePlayer()
const album=computed(()=>data.value.albums.find(a=>a.slug===route.params.slug))
const artist=computed(()=>data.value.artists.find(a=>a.id===album.value?.artistId))
const tracks=computed(()=>data.value.tracks.filter(t=>t.albumId===album.value?.id).sort((a,b)=>(a.trackNumber||0)-(b.trackNumber||0)))
useSeoMeta({
 title:()=>album.value?album.value.title+' — '+artist.value?.name+' | WEBMUSIC':'Álbum | WEBMUSIC',
 description:()=>album.value?'Explora '+tracks.value.length+' canciones del álbum '+album.value.title+' de '+artist.value?.name+'.':'Explora álbumes musicales.',
 ogImage:()=>album.value?.cover
})
</script>
<template>
<NuxtLayout>
 <div v-if="album" class="motion-appear">
  <NuxtLink to="/albumes" class="mb-6 inline-block text-xs font-semibold text-violet-300 hover:text-white">← Todos los álbumes</NuxtLink>
  <div class="relative mb-9 flex flex-col items-start gap-7 overflow-hidden rounded-3xl border border-white/[.06] bg-gradient-to-br from-violet-900/20 to-[#181b27] p-6 sm:flex-row sm:items-end sm:p-8">
    <div class="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-violet-600/10 blur-3xl"/>
    <img v-if="album.cover" :src="album.cover" :alt="'Portada de '+album.title" class="relative aspect-square w-52 flex-none rounded-2xl object-cover shadow-2xl sm:w-56"/>
    <div class="relative min-w-0">
      <p class="mb-3 text-xs font-bold uppercase tracking-widest text-violet-400">{{album.releaseType||'Álbum'}}</p>
      <h1 class="break-words text-3xl font-black tracking-tight md:text-5xl">{{album.title}}</h1>
      <NuxtLink :to="'/artista/'+artist?.slug" class="mt-4 block font-semibold text-[#d4cde1] hover:text-violet-300">{{artist?.name}}</NuxtLink>
      <p class="mt-2 text-sm text-[#9ca1b5]">{{album.year}} · {{album.genre||'Música'}} · {{tracks.length}} canciones</p>
      <button v-if="tracks.length" class="mt-6 flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-bold shadow-lg shadow-violet-500/20 transition hover:scale-105" @click="player.start(tracks[0],tracks)"><Play :size="18" fill="currentColor"/> Reproducir álbum</button>
    </div>
  </div>
  <div class="mb-4 flex items-center gap-2"><ListMusic class="text-violet-400" :size="21"/><h2 class="text-xl font-extrabold">Canciones del álbum</h2><span class="text-xs text-[#83889c]">({{tracks.length}})</span></div>
  <div class="rounded-2xl border border-white/[.06] bg-[#151822] p-2"><TrackRow v-for="(t,i) in tracks" :key="t.id" :track="t" :index="i" :artist="artist" :album="album" :queue="tracks"/></div>
 </div>
 <div v-else class="py-24 text-center"><Disc3 class="mx-auto mb-4 text-violet-400" :size="44"/><h1 class="text-2xl font-bold">Álbum no encontrado</h1><NuxtLink class="mt-5 inline-block text-violet-300" to="/albumes">Explorar álbumes</NuxtLink></div>
</NuxtLayout>
</template>
