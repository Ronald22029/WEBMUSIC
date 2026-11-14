<script setup lang="ts">
const {data}=useCatalog()
const artistId=ref('all')
const page=ref(1)
const pageSize=60
const query=ref('')
const order=ref<'new'|'old'|'az'>('new')
const yearFilter=ref('all')
const years=computed(()=>[...new Set(data.value.albums.map(a=>a.year).filter(y=>y>0))].sort((a,b)=>b-a))
const albums=computed(()=>{
 const q=query.value.trim().toLocaleLowerCase('es')
 return data.value.albums.filter(a=>(artistId.value==='all'||a.artistId===artistId.value)&&(yearFilter.value==='all'||(yearFilter.value==='unknown'?!a.year:a.year===Number(yearFilter.value)))&&(!q||a.title.toLocaleLowerCase('es').includes(q)))
 .sort((a,b)=>order.value==='az'?a.title.localeCompare(b.title):((a.year||0)===0?1:0)-((b.year||0)===0?1:0)||(order.value==='old'?a.year-b.year:b.year-a.year)||a.title.localeCompare(b.title))
})
const visible=computed(()=>albums.value.slice((page.value-1)*pageSize,page.value*pageSize))
watch([artistId,query,order,yearFilter],()=>page.value=1)
useSeoMeta({title:'Álbumes | CieloPlay',description:'Descubre álbumes organizados por artista y año en CieloPlay.'})
</script>
<template>
<NuxtLayout>
 <div class="mb-7"><p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Discografía</p><h1 class="text-3xl font-extrabold">Explorar álbumes</h1><p class="mt-2 text-sm text-[#999caf]">{{data.albums.length}} álbumes organizados por artista y fecha.</p></div>
 <div class="mb-7 flex flex-wrap gap-3">
  <input v-model="query" aria-label="Filtrar álbumes" placeholder="Nombre del álbum..." class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1b1e2b] px-4 text-sm outline-none focus:border-violet-400 sm:max-w-xs"/>
  <select v-model="artistId" aria-label="Filtrar por artista" class="h-11 max-w-[230px] flex-1 rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="all">Todos los artistas</option><option v-for="artist in data.artists" :key="artist.id" :value="artist.id">{{artist.name}}</option></select>
  <select v-model="yearFilter" aria-label="Filtrar por año" class="h-11 rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="all">Todos los años</option><option value="unknown">Sin año confirmado</option><option v-for="y in years" :key="y" :value="String(y)">{{y}}</option></select>
  <select v-model="order" aria-label="Ordenar álbumes" class="h-11 rounded-xl border border-white/10 bg-[#1b1e2b] px-3 text-sm"><option value="new">Más recientes</option><option value="old">Más antiguos</option><option value="az">Nombre A-Z</option></select>
 </div>
 <div v-if="albums.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"><AlbumCard v-for="album in visible" :key="album.id" :album="album" :artist="data.artists.find(a=>a.id===album.artistId)" :tracks="data.tracks"/></div>
 <div v-if="albums.length>pageSize" class="my-7 flex items-center justify-center gap-5 text-sm"><button :disabled="page===1" class="rounded-xl border border-white/10 px-5 py-2 disabled:opacity-30" @click="page--">Anterior</button><span>{{page}} / {{Math.ceil(albums.length/pageSize)}}</span><button :disabled="page*pageSize>=albums.length" class="rounded-xl border border-white/10 px-5 py-2 disabled:opacity-30" @click="page++">Siguiente</button></div><p v-if="!albums.length" class="rounded-xl border border-dashed border-white/10 p-12 text-center text-sm text-[#9296aa]">No se encontraron álbumes con estos filtros.</p>
</NuxtLayout>
</template>
