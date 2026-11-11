<script setup lang="ts">
import { ArrowLeft, Plus, Pencil, Save, X, Users, Disc3, Database, Search } from 'lucide-vue-next'
definePageMeta({layout:false})
useSeoMeta({title:'Gestionar artistas y álbumes | WEBMUSIC',robots:'noindex,nofollow'})
type Artist = {id:string;name:string;slug:string;cover:string;description:string;albums:number;tracks:number}
type Album = {id:string;title:string;slug:string;artistId:string;artistName:string;year:number;cover:string;genre?:string;releaseType?:string;tracks:number}
const {data:session,pending}=await useFetch<{authenticated:boolean;storage?:string}>('/api/admin/auth/session')
const tab=ref<'artists'|'albums'>('artists')
const artists=ref<Artist[]>([])
const albums=ref<Album[]>([])
const loading=ref(false),error=ref(''),notice=ref(''),search=ref('')
const editing=ref<null|{kind:'artist'|'album';id?:string}>(null)
const name=ref(''),cover=ref(''),description=ref(''),artistId=ref(''),year=ref(0),genre=ref(''),releaseType=ref('Álbum')
const isLocal=computed(()=>session.value?.storage==='local')
const filteredArtists=computed(()=>artists.value.filter(a=>a.name.toLocaleLowerCase('es').includes(search.value.toLocaleLowerCase('es'))))
const filteredAlbums=computed(()=>albums.value.filter(a=>(a.title+' '+a.artistName).toLocaleLowerCase('es').includes(search.value.toLocaleLowerCase('es'))))
async function load(){
 if(!session.value?.authenticated||!isLocal.value)return
 loading.value=true;error.value=''
 try{
  const [a,b]=await Promise.all([$fetch<Artist[]>('/api/admin/artists'),$fetch<Album[]>('/api/admin/albums')])
  artists.value=a;albums.value=b
 }catch(e:any){error.value=e?.data?.statusMessage||'No se pudo cargar el catálogo'}
 finally{loading.value=false}
}
watch(()=>session.value?.authenticated,(value)=>{if(value)void load()},{immediate:true})
function add(kind:'artist'|'album'){
 editing.value={kind};name.value='';cover.value='';description.value='';artistId.value=artists.value[0]?.id||'';year.value=new Date().getFullYear();genre.value='';releaseType.value='Álbum';error.value='';notice.value=''
}
function editArtist(a:Artist){editing.value={kind:'artist',id:a.id};name.value=a.name;cover.value=a.cover;description.value=a.description||'';error.value='';notice.value=''}
function editAlbum(a:Album){editing.value={kind:'album',id:a.id};name.value=a.title;cover.value=a.cover;artistId.value=a.artistId;year.value=a.year;genre.value=a.genre||'';releaseType.value=a.releaseType||'Álbum';error.value='';notice.value=''}
async function save(){
 if(!editing.value)return
 loading.value=true;error.value='';notice.value=''
 const current=editing.value
 const isAlbum=current.kind==='album'
 const body=isAlbum?{title:name.value,cover:cover.value,artistId:artistId.value,year:year.value,genre:genre.value,releaseType:releaseType.value}:{name:name.value,cover:cover.value,description:description.value}
 const base=isAlbum?'/api/admin/albums':'/api/admin/artists'
 try{
  if(current.id)await $fetch(base+'/'+encodeURIComponent(current.id),{method:'PATCH',body})
  else await $fetch(base,{method:'POST',body})
  editing.value=null
  notice.value='Cambios guardados en el catálogo local.'
  await Promise.all([load(),refreshNuxtData('music-catalog')])
 }catch(e:any){error.value=e?.data?.statusMessage||'No se pudo guardar'}
 finally{loading.value=false}
}
function changeTab(value:'artists'|'albums'){tab.value=value;search.value='';error.value=''}
</script>
<template>
<div class="min-h-screen bg-[#090b13] px-4 py-8 text-white sm:px-8">
 <main class="mx-auto max-w-6xl">
  <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
   <div><NuxtLink to="/admin" class="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-white"><ArrowLeft :size="18"/> Volver al panel administrativo</NuxtLink><h1 class="mt-5 text-3xl font-black">Gestionar discografía</h1><p class="mt-2 text-sm text-[#a0a3b5]">Crea y edita artistas y álbumes sin salir de tu computadora.</p></div>
   <div class="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300"><Database :size="16"/> Almacenamiento local</div>
  </div>
  <section v-if="!session?.authenticated" class="rounded-2xl border border-amber-400/20 bg-[#1a1d29] p-7"><h2 class="text-xl font-bold">Inicia sesión para administrar</h2><p class="mt-2 text-sm text-[#a5a6b7]">Primero inicia sesión en el panel principal.</p><NuxtLink to="/admin" class="mt-5 inline-block rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold">Ir al panel</NuxtLink></section>
  <section v-else-if="!isLocal" class="rounded-2xl border border-white/10 bg-[#1a1d29] p-7">Este editor está disponible en el modo de desarrollo local.</section>
  <template v-else>
   <div v-if="notice" role="status" class="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{{notice}}</div>
   <div v-if="error" role="alert" class="mb-5 rounded-xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-200">{{error}}</div>
   <div class="mb-6 grid grid-cols-2 gap-3">
    <button class="flex items-center gap-2 rounded-xl p-4 text-left text-sm font-bold" :class="tab==='artists'?'bg-violet-500':'bg-[#202331] hover:bg-[#292d3b]'" @click="changeTab('artists')"><Users :size="20"/> Artistas <span class="ml-auto opacity-70">{{artists.length}}</span></button>
    <button class="flex items-center gap-2 rounded-xl p-4 text-left text-sm font-bold" :class="tab==='albums'?'bg-violet-500':'bg-[#202331] hover:bg-[#292d3b]'" @click="changeTab('albums')"><Disc3 :size="20"/> Álbumes <span class="ml-auto opacity-70">{{albums.length}}</span></button>
   </div>
   <div class="mb-6 flex flex-wrap items-center gap-3">
    <div class="relative min-w-0 flex-1"><Search :size="18" class="absolute left-4 top-3.5 text-[#9194a8]"/><input v-model="search" placeholder="Buscar por nombre..." aria-label="Buscar artistas o álbumes" class="h-11 w-full rounded-xl border border-white/10 bg-[#1a1d29] pl-11 pr-4 text-sm outline-none focus:border-violet-400"/></div>
    <button :disabled="loading||tab==='albums'&&!artists.length" class="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold hover:bg-violet-400" @click="add(tab==='artists'?'artist':'album')"><Plus :size="18"/> Añadir {{tab==='artists'?'artista':'álbum'}}</button>
   </div>
   <div v-if="loading&&!editing" class="rounded-xl bg-white/5 p-10 text-center text-sm">Cargando catálogo…</div>
   <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <template v-if="tab==='artists'">
      <div v-for="a in filteredArtists" :key="a.id" class="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-[#1a1d29] p-4">
        <img v-if="a.cover" :src="a.cover" :alt="a.name" class="h-16 w-16 rounded-xl object-cover"/>
        <div v-else class="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-500/10"><Users :size="24"/></div>
        <div class="min-w-0 flex-1"><p class="truncate text-sm font-bold">{{a.name}}</p><p class="mt-1 text-xs text-[#a0a2b4]">{{a.albums}} álbumes · {{a.tracks}} canciones</p></div>
        <button :aria-label="'Editar '+a.name" class="rounded-xl border border-white/10 p-2 hover:bg-white/10" @click="editArtist(a)"><Pencil :size="17"/></button>
      </div>
    </template>
    <template v-else>
      <div v-for="a in filteredAlbums" :key="a.id" class="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-[#1a1d29] p-4">
        <img v-if="a.cover" :src="a.cover" :alt="a.title" class="h-16 w-16 rounded-xl object-cover"/>
        <div v-else class="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-500/10"><Disc3 :size="24"/></div>
        <div class="min-w-0 flex-1"><p class="truncate text-sm font-bold">{{a.title}}</p><p class="mt-1 truncate text-xs text-[#a0a2b4]">{{a.artistName}} · {{a.year||'—'}} · {{a.tracks}} canciones</p></div>
        <button :aria-label="'Editar '+a.title" class="rounded-xl border border-white/10 p-2 hover:bg-white/10" @click="editAlbum(a)"><Pencil :size="17"/></button>
      </div>
    </template>
   </div>
  </template>
  <div v-if="editing" class="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
    <form class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#202331] p-6 sm:p-8" @submit.prevent="save">
     <div class="flex items-center justify-between gap-3"><h2 class="text-xl font-black">{{editing.id?'Editar':'Añadir'}} {{editing.kind==='artist'?'artista':'álbum'}}</h2><button aria-label="Cerrar edición" type="button" class="rounded-lg p-2 hover:bg-white/10" @click="editing=null"><X :size="19"/></button></div>
     <label class="mt-6 block text-xs font-bold text-[#c4c4d3]">{{editing.kind==='artist'?'Nombre del artista':'Título del álbum'}}<input v-model="name" required maxlength="200" class="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#11131e] px-4 text-sm outline-none focus:border-violet-400"/></label>
     <label class="mt-5 block text-xs font-bold text-[#c4c4d3]">URL de portada (HTTPS, opcional)<input v-model="cover" type="url" class="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#11131e] px-4 text-sm outline-none focus:border-violet-400"/></label>
     <label v-if="editing.kind==='artist'" class="mt-5 block text-xs font-bold text-[#c4c4d3]">Descripción<textarea v-model="description" rows="4" maxlength="2000" class="mt-2 w-full rounded-lg border border-white/10 bg-[#11131e] p-4 text-sm outline-none focus:border-violet-400"/></label>
     <template v-else>
      <label class="mt-5 block text-xs font-bold text-[#c4c4d3]">Artista<select v-model="artistId" :disabled="!!editing.id" class="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#11131e] px-4 text-sm"><option v-for="a in artists" :key="a.id" :value="a.id">{{a.name}}</option></select></label>
      <div class="mt-5 grid grid-cols-2 gap-4">
       <label class="block text-xs font-bold text-[#c4c4d3]">Año<input v-model.number="year" type="number" min="0" max="2100" class="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#11131e] px-4 text-sm"/></label>
       <label class="block text-xs font-bold text-[#c4c4d3]">Tipo<input v-model="releaseType" class="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#11131e] px-4 text-sm"/></label>
      </div>
      <label class="mt-5 block text-xs font-bold text-[#c4c4d3]">Género<input v-model="genre" class="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#11131e] px-4 text-sm"/></label>
     </template>
     <p class="mt-4 text-xs text-[#a2a4b5]">Los identificadores existentes se mantienen para no romper enlaces ni referencias a canciones.</p>
     <div v-if="error" role="alert" class="mt-4 text-sm text-rose-300">{{error}}</div>
     <div class="mt-7 flex justify-end gap-3"><button type="button" class="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold" @click="editing=null">Cancelar</button><button :disabled="loading" class="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold hover:bg-violet-400"><Save :size="17"/> {{loading?'Guardando…':'Guardar cambios'}}</button></div>
    </form>
  </div>
 </main>
</div>
</template>
