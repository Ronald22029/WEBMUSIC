<script setup lang="ts">
import { Heart, Clock3, Library } from 'lucide-vue-next'
const lib=useLocalLibrary()
const {data}=useCatalog()
const ids=computed(()=>[...new Set([...lib.favorites.value,...lib.recent.value])].slice(0,200).join(','))
const {data:myTracks}=useTracks(computed(()=>({ids:ids.value,limit:200})))
const favorites=computed(()=>lib.favoriteTracks(myTracks.value.rows))
const recent=computed(()=>lib.recentTracks(myTracks.value.rows))
useSeoMeta({title:'Mi biblioteca | WEBMUSIC',robots:'noindex,follow'})
</script>
<template>
<NuxtLayout>
 <p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Tu espacio personal</p>
 <h1 class="text-3xl font-extrabold">Mi biblioteca</h1>
 <p class="mt-2 text-sm text-[#9ca0b3]">Tus favoritos e historial se guardan en este navegador, sin necesidad de una cuenta.</p>
 <section class="mt-9">
  <h2 class="mb-4 flex items-center gap-2 text-xl font-bold"><Heart class="text-violet-400" :size="21"/> Canciones favoritas <span class="text-sm font-medium text-[#8d91a6]">({{favorites.length}})</span></h2>
  <div v-if="favorites.length" class="rounded-2xl border border-white/[.05] bg-[#151822] p-2"><TrackRow v-for="(t,i) in favorites" :key="t.id" :track="t" :index="i" :artist="data.artists.find(a=>a.id===t.artistId)" :album="data.albums.find(a=>a.id===t.albumId)" :queue="favorites"/></div>
  <div v-else class="rounded-2xl border border-dashed border-white/10 bg-white/[.02] px-5 py-10 text-center"><Heart :size="26" class="mx-auto mb-3 text-violet-400"/><p class="font-bold">Aún no tienes canciones favoritas</p><p class="mt-2 text-sm text-[#9296aa]">Presiona el corazón junto a cualquier canción para guardarla aquí.</p><NuxtLink to="/canciones" class="mt-4 inline-block rounded-full bg-violet-500 px-5 py-2 text-sm font-bold">Explorar canciones</NuxtLink></div>
 </section>
 <section class="mt-10">
  <h2 class="mb-4 flex items-center gap-2 text-xl font-bold"><Clock3 class="text-violet-400" :size="21"/> Escuchadas recientemente</h2>
  <div v-if="recent.length" class="rounded-2xl border border-white/[.05] bg-[#151822] p-2"><TrackRow v-for="(t,i) in recent" :key="t.id" :track="t" :index="i" :artist="data.artists.find(a=>a.id===t.artistId)" :album="data.albums.find(a=>a.id===t.albumId)" :queue="recent"/></div>
  <div v-else class="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-[#9296aa]">Las canciones que reproduzcas aparecerán aquí.</div>
 </section>
</NuxtLayout>
</template>
