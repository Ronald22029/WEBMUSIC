<script setup lang="ts">
const {data}=useCatalog()
const search=ref('')
const page=ref(1)
const pageSize=60
const sort=ref<'az'|'za'|'albums'>('az')
const artists=computed(()=>{
  const term=search.value.trim().toLocaleLowerCase('es')
  const list=data.value.artists.filter(a=>a.name.toLocaleLowerCase('es').includes(term))
  return [...list].sort((a,b)=>sort.value==='albums'
    ? data.value.albums.filter(x=>x.artistId===b.id).length-data.value.albums.filter(x=>x.artistId===a.id).length
    : sort.value==='za'?b.name.localeCompare(a.name):a.name.localeCompare(b.name))
})
const visible=computed(()=>artists.value.slice((page.value-1)*pageSize,page.value*pageSize))
watch([search,sort],()=>page.value=1)
useSeoMeta({title:'Artistas | CieloPlay',description:'Explora artistas, canciones y discografías de CieloPlay.'})
</script>
<template>
<NuxtLayout>
  <div class="mb-7"><p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Discografías</p><h1 class="text-3xl font-extrabold">Todos los artistas</h1><p class="mt-2 text-sm text-[#999caf]">{{data.artists.length}} artistas para explorar. La colección seguirá creciendo.</p></div>
  <div class="mb-7 flex flex-wrap gap-3"><input v-model="search" aria-label="Filtrar artistas" placeholder="Filtrar artistas..." class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1b1e2b] px-4 text-sm outline-none focus:border-violet-400 sm:max-w-xs"/><select v-model="sort" aria-label="Ordenar artistas" class="h-11 rounded-xl border border-white/10 bg-[#1b1e2b] px-4 text-sm"><option value="az">Nombre A-Z</option><option value="za">Nombre Z-A</option><option value="albums">Más álbumes</option></select></div>
  <div v-if="artists.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"><ArtistCard v-for="a in visible" :key="a.id" :artist="a" :album-count="data.albums.filter(b=>b.artistId===a.id).length"/></div>
  <div v-if="artists.length>pageSize" class="my-7 flex items-center justify-center gap-5 text-sm"><button :disabled="page===1" class="rounded-xl border border-white/10 px-5 py-2 disabled:opacity-30" @click="page--">Anterior</button><span>{{page}} / {{Math.ceil(artists.length/pageSize)}}</span><button :disabled="page*pageSize>=artists.length" class="rounded-xl border border-white/10 px-5 py-2 disabled:opacity-30" @click="page++">Siguiente</button></div><p v-if="!artists.length" class="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-[#9296aa]">No hay artistas con ese nombre.</p>
</NuxtLayout>
</template>
