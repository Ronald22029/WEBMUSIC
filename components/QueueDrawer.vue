<script setup lang="ts">
import { X, Trash2, ListMusic, Play, Radio } from 'lucide-vue-next'
const props=defineProps<{open:boolean}>()
const emit=defineEmits<{close:[]}>()
const p=usePlayer()
const {data:catalog}=useCatalog()
const upcoming=computed(()=>p.queue.value.map((track,i)=>({track,i})).filter(x=>x.i>=p.index.value))
function artistName(id:string){return catalog.value.artists.find(a=>a.id===id)?.name||'Artista'}
</script>
<template>
 <div v-if="open" class="fixed inset-0 z-[140] bg-black/65" @click.self="emit('close')">
  <section role="dialog" aria-modal="true" aria-label="Cola de reproducción" class="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#181a29] shadow-2xl">
   <header class="flex items-center justify-between gap-2 border-b border-white/10 p-5">
    <div><h2 class="flex items-center gap-2 text-lg font-extrabold"><ListMusic :size="22"/> Cola de reproducción</h2><p class="mt-1 text-xs text-[#9da0b5]">{{Math.max(0,p.queue.value.length-p.index.value-1)}} pendientes</p></div>
    <button aria-label="Cerrar cola" class="rounded-lg p-2 hover:bg-white/10" @click="emit('close')"><X :size="22"/></button>
   </header>
   <div class="flex-1 overflow-y-auto px-3 py-3">
    <p v-if="!upcoming.length" class="p-6 text-center text-sm text-[#a3a6bd]">Todavía no hay canciones en cola.</p>
    <div v-for="entry in upcoming" :key="entry.i+'-'+entry.track.id" class="mb-1 flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/[.06]" :class="{'bg-violet-500/10':entry.i===p.index.value}">
     <button class="min-w-0 flex-1 text-left" @click="p.start(entry.track)">
      <p class="truncate text-sm font-bold">{{entry.track.title}}</p>
      <p class="mt-1 truncate text-xs text-[#9da0b5]">{{artistName(entry.track.artistId)}}</p>
      <span v-if="entry.i===p.index.value" class="text-[10px] font-bold uppercase text-violet-300">{{p.playing.value?'Reproduciendo':'Actual'}}</span>
     </button>
     <button v-if="entry.i>p.index.value" class="rounded-full p-2 text-[#9da0b5] hover:bg-white/10 hover:text-white" :aria-label="'Quitar de cola '+entry.track.title" @click="p.removeFromQueue(entry.i)"><X :size="16"/></button>
     <Play v-else :size="16" class="text-violet-300"/>
    </div>
    <button v-if="p.queueScope.value" :disabled="p.loadingMore.value" class="my-3 w-full rounded-xl border border-white/10 p-3 text-sm font-bold hover:bg-white/10 disabled:opacity-50" @click="p.loadNextPage()">{{p.loadingMore.value?'Cargando canciones...':'Cargar más canciones de esta lista'}}</button>
   </div>
   <footer class="border-t border-white/10 p-4"><button :disabled="p.index.value>=p.queue.value.length-1" class="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold hover:bg-white/10 disabled:opacity-40" @click="p.clearUpcoming()"><Trash2 :size="16"/> Vaciar próximas canciones</button></footer>
  </section>
 </div>
</template>
