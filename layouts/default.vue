<script setup lang="ts">
import { House, Compass, Search, Library, Heart, ListMusic, Music2, Menu, X, Disc3, Users } from 'lucide-vue-next'
const menuOpen=ref(false)
const search=ref('')
const links=[
 {to:'/',name:'Inicio',icon:House},{to:'/explorar',name:'Explorar',icon:Compass},
 {to:'/artistas',name:'Artistas',icon:Users},{to:'/albumes',name:'Álbumes',icon:Disc3},
 {to:'/biblioteca',name:'Tu biblioteca',icon:Library}
]
watch(()=>useRoute().fullPath,()=>{menuOpen.value=false})
function submitSearch(){if(search.value.trim())navigateTo('/buscar?q='+encodeURIComponent(search.value.trim()))}
</script>
<template>
<div class="min-h-screen bg-[#090b12] text-white">
 <aside :class="menuOpen?'translate-x-0':'-translate-x-full'" class="fixed inset-y-0 left-0 z-50 w-[252px] border-r border-white/[.07] bg-[#10121b] transition-transform lg:translate-x-0">
  <div class="flex h-24 items-center gap-3 px-7">
   <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20"><Music2 :size="25" :stroke-width="2.6"/></div>
   <div class="text-[22px] font-extrabold tracking-tight">web<span class="text-violet-400">music</span></div>
   <button aria-label="Cerrar menú" class="ml-auto lg:hidden" @click="menuOpen=false"><X/></button>
  </div>
  <div class="px-4 pt-8">
   <p class="mb-4 px-4 text-[11px] font-bold uppercase tracking-[.18em] text-[#7d8194]">Descubre</p>
   <NuxtLink v-for="link in links.slice(0,4)" :key="link.to" :to="link.to" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#969aaa] transition hover:bg-white/5 hover:text-white" active-class="!bg-violet-500/15 !text-violet-300"><component :is="link.icon" :size="19"/>{{link.name}}</NuxtLink>
   <p class="mb-4 mt-9 px-4 text-[11px] font-bold uppercase tracking-[.18em] text-[#7d8194]">Mi música</p>
   <NuxtLink :to="links[4].to" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#969aaa] hover:bg-white/5 hover:text-white" active-class="!bg-violet-500/15 !text-violet-300"><Library :size="19"/> Tu biblioteca</NuxtLink>
   <NuxtLink to="/biblioteca" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#969aaa] hover:bg-white/5 hover:text-white"><Heart :size="19"/> Favoritos</NuxtLink>
   <NuxtLink to="/biblioteca" class="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#969aaa] hover:bg-white/5 hover:text-white"><ListMusic :size="19"/> Playlists</NuxtLink>
  </div>
  <div class="absolute bottom-36 left-4 right-4 rounded-2xl border border-violet-400/10 bg-gradient-to-br from-violet-600/15 to-fuchsia-600/5 p-5">
   <p class="font-semibold">Tu música, tu espacio.</p>
   <p class="mt-2 text-xs leading-5 text-[#969aaa]">Explora sonidos nuevos y organiza tus favoritas.</p>
  </div>
 </aside>
 <div class="lg:pl-[252px]">
  <header class="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/[.05] bg-[#090b12]/90 px-5 backdrop-blur-xl md:px-9">
   <button aria-label="Abrir menú" class="lg:hidden" @click="menuOpen=true"><Menu/></button>
   <form class="relative max-w-xl flex-1" @submit.prevent="submitSearch">
    <Search :size="19" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#898ca1]"/>
    <input v-model="search" aria-label="Buscar música" placeholder="Buscar canciones, artistas, álbumes..." class="h-11 w-full rounded-xl border border-white/[.06] bg-[#181b27] pl-12 pr-4 text-sm text-white outline-none placeholder:text-[#83879b] focus:border-violet-500/60"/>
   </form>
   <div class="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-[#181b27] px-4 py-2 text-xs font-semibold text-[#b7b9c6] sm:flex"><span class="h-2 w-2 rounded-full bg-emerald-400"/> 469 canciones · 3 artistas</div>
  </header>
  <main class="min-h-[calc(100vh-180px)] px-5 pb-40 pt-8 md:px-9"><slot/></main>
 </div>
 <PlayerBar/>
</div>
</template>
