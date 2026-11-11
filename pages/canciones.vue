<script setup lang="ts">
const route=useRoute()
const {data}=useCatalog()
const query=ref('')
const artistId=ref(String(route.query.artista||'all'))
const genre=ref(String(route.query.genero||'all'))
const page=ref(1)
const pageSize=30
const genres=computed(()=>[...new Set(data.value.albums.map(a=>a.genre).filter(Boolean))].sort())
const filtered=computed(()=>{
 const q=query.value.trim().toLocaleLowerCase('es')
 return data.value.tracks.filter(t=>(artistId.value==='all'||t.artistId===artistId.value)&&(genre.value==='all'||data.value.albums.find(a=>a.id===t.albumId)?.genre===genre.value)&&(!q||t.title.toLocaleLowerCase('es').includes(q)))
})
const pageCount=computed(()=>Math.ceil(filtered.value.length/pageSize))
const visible=computed(()=>filtered.value.slice((page.value-1)*pageSize,page.value*pageSize))
watch([query,artistId,genre],()=>{page.value=1})
useSeoMeta({title:'Canciones | WEBMUSIC',description:'Explora canciones, artistas y géneros musicales.'})
</script>
<template>
<NuxtLayout>
 <p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Biblioteca musical</p><h1 class="text-3xl font-extrabold">Todas las canciones</h1>
 <p class="mt-2 text-sm text-[#999caf]">{{filtered.length}} canciones en el catálogo.</p>
 <div class="my-7 flex flex-wrap gap-3">
  <input v-model="query" aria-label="Filtrar canciones por título" placeholder="Filtrar por título..." class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1b1e2b] px-4 text-sm outline-none focus:border-violet-400 sm:max-w-xs"/>
  <select v-model="artistId" aria-label="Filtrar canciones por artista" class="h-11 max-w-[230px] rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="all">Todos los artistas</option><option v-for="a in data.artists" :key="a.id" :value="a.id">{{a.name}}</option></select>
  <select v-model="genre" aria-label="Filtrar por género" class="h-11 max-w-[200px] rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="all">Todos los géneros</option><option v-for="g in genres" :key="g" :value="g">{{g}}</option></select>
 </div>
 <div v-if="visible.length" class="rounded-2xl border border-white/[.06] bg-[#151822] p-2"><TrackRow v-for="(t,i) in visible" :key="t.id" :track="t" :index="(page-1)*pageSize+i" :artist="data.artists.find(a=>a.id===t.artistId)" :album="data.albums.find(a=>a.id===t.albumId)" :queue="visible"/></div>
 <p v-else class="rounded-xl border border-dashed border-white/10 p-12 text-center text-[#9296aa]">No se encontraron canciones.</p>
 <div v-if="pageCount>1" class="mt-6 flex items-center justify-center gap-4 text-sm"><button class="rounded-full border border-white/10 px-4 py-2 disabled:opacity-40" :disabled="page===1" @click="page--">Anterior</button><span class="text-[#aaaec0]">{{page}} / {{pageCount}}</span><button class="rounded-full border border-white/10 px-4 py-2 disabled:opacity-40" :disabled="page===pageCount" @click="page++">Siguiente</button></div>
</NuxtLayout>
</template>
