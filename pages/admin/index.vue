<script setup lang="ts">
import { ArrowLeft, UploadCloud, Database, Music2, Disc3, Users, FileSpreadsheet, LockKeyhole, LogOut, Search, Save, CheckCircle2, AlertTriangle, RefreshCw, Pencil, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-vue-next'

definePageMeta({ layout: false })
useSeoMeta({title:'Administración | WEBMUSIC',robots:'noindex,nofollow'})
type Session = { authenticated:boolean; configured:boolean; database:boolean }
type Summary = { tracks:number; artists:number; albums:number; skipped:number }
type Preview = { summary:Summary; warnings:string[]; sample:Array<{artist:string;album:string;track:string;year:number;trackNumber:number}> }
type TrackRow = { id:string; title:string; artistId?:string; artistName?:string; audioUrl:string; published:number; sourceStatus?:string; cover?:string }
const {data:session,refresh:refreshSession,pending:loadingSession} = await useFetch<Session>('/api/admin/auth/session',{default:()=>({authenticated:false,configured:false,database:false})})
const password=ref('')
const busy=ref(false)
const feedback=ref('')
const failure=ref('')
const csv=ref('')
const filename=ref('')
const preview=ref<Preview|null>(null)
const licensed=ref(false)
const stats=ref<{database:boolean;artists:number;albums:number;tracks:number;message?:string}|null>(null)
const trackRows=ref<TrackRow[]>([])
const trackTotal=ref(0)
const trackSearch=ref('')
const offset=ref(0)
const selected=ref<TrackRow|null>(null)
const editTitle=ref('')
const editUrl=ref('')
const editPublished=ref(true)
const tab=ref<'import'|'tracks'>('import')
const isAuthorized=computed(()=>session.value?.authenticated===true)
const isDatabaseReady=computed(()=>session.value?.database===true)
async function login(){
 busy.value=true;failure.value='';feedback.value=''
 try {
  await $fetch('/api/admin/auth/login',{method:'POST',body:{password:password.value}})
  password.value=''
  await refreshSession(); await loadStats()
 }catch(e:any){failure.value=e?.data?.statusMessage||'No se pudo iniciar sesión'}
 finally{busy.value=false}
}
async function logout(){
 busy.value=true
 try{await $fetch('/api/admin/auth/logout',{method:'POST'});await refreshSession();stats.value=null;trackRows.value=[];selected.value=null;csv.value='';preview.value=null}
 catch(e:any){failure.value=e?.data?.statusMessage||'No se pudo cerrar sesión'}
 finally{busy.value=false}
}
async function loadStats(){
 if(!isAuthorized.value)return
 try{stats.value=await $fetch('/api/admin/stats')}
 catch(e:any){failure.value=e?.data?.statusMessage||'No se pudo consultar la base'}
}
async function loadTracks(){
 if(!isAuthorized.value)return
 busy.value=true;failure.value=''
 try{
  const response=await $fetch<{rows:TrackRow[];total:number}>('/api/admin/tracks',{query:{search:trackSearch.value,offset:offset.value,limit:20}})
  trackRows.value=response.rows;trackTotal.value=response.total
 }catch(e:any){failure.value=e?.data?.statusMessage||'No se pudo listar canciones'}
 finally{busy.value=false}
}
async function chooseFile(event:Event){
 const input=event.target as HTMLInputElement
 const file=input.files?.[0]
 preview.value=null;feedback.value='';failure.value=''
 if(!file)return
 if(file.size>650_000){failure.value='El CSV supera 650 KB. Divide el archivo en lotes menores.';return}
 filename.value=file.name
 csv.value=await file.text()
 licensed.value=false
}
async function previewCsv(){
 if(!csv.value)return
 busy.value=true;failure.value='';feedback.value='';preview.value=null
 try{preview.value=await $fetch<Preview>('/api/admin/import/preview',{method:'POST',body:{csv:csv.value}})}
 catch(e:any){failure.value=e?.data?.statusMessage||'CSV inválido'}
 finally{busy.value=false}
}
async function importCsv(){
 if(!preview.value||!licensed.value||!isDatabaseReady.value)return
 busy.value=true;failure.value='';feedback.value=''
 try{
  const result=await $fetch<{message:string}>('/api/admin/import',{method:'POST',body:{csv:csv.value,authorized:licensed.value}})
  feedback.value=result.message+' · Actualiza el catálogo para ver los cambios.'
  csv.value='';filename.value='';preview.value=null;licensed.value=false
  await loadStats()
 }catch(e:any){failure.value=e?.data?.statusMessage||'No se pudo importar'}
 finally{busy.value=false}
}
function edit(row:TrackRow){
 selected.value=row;editTitle.value=row.title;editUrl.value=row.audioUrl;editPublished.value=row.published===1
 feedback.value='';failure.value=''
}
async function save(){
 if(!selected.value||!isDatabaseReady.value)return
 busy.value=true;failure.value='';feedback.value=''
 try{
  await $fetch('/api/admin/tracks/'+encodeURIComponent(selected.value.id),{method:'PATCH',body:{title:editTitle.value,audioUrl:editUrl.value,published:editPublished.value}})
  feedback.value='Canción actualizada correctamente.'
  selected.value=null;await loadTracks()
 }catch(e:any){failure.value=e?.data?.statusMessage||'No se pudo guardar'}
 finally{busy.value=false}
}
function changeTab(next:'import'|'tracks'){tab.value=next;selected.value=null;if(next==='tracks')void loadTracks()}
function nextPage(){offset.value+=20;void loadTracks()}
function prevPage(){offset.value=Math.max(0,offset.value-20);void loadTracks()}
watch(trackSearch,()=>{offset.value=0})
watch(isAuthorized,ok=>{if(ok)void loadStats()},{immediate:true})
</script>
<template>
<div class="min-h-screen bg-[#090b13] px-4 py-6 text-white md:px-8 md:py-10">
 <div class="mx-auto max-w-[1180px]">
  <header class="mb-8 flex flex-wrap items-center justify-between gap-3">
   <div><NuxtLink to="/" class="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white"><ArrowLeft :size="18"/> Volver a WEBMUSIC</NuxtLink><h1 class="mt-4 text-3xl font-black tracking-tight">Panel administrativo</h1><p class="mt-2 text-sm text-[#9ea1b4]">Gestiona tu catálogo, importa artistas y organiza canciones.</p></div>
   <button v-if="isAuthorized" class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#202333] px-4 py-2.5 text-sm font-bold hover:bg-[#292d41]" @click="logout"><LogOut :size="17"/> Cerrar sesión</button>
  </header>
  <div v-if="loadingSession" class="animate-pulse rounded-2xl bg-[#1c1f2b] p-9 text-center">Verificando acceso…</div>
  <div v-else-if="!session?.configured" class="rounded-2xl border border-amber-300/20 bg-amber-500/[.08] p-7">
    <div class="flex items-center gap-3"><LockKeyhole :size="27" class="text-amber-300"/><h2 class="text-xl font-extrabold">Configura primero el acceso seguro</h2></div>
    <p class="mt-4 max-w-2xl text-sm leading-7 text-[#c2becd]">El administrador está deshabilitado hasta definir las variables privadas <code>NUXT_ADMIN_PASSWORD</code> y <code>NUXT_ADMIN_SESSION_SECRET</code>. Nunca las publiques en GitHub ni las coloques en variables públicas.</p>
    <p class="mt-3 text-sm text-[#c2becd]">La contraseña debe tener al menos 12 caracteres y el secreto de sesión al menos 32.</p>
  </div>
  <form v-else-if="!isAuthorized" class="mx-auto max-w-md rounded-3xl border border-white/[.09] bg-[#191c29] p-7 shadow-2xl sm:p-9" @submit.prevent="login">
    <span class="mb-5 inline-flex rounded-2xl bg-violet-500/15 p-4 text-violet-300"><ShieldCheck :size="30"/></span>
    <h2 class="text-2xl font-black">Iniciar sesión</h2>
    <p class="mt-2 text-sm leading-6 text-[#a5a8bb]">Introduce tu contraseña de administrador para gestionar la música.</p>
    <label for="admin-pass" class="mt-6 block text-xs font-bold text-[#c7c7d5]">Contraseña administrativa</label>
    <input id="admin-pass" v-model="password" required type="password" autocomplete="current-password" class="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0d0f19] px-4 outline-none focus:border-violet-500"/>
    <p v-if="failure" role="alert" class="mt-3 text-sm text-rose-300">{{failure}}</p>
    <button :disabled="busy" class="mt-5 h-12 w-full rounded-xl bg-violet-500 font-extrabold transition hover:bg-violet-400">{{busy?'Verificando…':'Entrar al panel'}}</button>
  </form>
  <div v-else>
   <div v-if="!isDatabaseReady" class="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/[.07] p-4"><AlertTriangle :size="20" class="mt-0.5 shrink-0 text-amber-300"/><div><p class="text-sm font-bold">Cloudflare D1 no está conectado</p><p class="mt-1 text-xs leading-6 text-[#d5c9c5]">Puedes explorar el catálogo de demostración y previsualizar CSV. Para guardar cambios o importar datos es obligatorio configurar la base D1.</p></div></div>
   <div v-if="feedback" role="status" class="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{{feedback}}</div>
   <div v-if="failure" role="alert" class="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{{failure}}</div>
   <div class="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
    <div v-for="item in [{label:'Artistas',value:stats?.artists??'—',icon:Users},{label:'Álbumes',value:stats?.albums??'—',icon:Disc3},{label:'Canciones',value:stats?.tracks??'—',icon:Music2},{label:'Base de datos',value:isDatabaseReady?'Conectada':'No conectada',icon:Database}]" :key="item.label" class="rounded-2xl border border-white/[.06] bg-[#1a1d2a] p-5"><component :is="item.icon" :size="20" class="text-violet-400"/><div class="mt-4 text-2xl font-black">{{item.value}}</div><p class="mt-1 text-xs text-[#9ca0b4]">{{item.label}}</p></div>
   </div>
   <div class="mb-6 flex flex-wrap gap-2"><button class="rounded-xl px-5 py-3 text-sm font-bold transition" :class="tab==='import'?'bg-violet-500 text-white':'bg-[#1e2130] text-[#b6b8c8] hover:text-white'" @click="changeTab('import')"><UploadCloud :size="17" class="mr-2 inline"/> Importar CSV</button><button class="rounded-xl px-5 py-3 text-sm font-bold transition" :class="tab==='tracks'?'bg-violet-500 text-white':'bg-[#1e2130] text-[#b6b8c8] hover:text-white'" @click="changeTab('tracks')"><Music2 :size="17" class="mr-2 inline"/> Canciones</button></div>
   <div v-if="tab==='import'" class="rounded-2xl border border-white/[.07] bg-[#191c29] p-5 sm:p-8">
    <div class="flex items-center gap-3"><FileSpreadsheet :size="25" class="text-violet-300"/><div><h2 class="text-xl font-black">Agregar artistas y canciones</h2><p class="mt-1 text-sm text-[#a4a7b8]">Carga un CSV con el formato utilizado anteriormente.</p></div></div>
    <label class="mt-6 flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-500/25 bg-violet-500/[.04] p-6 text-center transition hover:border-violet-400/50">
     <UploadCloud :size="34" class="mb-3 text-violet-300"/><span class="font-bold">{{filename||'Selecciona un archivo CSV'}}</span><span class="mt-2 text-xs text-[#a0a4b7]">Máximo 650 KB y 750 registros por archivo</span>
     <input type="file" accept=".csv,text/csv" class="sr-only" @change="chooseFile"/>
    </label>
    <div class="mt-5 flex flex-wrap gap-3"><button :disabled="!csv||busy" class="rounded-xl bg-[#342950] px-6 py-3 text-sm font-bold text-violet-100 transition hover:bg-[#4a376e]" @click="previewCsv">{{busy?'Procesando…':'Verificar y previsualizar'}}</button></div>
    <div v-if="preview" class="mt-7">
     <h3 class="text-lg font-extrabold">Vista previa</h3>
     <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div v-for="item in [{label:'Canciones',value:preview.summary.tracks},{label:'Artistas',value:preview.summary.artists},{label:'Álbumes',value:preview.summary.albums},{label:'Omitidas',value:preview.summary.skipped}]" :key="item.label" class="rounded-xl bg-[#25283a] p-4"><p class="text-2xl font-black text-violet-300">{{item.value}}</p><p class="mt-1 text-xs text-[#a9acbb]">{{item.label}}</p></div></div>
     <div class="mt-5 overflow-x-auto"><table class="w-full min-w-[550px] text-left text-sm"><thead class="text-xs text-[#9498aa]"><tr><th class="py-3">Artista</th><th>Álbum</th><th>Canción</th><th>Año</th></tr></thead><tbody><tr v-for="(item,i) in preview.sample" :key="i" class="border-t border-white/[.06]"><td class="py-3">{{item.artist}}</td><td>{{item.album}}</td><td>{{item.track}}</td><td>{{item.year||'—'}}</td></tr></tbody></table></div>
     <div v-if="preview.warnings.length" class="mt-5 rounded-xl border border-amber-400/15 bg-amber-500/[.06] p-4"><p class="text-sm font-bold text-amber-200">Advertencias del archivo</p><p v-for="(w,i) in preview.warnings" :key="i" class="mt-2 text-xs text-amber-100/80">{{w}}</p></div>
     <label class="mt-6 flex items-start gap-3 text-sm text-[#c6c6d1]"><input v-model="licensed" type="checkbox" class="mt-1 accent-violet-500"/><span>Confirmo que tengo autorización para utilizar estos enlaces de audio y publicarlos en mi plataforma.</span></label>
     <button class="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-bold transition hover:bg-violet-400 disabled:opacity-40" :disabled="!licensed||!isDatabaseReady||busy" @click="importCsv"><CheckCircle2 :size="18"/> Importar a Cloudflare D1</button>
    </div>
   </div>
   <div v-else class="rounded-2xl border border-white/[.07] bg-[#191c29] p-5 sm:p-7">
     <div class="mb-5 flex flex-wrap items-center gap-3"><div class="min-w-0 flex-1"><h2 class="text-xl font-extrabold">Administrar canciones</h2><p class="mt-1 text-xs text-[#9fa3b6]">{{trackTotal}} canciones encontradas</p></div><button class="rounded-lg p-2 text-violet-300 hover:bg-white/5" aria-label="Actualizar" @click="loadTracks"><RefreshCw :size="20"/></button></div>
     <form class="mb-4 flex gap-3" @submit.prevent="offset=0;loadTracks()"><input v-model="trackSearch" placeholder="Buscar canción o artista" aria-label="Buscar en el catálogo" class="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0e101b] px-4 text-sm outline-none focus:border-violet-400"/><button class="rounded-xl bg-violet-500 px-4 text-sm font-bold"><Search :size="18"/></button></form>
     <div class="divide-y divide-white/[.06]"><div v-for="row in trackRows" :key="row.id" class="flex items-center gap-3 py-3"><img v-if="row.cover" :src="row.cover" alt="" class="h-11 w-11 rounded-lg object-cover"/><span class="min-w-0 flex-1"><span class="block truncate text-sm font-bold">{{row.title}}</span><span class="block truncate text-xs text-[#999cae]">{{row.artistName}}</span></span><span class="hidden text-[11px] text-[#a4a7b9] sm:inline">{{row.published?'Publicada':'Oculta'}}</span><button :disabled="!isDatabaseReady" class="rounded-lg border border-white/10 p-2 hover:bg-white/10" :aria-label="'Editar '+row.title" @click="edit(row)"><Pencil :size="17"/></button></div></div>
     <div class="mt-5 flex items-center justify-center gap-4 text-sm"><button :disabled="offset===0||busy" class="rounded-lg border border-white/10 px-3 py-2" @click="prevPage"><ChevronLeft class="inline" :size="17"/> Anterior</button><span class="text-xs text-[#999caf]">{{trackTotal?offset+1:0}}–{{Math.min(trackTotal,offset+20)}} de {{trackTotal}}</span><button :disabled="offset+20>=trackTotal||busy" class="rounded-lg border border-white/10 px-3 py-2" @click="nextPage">Siguiente <ChevronRight class="inline" :size="17"/></button></div>
   </div>
   <div v-if="selected" class="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
    <form class="w-full max-w-lg rounded-2xl border border-white/10 bg-[#202331] p-6 shadow-2xl" @submit.prevent="save">
     <h2 class="text-xl font-black">Editar canción</h2><p class="mt-2 truncate text-xs text-[#a2a5b9]">{{selected.artistName}}</p>
     <label for="edit-title" class="mt-6 block text-xs font-bold text-[#bebed0]">Título</label><input id="edit-title" v-model="editTitle" required maxlength="200" class="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#11131d] px-3 outline-none focus:border-violet-400"/>
     <label for="edit-url" class="mt-5 block text-xs font-bold text-[#bebed0]">Enlace HTTPS de audio</label><input id="edit-url" v-model="editUrl" required type="url" class="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#11131d] px-3 outline-none focus:border-violet-400"/>
     <label class="mt-5 flex items-center gap-3 text-sm"><input v-model="editPublished" type="checkbox" class="accent-violet-500"/> Publicada</label>
     <div class="mt-8 flex justify-end gap-3"><button type="button" class="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold" @click="selected=null">Cancelar</button><button :disabled="busy" class="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold"><Save :size="17"/> Guardar</button></div>
    </form>
   </div>
  </div>
 </div>
</div>
</template>
