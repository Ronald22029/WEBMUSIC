<script setup lang="ts">
import { Sparkles, Disc3, Users, Music2 } from 'lucide-vue-next'
const {data}=useCatalog()
const latest=computed(()=>[...data.value.albums].sort((a,b)=>b.year-a.year).slice(0,12))
const genres=computed(()=>[...new Set(data.value.albums.map(a=>a.genre).filter(Boolean))].sort())
useSeoMeta({title:'Explorar música | CieloPlay',description:'Explora géneros, artistas y discos musicales en CieloPlay.'})
</script>
<template>
<NuxtLayout>
 <p class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400"><Sparkles :size="15"/> Encuentra nueva música</p>
 <h1 class="text-3xl font-extrabold">Explorar música</h1>
 <p class="mt-2 text-sm text-[#999caf]">Todo tu catálogo de forma sencilla y organizada.</p>
 <div class="my-9 grid grid-cols-3 gap-3">
   <NuxtLink to="/artistas" class="rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-700/25 to-[#1d1e31] p-4 transition hover:-translate-y-1 sm:p-6"><Users :size="24" class="mb-3 text-violet-300"/><p class="text-xl font-extrabold sm:text-2xl">{{data.counts?.artists ?? data.artists.length}}</p><p class="mt-1 text-xs text-[#b3b1c5]">Artistas</p></NuxtLink>
   <NuxtLink to="/albumes" class="rounded-2xl border border-fuchsia-500/10 bg-gradient-to-br from-fuchsia-700/20 to-[#1d1e31] p-4 transition hover:-translate-y-1 sm:p-6"><Disc3 :size="24" class="mb-3 text-fuchsia-300"/><p class="text-xl font-extrabold sm:text-2xl">{{data.counts?.albums ?? data.albums.length}}</p><p class="mt-1 text-xs text-[#b3b1c5]">Álbumes</p></NuxtLink>
   <NuxtLink to="/canciones" class="rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-700/20 to-[#1d1e31] p-4 transition hover:-translate-y-1 sm:p-6"><Music2 :size="24" class="mb-3 text-cyan-300"/><p class="text-xl font-extrabold sm:text-2xl">{{data.counts?.tracks ?? data.tracks.length}}</p><p class="mt-1 text-xs text-[#b3b1c5]">Canciones</p></NuxtLink>
 </div>
 <div v-if="genres.length" class="mb-10"><h2 class="mb-4 text-xl font-extrabold">Géneros musicales</h2><div class="flex flex-wrap gap-2"><NuxtLink v-for="g in genres" :key="g" :to="'/canciones?genero='+encodeURIComponent(g)" class="rounded-full border border-white/10 bg-[#252036] px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-600/30">{{g}}</NuxtLink></div></div>
 <div class="mb-5 flex items-center justify-between"><h2 class="text-xl font-extrabold">Álbumes destacados</h2><NuxtLink to="/albumes" class="text-xs text-violet-300">Todos los álbumes →</NuxtLink></div>
 <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"><AlbumCard v-for="a in latest" :key="a.id" :album="a" :artist="data.artists.find(x=>x.id===a.artistId)" :tracks="data.tracks"/></div>
</NuxtLayout>
</template>
