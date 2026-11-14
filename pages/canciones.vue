<script setup lang="ts">
import { computed, ref, watch } from 'vue'
const route=useRoute()
const {data:catalog}=useCatalog()
const query=ref(String(route.query.q||''))
const debouncedQuery=useDebouncedValue(query,250)
const artistId=ref(String(route.query.artista||'all'))
const genre=ref(String(route.query.genero||'all'))
const page=ref(1)
const pageSize=30
const genres=computed(()=>[...new Set(catalog.value.albums.map(a=>a.genre).filter(Boolean))].sort())
const filters=computed(()=>({
 q:debouncedQuery.value,artistId:artistId.value==='all'?'':artistId.value,
 genre:genre.value==='all'?'':genre.value,offset:(page.value-1)*pageSize,limit:pageSize
}))
const {data:result,pending}=useTracks(filters)
const pageCount=computed(()=>Math.max(1,Math.ceil(result.value.total/pageSize)))
watch([query,artistId,genre],()=>{page.value=1})
useSeoMeta({title:'Canciones | CieloPlay',description:'Explora canciones, artistas y géneros musicales.'})
</script>
<template>
<NuxtLayout>
 <p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Biblioteca musical</p><h1 class="text-3xl font-extrabold">Todas las canciones</h1>
 <p class="mt-2 text-sm text-[#999caf]">{{result.total}} canciones encontradas.</p>
 <div class="my-7 flex flex-wrap gap-3">
  <input v-model="query" aria-label="Filtrar canciones por título" placeholder="Filtrar por título..." class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1b1e2b] px-4 text-sm outline-none focus:border-violet-400 sm:max-w-xs"/>
  <select v-model="artistId" aria-label="Filtrar canciones por artista" class="h-11 max-w-[230px] rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="all">Todos los artistas</option><option v-for="a in catalog.artists" :key="a.id" :value="a.id">{{a.name}}</option></select>
  <select v-model="genre" aria-label="Filtrar por género" class="h-11 max-w-[200px] rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="all">Todos los géneros</option><option v-for="g in genres" :key="g" :value="g">{{g}}</option></select>
 </div>
 <p v-if="pending" class="py-5 text-center text-sm text-violet-300">Cargando canciones…</p>
 <div v-if="result.rows.length" class="rounded-2xl border border-white/[.06] bg-[#151822] p-2"><TrackRow v-for="(t,i) in result.rows" :key="t.id" :track="t" :index="(page-1)*pageSize+i" :artist="catalog.artists.find(a=>a.id===t.artistId)" :album="catalog.albums.find(a=>a.id===t.albumId)" :queue="result.rows" :scope="{source:'search',q:query,artistId:artistId==='all'?undefined:artistId,genre:genre==='all'?undefined:genre,offset:(page-1)*pageSize,total:result.total}"/></div>
 <p v-else-if="!pending" class="rounded-xl border border-dashed border-white/10 p-12 text-center text-[#9296aa]">No se encontraron canciones.</p>
 <div v-if="pageCount>1" class="mt-6 flex items-center justify-center gap-4 text-sm"><button class="rounded-full border border-white/10 px-4 py-2 disabled:opacity-40" :disabled="page===1" @click="page--">Anterior</button><span class="text-[#aaaec0]">{{page}} / {{pageCount}}</span><button class="rounded-full border border-white/10 px-4 py-2 disabled:opacity-40" :disabled="page===pageCount" @click="page++">Siguiente</button></div>
</NuxtLayout>
</template>
