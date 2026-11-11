<script setup lang="ts">
import {ArrowRight,Play,Headphones,Disc3,Music2} from 'lucide-vue-next'
const {data,pending}=useCatalog()
const p=usePlayer()
const featured=computed(()=>data.value.albums[0])
const featuredArtist=computed(()=>data.value.artists.find(a=>a.id===featured.value?.artistId))
const topTracks=computed(()=>[...data.value.tracks].sort((a,b)=>b.plays-a.plays).slice(0,5))
const title='WEBMUSIC — Descubre música y artistas'
useSeoMeta({title,description:'Explora una biblioteca de artistas, álbumes y canciones. Descubre nuevas historias musicales en WEBMUSIC.',ogTitle:title,ogDescription:'Tu espacio para descubrir y escuchar música.'})
</script>
<template>
<NuxtLayout>
 <div v-if="pending" class="animate-pulse space-y-7"><div class="h-72 rounded-3xl bg-white/10"/><div class="h-7 w-52 rounded bg-white/10"/><div class="grid grid-cols-2 gap-4 md:grid-cols-4"><div v-for="n in 4" :key="n" class="aspect-square rounded-xl bg-white/10"/></div></div>
 <template v-else>
 <div class="mb-7 flex items-start justify-between gap-4"><div><p class="mb-1 text-xs font-semibold uppercase tracking-[.21em] text-violet-400">Bienvenido a tu mundo musical</p><h1 class="text-3xl font-extrabold tracking-tight md:text-4xl">Escucha algo <span class="text-violet-400">increíble.</span></h1><p class="mt-3 text-sm text-[#989caf]">Explora artistas, descubre álbumes y disfruta tu música.</p></div></div>
 <section v-if="featured" class="relative mb-11 min-h-[280px] overflow-hidden rounded-[26px] bg-gradient-to-r from-[#443374] to-[#1c2135] md:min-h-[310px]">
  <img :src="featured.cover" alt="" class="absolute inset-0 h-full w-full object-cover opacity-30"/><div class="absolute inset-0 bg-gradient-to-r from-[#241539]/95 via-[#241539]/75 to-transparent"/>
  <div class="relative flex min-h-[280px] max-w-xl flex-col justify-center p-7 md:min-h-[310px] md:p-12">
   <span class="mb-4 w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-violet-100">Álbum destacado</span>
   <h2 class="text-3xl font-extrabold tracking-tight md:text-5xl">{{featured.title}}</h2><p class="mt-3 text-[#d6d0e4]">{{featuredArtist?.name}} · {{featured.year}}</p>
   <div class="mt-7 flex flex-wrap gap-3"><button class="flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-bold shadow-lg shadow-violet-500/20 hover:bg-violet-400" @click="p.start(data.tracks.find(t=>t.albumId===featured.id)!, data.tracks.filter(t=>t.albumId===featured.id))"><Play :size="17" fill="currentColor"/> Reproducir</button><NuxtLink :to="'/album/'+featured.slug" class="rounded-full border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10">Ver álbum</NuxtLink></div>
  </div>
 </section>
 <section class="mb-10"><div class="mb-5 flex items-center justify-between"><h2 class="text-xl font-extrabold md:text-2xl">Álbumes para descubrir</h2><NuxtLink to="/albumes" class="flex items-center gap-1 text-xs font-bold text-violet-300 hover:text-white">Ver todos <ArrowRight :size="15"/></NuxtLink></div><div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"><AlbumCard v-for="album in data.albums" :key="album.id" :album="album" :artist="data.artists.find(a=>a.id===album.artistId)" :tracks="data.tracks"/></div></section>
 <div class="grid gap-9 xl:grid-cols-[1.4fr_1fr]">
 <section><div class="mb-4 flex items-center justify-between"><h2 class="text-xl font-extrabold md:text-2xl">Las más escuchadas</h2><Headphones :size="21" class="text-violet-400"/></div><div class="rounded-2xl border border-white/[.05] bg-[#151822] p-2"><TrackRow v-for="(track,i) in topTracks" :key="track.id" :track="track" :index="i" :artist="data.artists.find(a=>a.id===track.artistId)" :album="data.albums.find(a=>a.id===track.albumId)" :queue="topTracks"/></div></section>
 <section><div class="mb-4 flex items-center justify-between"><h2 class="text-xl font-extrabold md:text-2xl">Artistas destacados</h2><NuxtLink to="/artistas" class="text-xs font-bold text-violet-300">Ver todos →</NuxtLink></div><div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2"><NuxtLink v-for="artist in data.artists" :key="artist.id" :to="'/artista/'+artist.slug" class="flex items-center gap-3 rounded-xl bg-[#191c27] p-3 transition hover:bg-[#242836]"><img :src="artist.cover" :alt="artist.name" loading="lazy" class="h-12 w-12 rounded-full object-cover"/><span class="min-w-0 truncate text-sm font-semibold">{{artist.name}}</span></NuxtLink></div><div class="mt-5 rounded-2xl border border-violet-500/10 bg-gradient-to-br from-[#292243] to-[#151925] p-6"><Music2 class="mb-4 text-violet-400"/><p class="font-bold">Toda tu música en un lugar</p><p class="mt-2 text-xs leading-5 text-[#b1abc4]">Biblioteca de demostración. Próximamente podrás guardar favoritos y crear listas personalizadas.</p></div></section>
 </div>
 </template>
</NuxtLayout>
</template>
