<script setup lang="ts">
import { ArrowRight, Play, Headphones, Sparkles, Disc3, Music2 } from 'lucide-vue-next'
const { data, pending } = useCatalog()
const p = usePlayer()
const lib = useLocalLibrary()
const albums = computed(() => [...data.value.albums].sort((a,b)=>b.year-a.year||a.title.localeCompare(b.title)))
const featured = computed(() => albums.value.find(a => a.cover) || albums.value[0])
const featuredArtist = computed(() => data.value.artists.find(a => a.id === featured.value?.artistId))
const {data:featuredData} = useTracks(computed(()=>({albumId:featured.value?.id||'',limit:250})))
const featuredTracks = computed(() => featuredData.value.rows)
const fresh = computed(() => albums.value.slice(0,8))
const popular = computed(() => data.value.tracks.slice(0,8))
const {data:history} = useTracks(computed(()=>({ids:lib.recent.value.slice(0,30).join(','),limit:40})))
const latest = computed(() => lib.recentTracks(history.value.rows).slice(0,5))
useSeoMeta({title:'WEBMUSIC — Descubre tu próxima canción',description:'Explora artistas, álbumes y canciones. Organiza tus favoritos y descubre música en WEBMUSIC.'})
</script>
<template>
<NuxtLayout>
 <div v-if="pending" class="animate-pulse space-y-8"><div class="h-72 rounded-3xl bg-white/10"/><div class="h-8 w-60 rounded-lg bg-white/10"/><div class="grid grid-cols-2 gap-4 md:grid-cols-4"><div v-for="n in 4" :key="n" class="aspect-square rounded-2xl bg-white/10"/></div></div>
 <template v-else>
  <header class="motion-appear mb-7">
    <div class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-violet-400"><Sparkles :size="14"/> Tu espacio musical</div>
    <h1 class="text-[29px] font-black tracking-tight sm:text-4xl lg:text-[42px]">Cada canción tiene <span class="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">una historia.</span></h1>
    <p class="mt-3 text-sm text-[#989eb1]">Explora {{data.counts?.artists ?? data.artists.length}} artistas, {{data.counts?.albums ?? data.albums.length}} álbumes y {{data.counts?.tracks ?? data.tracks.length}} canciones.</p>
  </header>
  <section v-if="featured" class="music-shimmer relative mb-11 min-h-[270px] overflow-hidden rounded-[26px] border border-white/10 bg-[#302346] lg:min-h-[325px]">
    <img v-if="featured.cover" :src="featured.cover" alt="" class="absolute inset-0 h-full w-full object-cover opacity-35"/>
    <div class="absolute inset-0 bg-gradient-to-r from-[#241533]/95 via-[#241533]/75 to-[#141624]/30"/>
    <div class="motion-rise relative flex min-h-[270px] max-w-2xl flex-col justify-center p-6 sm:p-9 lg:min-h-[325px] lg:p-12">
      <span class="mb-4 w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-violet-100">Destacado de la semana</span>
      <h2 class="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{{featured.title}}</h2>
      <p class="mt-3 text-sm text-[#d7cbe7]">{{featuredArtist?.name}}<span v-if="featured.year"> · {{featured.year}}</span></p>
      <div class="mt-7 flex flex-wrap gap-3">
        <button class="flex items-center gap-2 rounded-full bg-violet-500 px-5 py-3 text-sm font-bold shadow-xl shadow-violet-500/25 transition hover:scale-105 hover:bg-violet-400" :disabled="!featuredTracks.length" @click="featuredTracks[0]&&p.start(featuredTracks[0],featuredTracks)">
          <Play :size="17" fill="currentColor"/> Escuchar álbum
        </button>
        <NuxtLink :to="'/album/'+featured.slug" class="rounded-full border border-white/30 px-5 py-3 text-sm font-bold transition hover:bg-white/10">Ver canciones</NuxtLink>
      </div>
    </div>
  </section>
  <section class="mb-11">
    <div class="mb-5 flex items-center justify-between gap-3"><div><p class="mb-1 text-[11px] font-semibold uppercase tracking-widest text-violet-400">Para explorar</p><h2 class="text-xl font-extrabold sm:text-2xl">Álbumes recientes</h2></div><NuxtLink to="/albumes" class="flex flex-none items-center gap-1 text-xs font-semibold text-violet-300 hover:text-white">Ver todos <ArrowRight :size="16"/></NuxtLink></div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6"><AlbumCard v-for="a in fresh" :key="a.id" :album="a" :artist="data.artists.find(x=>x.id===a.artistId)" /></div>
  </section>
  <section class="mb-11">
    <div class="mb-5 flex items-center justify-between"><div><p class="mb-1 text-[11px] font-semibold uppercase tracking-widest text-violet-400">Talento para descubrir</p><h2 class="text-xl font-extrabold sm:text-2xl">Nuestros artistas</h2></div><NuxtLink to="/artistas" class="flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-white">Ver todos <ArrowRight :size="16"/></NuxtLink></div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6"><ArtistCard v-for="a in data.artists.slice(0,12)" :key="a.id" :artist="a" :album-count="data.albums.filter(b=>b.artistId===a.id).length"/></div>
  </section>
  <div class="grid gap-8 xl:grid-cols-2">
    <section>
      <div class="mb-4 flex items-center gap-2"><Headphones :size="20" class="text-violet-400"/><h2 class="text-xl font-extrabold">Canciones para escuchar</h2></div>
      <div class="rounded-2xl border border-white/[.05] bg-[#151822] p-2"><TrackRow v-for="(t,i) in popular" :key="t.id" :track="t" :index="i" :album="data.albums.find(a=>a.id===t.albumId)" :artist="data.artists.find(a=>a.id===t.artistId)" :queue="popular"/></div>
    </section>
    <section>
      <div class="mb-4 flex items-center gap-2"><Music2 :size="20" class="text-violet-400"/><h2 class="text-xl font-extrabold">Escuchadas recientemente</h2></div>
      <div v-if="latest.length" class="rounded-2xl border border-white/[.05] bg-[#151822] p-2"><TrackRow v-for="(t,i) in latest" :key="t.id" :track="t" :index="i" :album="data.albums.find(a=>a.id===t.albumId)" :artist="data.artists.find(a=>a.id===t.artistId)" :queue="latest"/></div>
      <div v-else class="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-6 text-center"><Disc3 :size="30" class="mb-3 text-violet-400"/><p class="font-semibold">Tu historia musical comienza aquí</p><p class="mt-2 max-w-xs text-sm text-[#9ca0b3]">Al escuchar canciones, podrás volver a ellas fácilmente desde esta sección.</p></div>
      <NuxtLink to="/biblioteca" class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white">Abrir mi biblioteca <ArrowRight :size="16"/></NuxtLink>
    </section>
  </div>
 </template>
</NuxtLayout>
</template>
