<script setup lang="ts">
import { Play, ArrowRight, Music2 } from 'lucide-vue-next'
const route=useRoute()
const {data}=useCatalog()
const player=usePlayer()
const artist=computed(()=>data.value.artists.find(a=>a.slug===route.params.slug))
const albums=computed(()=>data.value.albums.filter(a=>a.artistId===artist.value?.id).sort((a,b)=>b.year-a.year||a.title.localeCompare(b.title)))
const {data:artistTracks} = useTracks(computed(()=>({artistId:artist.value?.id||'',limit:100})))
const tracks=computed(()=>artistTracks.value.rows)
const topTracks=computed(()=>tracks.value.slice(0,10))
const category=(release:string)=>{
 const t=release.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()
 if(/single|sencillo/.test(t))return 'Sencillos'
 if(/(^|[^a-z])ep([^a-z]|$)/.test(t))return 'EP'
 if(/album|disco|vivo/.test(t))return 'Álbumes'
 if(/sin album|canciones sueltas|suelt/.test(t))return 'Canciones sueltas'
 return 'Otros lanzamientos'
}
const discography=computed(()=>{
 const groups=['Álbumes','EP','Sencillos','Canciones sueltas','Otros lanzamientos']
 return groups.map(name=>({name,items:albums.value.filter(a=>category(a.releaseType||'')===name)})).filter(g=>g.items.length)
})
useSeoMeta({
 title:()=>artist.value?artist.value.name+' — Discografía | CieloPlay':'Artista | CieloPlay',
 description:()=>artist.value?'Explora los '+albums.value.length+' álbumes y '+artistTracks.value.total+' canciones de '+artist.value.name+'.':'Descubre artistas musicales.',
 ogImage:()=>artist.value?.cover
})
</script>
<template>
<NuxtLayout>
 <div v-if="artist" class="motion-appear">
  <NuxtLink to="/artistas" class="mb-6 inline-block text-xs font-semibold text-violet-300 hover:text-white">← Todos los artistas</NuxtLink>
  <div class="relative mb-10 flex flex-col items-center gap-7 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-700/25 to-[#191b28] p-7 text-center sm:flex-row sm:text-left md:p-10">
    <div class="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"/>
    <img v-if="artist.cover" :src="artist.cover" :alt="artist.name" class="relative h-40 w-40 flex-none rounded-full border-4 border-white/10 object-cover shadow-2xl md:h-52 md:w-52"/>
    <div class="relative"><p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Artista</p>
      <h1 class="text-4xl font-black tracking-tight md:text-5xl">{{artist.name}}</h1>
      <p class="mt-3 max-w-xl text-sm leading-6 text-[#c2bfd2]">{{artist.description}}</p>
      <p class="mt-3 text-xs text-[#a6a5ba]">{{albums.length}} álbumes · {{artistTracks.total}} canciones</p>
      <button v-if="tracks.length" class="mt-6 flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-bold transition hover:scale-105" @click="player.start(tracks[0],tracks,{source:'artist',artistId:artist.id,offset:0,total:artistTracks.total})"><Play :size="18" fill="currentColor"/> Escuchar canciones</button>
    </div>
  </div>
  <div class="mb-5 flex items-center justify-between"><h2 class="text-xl font-extrabold sm:text-2xl">Canciones para empezar</h2><NuxtLink :to="'/canciones?artista='+artist.id" class="flex items-center gap-1 text-xs font-semibold text-violet-300">Ver todas <ArrowRight :size="16"/></NuxtLink></div>
  <div class="mb-11 rounded-2xl border border-white/[.06] bg-[#151822] p-2"><TrackRow v-for="(t,i) in topTracks" :key="t.id" :track="t" :index="i" :artist="artist" :album="data.albums.find(a=>a.id===t.albumId)"  :queue="tracks" :scope="{source:'artist',artistId:artist.id,offset:0,total:artistTracks.total}"/></div>
  <div v-if="albums.length" class="mb-6 flex flex-wrap gap-2"><a href="#discografia" class="rounded-full bg-violet-500/15 px-4 py-2 text-xs text-violet-200">{{albums.filter(a=>(a.releaseType||'').toLowerCase().includes('álbum')).length}} álbumes</a><a href="#discografia" class="rounded-full bg-white/10 px-4 py-2 text-xs">{{albums.filter(a=>/single|sencillo|ep/i.test(a.releaseType||'')).length}} sencillos y EP</a><NuxtLink :to="'/canciones?artista='+artist.id" class="rounded-full bg-white/10 px-4 py-2 text-xs">Todas las canciones</NuxtLink></div><div id="discografia" class="mb-5 flex items-center gap-2"><Music2 class="text-violet-400"/><h2 class="text-xl font-extrabold sm:text-2xl">Discografía</h2></div>
  <section v-for="group in discography" :key="group.name" class="mb-10">
   <div class="mb-4 flex items-center justify-between"><h3 class="text-lg font-extrabold">{{group.name}}</h3><span class="text-xs text-[#a5a7b9]">{{group.items.length}}</span></div>
   <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"><AlbumCard v-for="a in group.items" :key="a.id" :album="a" :artist="artist"/></div>
  </section>
 </div>
 <div v-else class="py-24 text-center"><h1 class="text-2xl font-bold">Artista no encontrado</h1><NuxtLink to="/artistas" class="mt-4 inline-block text-violet-400">Explorar artistas</NuxtLink></div>
</NuxtLayout>
</template>
