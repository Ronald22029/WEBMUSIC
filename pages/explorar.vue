<script setup lang="ts">
const {data}=useCatalog()
useSeoMeta({title:'Explorar música | WEBMUSIC',description:'Explora los álbumes y pistas de nuestra biblioteca musical.'})
</script>
<template><NuxtLayout><div class="mb-8"><p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Descubre</p><h1 class="text-3xl font-extrabold">Explorar música</h1><p class="mt-2 text-sm text-[#9b9daf]">Encuentra tu próximo álbum favorito.</p></div><div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"><AlbumCard v-for="album in data.albums" :key="album.id" :album="album" :artist="data.artists.find(a=>a.id===album.artistId)" :tracks="data.tracks"/></div></NuxtLayout></template>
