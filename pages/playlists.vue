<script setup lang="ts">
import { Plus, ListMusic, Trash2, Play, X, Pencil } from 'lucide-vue-next'
const library=useLocalLibrary()
const player=usePlayer()
const {data:catalog}=useCatalog()
const name=ref('')
const selected=ref<string|null>(null)
const active=computed(()=>library.playlists.value.find(p=>p.id===selected.value)||null)
const ids=computed(()=>active.value?.trackIds||[])
const {data:result}=useTrackIds(ids,'webmusic-playlist-ids')
const tracks=computed(()=>{
 const lookup=new Map(result.value.rows.map(t=>[t.id,t]))
 return (active.value?.trackIds||[]).map(id=>lookup.get(id)).filter((t):t is NonNullable<typeof t>=>!!t)
})
function create(){
 const id=library.createPlaylist(name.value)
 if(id){selected.value=id;name.value=''}
}
function remove(id:string){library.deletePlaylist(id);if(selected.value===id)selected.value=null}
function play(){if(tracks.value[0])void player.start(tracks.value[0],tracks.value)}
useSeoMeta({title:'Mis playlists | WEBMUSIC',robots:'noindex,follow'})
</script>
<template>
<NuxtLayout>
 <p class="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">Colección personal</p><h1 class="text-3xl font-extrabold">Mis playlists</h1>
 <p class="mt-2 text-sm text-[#9da1b7]">Crea listas y organiza canciones. Se guardan solo en este navegador, sin cuentas y sin descargar audio.</p>
 <form class="my-7 flex max-w-xl gap-2" @submit.prevent="create"><input v-model="name" maxlength="80" required placeholder="Nombre de una nueva playlist" aria-label="Nombre de la playlist" class="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#181b28] px-4 py-3 text-sm"/><button :disabled="library.playlists.value.length>=50" class="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold disabled:opacity-40"><Plus :size="18"/> Crear</button></form>
 <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
  <aside class="space-y-2">
   <button v-for="list in library.playlists.value" :key="list.id" class="flex w-full items-center gap-3 rounded-xl border border-white/10 p-3 text-left hover:bg-white/10" :class="selected===list.id?'bg-violet-500/20':''" @click="selected=list.id"><ListMusic :size="19"/><span class="min-w-0 flex-1"><strong class="block truncate text-sm">{{list.name}}</strong><small class="text-[#a0a4b7]">{{list.trackIds.length}} canciones</small></span></button>
   <p v-if="!library.playlists.value.length" class="rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#9da0b4]">Todavía no tienes listas. Crea la primera para empezar.</p>
  </aside>
  <section v-if="active" class="min-w-0 rounded-2xl border border-white/10 bg-[#161926] p-4">
   <header class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-xl font-bold">{{active.name}}</h2><p class="mt-1 text-xs text-[#9ba0b6]">{{tracks.length}} canciones disponibles</p></div><div class="flex gap-2"><button class="flex items-center gap-2 rounded-xl bg-violet-500 px-3 py-2 text-xs font-bold" :disabled="!tracks.length" @click="play"><Play :size="16"/> Reproducir</button><button :aria-label="'Eliminar '+active.name" class="rounded-xl border border-rose-500/30 px-3 py-2 text-rose-200 hover:bg-rose-500/10" @click="remove(active.id)"><Trash2 :size="17"/></button></div></header>
   <p v-if="!tracks.length" class="py-8 text-center text-xs text-[#a5a5b6]">Añade canciones desde el menú de opciones de cualquier pista.</p>
   <div v-for="(track,i) in tracks" :key="track.id" class="flex items-center gap-2"><div class="min-w-0 flex-1"><TrackRow :track="track" :index="i" :queue="tracks" :artist="catalog.artists.find(a=>a.id===track.artistId)" :album="catalog.albums.find(a=>a.id===track.albumId)"/></div><button class="rounded-full p-2 hover:bg-white/10" :aria-label="'Eliminar '+track.title+' de playlist'" @click="library.removeFromPlaylist(active.id,track.id)"><X :size="16"/></button></div>
  </section>
  <section v-else class="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-[#9ca0b3]">Selecciona una playlist para ver su contenido.</section>
 </div>
</NuxtLayout>
</template>
