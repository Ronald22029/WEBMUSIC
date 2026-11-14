<script setup lang="ts">
import { House, Compass, Search, Library, Music2, Menu, X, Disc3, Users, ArrowUpRight, Command, Heart } from 'lucide-vue-next'
const route = useRoute()
const { data } = useCatalog()
const menuOpen = ref(false)
const search = ref(String(route.query.q || ''))
const searchFocused = ref(false)
const debouncedSearch=useDebouncedValue(search,250)
const input = ref<HTMLInputElement | null>(null)
const nav = [
 { to: '/', name: 'Inicio', icon: House },
 { to: '/explorar', name: 'Explorar', icon: Compass },
 { to: '/artistas', name: 'Artistas', icon: Users },
 { to: '/albumes', name: 'Álbumes', icon: Disc3 },
 { to: '/biblioteca', name: 'Mi biblioteca', icon: Library },
 { to: '/playlists', name: 'Mis playlists', icon: Library }
]
const normalized = computed(() => search.value.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,''))
const {data:quickTracks}=useTracks(computed(()=>({q:normalized.value.length>=2?debouncedSearch.value:'',limit:6})))
const suggestions = computed(() => {
 if (normalized.value.length < 2) return []
 const term = normalized.value
 const matches = (s: string) => s.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(term)
 return [
  ...data.value.artists.filter(a=>matches(a.name)).slice(0,2).map(a=>({name:a.name,meta:'Artista',to:'/artista/'+a.slug,cover:a.cover})),
  ...data.value.albums.filter(a=>matches(a.title)).slice(0,2).map(a=>({name:a.title,meta:'Álbum',to:'/album/'+a.slug,cover:a.cover})),
  ...quickTracks.value.rows.filter(t=>matches(t.title)).slice(0,3).map(t=>({name:t.title,meta:'Canción',to:'/album/'+data.value.albums.find(a=>a.id===t.albumId)?.slug,cover:t.cover}))
 ].slice(0,6)
})
watch(()=>route.fullPath,()=>{menuOpen.value=false;searchFocused.value=false;search.value=String(route.query.q||'')})
function submit() { if (search.value.trim()) { searchFocused.value=false; navigateTo('/buscar?q='+encodeURIComponent(search.value.trim())) } }
function go(to:string){searchFocused.value=false;menuOpen.value=false;navigateTo(to)}
function keydown(e:KeyboardEvent){
 if (e.key==='/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)){e.preventDefault();input.value?.focus()}
 if (e.key==='Escape'){searchFocused.value=false;input.value?.blur();menuOpen.value=false}
}
onMounted(()=>window.addEventListener('keydown',keydown))
onUnmounted(()=>window.removeEventListener('keydown',keydown))
</script>
<template>
<div class="min-h-screen bg-[#080a11] text-white">
 <div v-if="menuOpen" class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" @click="menuOpen=false"/>
 <aside :class="menuOpen?'translate-x-0':'-translate-x-full'" class="fixed inset-y-0 left-0 z-50 w-[248px] border-r border-white/[.065] bg-[#10131c] transition-transform duration-300 lg:translate-x-0">
  <div class="flex h-24 items-center gap-3 px-6">
   <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20"><Music2 :size="26" :stroke-width="2.5"/></div>
   <NuxtLink to="/" class="text-[22px] font-black tracking-tight">web<span class="text-violet-400">music</span></NuxtLink>
   <button class="ml-auto lg:hidden" aria-label="Cerrar menú" @click="menuOpen=false"><X :size="22"/></button>
  </div>
  <div class="px-4 pt-6">
   <p class="mb-3 px-4 text-[10px] font-extrabold uppercase tracking-[.24em] text-[#6e7285]">Explorar</p>
   <NuxtLink v-for="item in nav.slice(0,4)" :key="item.to" :to="item.to" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#999cad] transition-colors hover:bg-white/[.06] hover:text-white" active-class="!bg-violet-500/15 !text-violet-300">
     <component :is="item.icon" :size="19"/>{{item.name}}
   </NuxtLink>
   <p class="mb-3 mt-9 px-4 text-[10px] font-extrabold uppercase tracking-[.24em] text-[#6e7285]">Personal</p>
   <NuxtLink to="/biblioteca" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#999cad] hover:bg-white/[.06] hover:text-white" active-class="!bg-violet-500/15 !text-violet-300"><Library :size="19"/>Mi biblioteca</NuxtLink>
   <NuxtLink to="/biblioteca" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#999cad] hover:bg-white/[.06] hover:text-white"><Heart :size="19"/>Mis favoritos</NuxtLink><NuxtLink to="/playlists" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#999cad] hover:bg-white/[.06] hover:text-white"><Library :size="19"/>Mis playlists</NuxtLink>
  </div>
  <div class="absolute bottom-36 left-4 right-4 rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-500/15 to-[#1b1d2b] p-5">
   <EqualizerBars :active="false"/>
   <p class="mt-3 text-sm font-bold">Todo en un mismo lugar</p>
   <p class="mt-1 text-xs leading-5 text-[#a6a6ba]">Artistas, álbumes y canciones a un toque de distancia.</p>
  </div>
 </aside>
 <div class="lg:pl-[248px]">
  <header class="sticky top-0 z-30 flex h-[74px] items-center gap-3 border-b border-white/[.06] bg-[#090b13]/90 px-4 backdrop-blur-2xl md:px-8">
   <button class="rounded-lg p-2 text-[#bcbdd0] lg:hidden" aria-label="Abrir menú" @click="menuOpen=true"><Menu :size="23"/></button>
   <form class="relative max-w-[620px] flex-1" role="search" @submit.prevent="submit">
    <Search :size="18" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9094a9]"/>
    <input ref="input" v-model="search" autocomplete="off" aria-label="Buscar artistas, álbumes o canciones" placeholder="¿Qué quieres escuchar?" class="h-11 w-full rounded-2xl border border-white/[.08] bg-[#1b1e2c] pl-11 pr-11 text-sm text-white transition outline-none placeholder:text-[#8d90a4] focus:border-violet-500/70 focus:bg-[#202336]" @focus="searchFocused=true" @blur="setTimeout(()=>searchFocused=false,180)"/>
    <button v-if="search" type="button" class="absolute right-3 top-3 text-[#8f92a5] hover:text-white" aria-label="Borrar búsqueda" @click="search=''"><X :size="18"/></button>
    <span v-else class="pointer-events-none absolute right-4 top-3 hidden rounded border border-white/10 px-2 py-0.5 text-[10px] text-[#85899c] md:block">/</span>
    <div v-if="searchFocused && suggestions.length" class="absolute left-0 right-0 top-[52px] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#202332] p-2 shadow-2xl shadow-black/60">
     <button v-for="s in suggestions" :key="s.to+s.name" type="button" class="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[.08]" @mousedown.prevent="go(s.to)">
      <img v-if="s.cover" :src="s.cover" :alt="s.name" class="h-10 w-10 rounded-lg object-cover"/>
      <div class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold">{{s.name}}</span><span class="text-[11px] text-[#a9a9b8]">{{s.meta}}</span></div><ArrowUpRight :size="15" class="text-[#8a8fa2]"/>
     </button>
     <button type="submit" class="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-violet-300 hover:bg-white/5">Ver todos los resultados para “{{search}}”</button>
    </div>
   </form>
   <div class="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-[#1b1e2a] px-4 py-2 text-xs font-semibold text-[#c2c3ce] sm:flex"><span class="h-2 w-2 rounded-full bg-emerald-400"/> Biblioteca musical</div>
  </header>
  <main class="min-h-[calc(100vh-160px)] px-4 pb-[230px] pt-7 sm:px-6 md:px-8 md:pt-9 lg:pb-40"><slot/></main>
 </div>
 <ClientOnly><PlayerBar/></ClientOnly>
 <nav aria-label="Navegación móvil" class="fixed bottom-0 left-0 right-0 z-40 flex h-[66px] items-center justify-around border-t border-white/10 bg-[#10131c]/95 pb-1 backdrop-blur-xl lg:hidden">
  <NuxtLink v-for="item in [nav[0],nav[1],nav[2],nav[4]]" :key="item.to" :to="item.to" class="flex flex-col items-center gap-1 px-2 text-[10px] font-semibold text-[#9b9dad]" active-class="!text-violet-300"><component :is="item.icon" :size="20"/>{{item.name}}</NuxtLink>
 </nav>
</div>
</template>
