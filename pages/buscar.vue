<script setup lang="ts">
import { Search } from 'lucide-vue-next'
const route=useRoute()
const {data}=useCatalog()
const query=computed(()=>String(route.query.q||'').trim())
const normalize=(s:string)=>s.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const matches=(s:string)=>normalize(s).includes(normalize(query.value))
const artists=computed(()=>query.value?data.value.artists.filter(a=>matches(a.name)) :[])
const albums=computed(()=>query.value?data.value.albums.filter(a=>matches(a.title)||matches(data.value.artists.find(x=>x.id===a.artistId)?.name||'')) :[])
const {data:tracks,pending}=useTracks(computed(()=>({q:query.value||'__no_search__',limit:30,offset:0})))
useSeoMeta({title:()=>query.value?'Buscar '+query.value+' | CieloPlay':'Buscar música | CieloPlay',robots:'noindex,follow'})
</script>
<template>
<NuxtLayout>
 <p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Encuentra tu música</p>
 <h1 class="text-3xl font-extrabold">Resultados de búsqueda</h1>
 <p class="mt-2 mb-8 text-sm text-[#9297a9]">Buscando: <strong class="text-violet-300">{{query||'Escribe algo en el buscador'}}</strong> · {{artists.length+albums.length+tracks.total}} resultados</p>
 <section v-if="artists.length" class="mb-10"><h2 class="mb-4 text-xl font-extrabold">Artistas</h2><div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6"><ArtistCard v-for="a in artists.slice(0,12)" :key="a.id" :artist="a" :album-count="data.albums.filter(x=>x.artistId===a.id).length"/></div></section>
 <section v-if="albums.length" class="mb-10"><h2 class="mb-4 text-xl font-extrabold">Álbumes</h2><div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"><AlbumCard v-for="a in albums.slice(0,12)" :key="a.id" :album="a" :artist="data.artists.find(x=>x.id===a.artistId)"/></div></section>
 <section v-if="tracks.rows.length"><h2 class="mb-4 text-xl font-extrabold">Canciones <span class="text-xs text-[#898d9e]">({{tracks.total}})</span></h2><div class="rounded-2xl border border-white/[.05] bg-[#151822] p-2"><TrackRow v-for="(t,i) in tracks.rows" :key="t.id" :track="t" :index="i" :artist="data.artists.find(a=>a.id===t.artistId)" :album="data.albums.find(a=>a.id===t.albumId)" :queue="tracks.rows" :scope="{source:'search',q:query,offset:0,total:tracks.total}"/></div><NuxtLink v-if="tracks.total>30" :to="'/canciones?q='+encodeURIComponent(query)" class="mt-5 inline-block rounded-full border border-white/10 px-6 py-2 text-sm font-semibold hover:bg-white/10">Ver más canciones</NuxtLink></section>
 <div v-if="query&&!pending&&!artists.length&&!albums.length&&!tracks.rows.length" class="flex flex-col items-center rounded-2xl border border-dashed border-white/10 py-20 text-center"><Search :size="36" class="mb-4 text-violet-400"/><p class="font-bold">No encontramos resultados</p></div>
</NuxtLayout>
</template>
