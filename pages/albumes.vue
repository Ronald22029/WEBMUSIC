<script setup lang="ts">
const {data}=useCatalog()
const artistId=ref('all')
const query=ref('')
const order=ref<'new'|'old'|'az'>('new')
const albums=computed(()=>{
 const q=query.value.trim().toLocaleLowerCase('es')
 return data.value.albums.filter(a=>(artistId.value==='all'||a.artistId===artistId.value)&&(!q||a.title.toLocaleLowerCase('es').includes(q)))
 .sort((a,b)=>order.value==='az'?a.title.localeCompare(b.title):order.value==='old'?a.year-b.year:b.year-a.year)
})
useSeoMeta({title:'Álbumes | WEBMUSIC',description:'Descubre álbumes organizados por artista y año en WEBMUSIC.'})
</script>
<template>
<NuxtLayout>
 <div class="mb-7"><p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Discografía</p><h1 class="text-3xl font-extrabold">Explorar álbumes</h1><p class="mt-2 text-sm text-[#999caf]">{{data.albums.length}} álbumes organizados por artista y fecha.</p></div>
 <div class="mb-7 flex flex-wrap gap-3">
  <input v-model="query" aria-label="Filtrar álbumes" placeholder="Nombre del álbum..." class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1b1e2b] px-4 text-sm outline-none focus:border-violet-400 sm:max-w-xs"/>
  <select v-model="artistId" aria-label="Filtrar por artista" class="h-11 max-w-[230px] flex-1 rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="all">Todos los artistas</option><option v-for="artist in data.artists" :key="artist.id" :value="artist.id">{{artist.name}}</option></select>
  <select v-model="order" aria-label="Ordenar álbumes" class="h-11 rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="new">Más recientes</option><option value="old">Más antiguos</option><option value="az">Nombre A-Z</option></select>
 </div>
 <div v-if="albums.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"><AlbumCard v-for="album in albums" :key="album.id" :album="album" :artist="data.artists.find(a=>a.id===album.artistId)" :tracks="data.tracks"/></div>
 <p v-else class="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-[#9296aa]">No se encontraron álbumes con estos filtros.</p>
</NuxtLayout>
</template>
