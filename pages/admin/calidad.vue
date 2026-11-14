<script setup lang="ts">
import { ArrowLeft, Database, CalendarX, ImageOff, Link2Off, AlertTriangle, ShieldCheck, Copy, Download, RefreshCcw } from 'lucide-vue-next'
definePageMeta({layout:false})
useSeoMeta({title:'Calidad del catálogo | WEBMUSIC',robots:'noindex,nofollow'})
type Finding={id:string;name:string;artist?:string;reason:string;type:string}
type Diagnostics={storage:string;counts:{missingYear:number;missingCover:number;missingAudio:number;uncheckedAudio:number;duplicateLinks:number;duplicateAlbums:number};kind:string;total:number;offset:number;limit:number;rows:Finding[];notice:string}
const {data:session}=await useFetch<{authenticated:boolean}>('/api/admin/auth/session')
const kind=ref('missing_year'),page=ref(1),limit=30
const params=computed(()=>({kind:kind.value,offset:(page.value-1)*limit,limit}))
const {data:result,pending,refresh,error}=await useFetch<Diagnostics>('/api/admin/quality',{query:params,immediate:!!session.value?.authenticated})
watch(kind,()=>page.value=1)
const options=[
 {id:'missing_year',title:'Álbumes sin año',count:'missingYear'},
 {id:'missing_cover',title:'Álbumes sin portada',count:'missingCover'},
 {id:'missing_audio',title:'Canciones sin URL válida',count:'missingAudio'},
 {id:'unchecked_audio',title:'Enlaces no verificados',count:'uncheckedAudio'},
 {id:'duplicate_links',title:'Pistas con enlaces repetidos',count:'duplicateLinks'},
 {id:'duplicate_albums',title:'Posibles álbumes duplicados',count:'duplicateAlbums'}
] as const
function exportCsv(){
 if(!result.value)return
 const fields=['id','name','artist','reason'] as const
 const text=fields.join(',')+'\n'+result.value.rows.map(r=>fields.map(key=>'"'+String(r[key]||'').replaceAll('"','""')+'"').join(',')).join('\n')
 const blob=new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8;'})
 const href=URL.createObjectURL(blob)
 const link=document.createElement('a');link.href=href;link.download='webmusic-calidad-'+kind.value+'-pagina-'+page.value+'.csv';link.click()
 URL.revokeObjectURL(href)
}
</script>
<template>
<div class="min-h-screen bg-[#090b13] px-4 py-8 text-white sm:px-8">
 <main class="mx-auto max-w-6xl">
  <NuxtLink to="/admin" class="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-white"><ArrowLeft :size="18"/> Volver al administrador</NuxtLink>
  <h1 class="mt-5 text-3xl font-black">Diagnóstico del catálogo</h1>
  <p class="mt-2 max-w-3xl text-sm text-[#a5a7b9]">Herramientas de revisión de metadatos y referencias. Los resultados son indicios, no comprobaciones de disponibilidad real ni derechos de autor. No se borra nada.</p>
  <div v-if="!session?.authenticated" class="mt-8 rounded-xl border border-amber-500/20 bg-[#24202a] p-6"><p>Inicia sesión como administrador para ver los diagnósticos.</p><NuxtLink to="/admin" class="mt-3 inline-block text-violet-300">Iniciar sesión</NuxtLink></div>
  <template v-else>
   <div class="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
    <button v-for="option in options" :key="option.id" class="rounded-xl border p-4 text-left hover:border-violet-400/50" :class="kind===option.id?'border-violet-400/50 bg-violet-500/15':'border-white/10 bg-[#1a1c2b]'" @click="kind=option.id">
     <p class="text-2xl font-black">{{result?.counts[option.count]??'—'}}</p>
     <p class="mt-2 text-xs text-[#b4b4c5]">{{option.title}}</p>
    </button>
   </div>
   <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
    <div><h2 class="text-xl font-bold">{{options.find(x=>x.id===kind)?.title}}</h2><p class="mt-1 text-xs text-[#999eb1]">{{result?.total??0}} registros coincidentes</p></div>
    <div class="flex gap-2"><button class="rounded-xl border border-white/10 px-4 py-2 text-xs hover:bg-white/10" @click="refresh()"><RefreshCcw :size="16" class="mr-1 inline"/> Actualizar</button><button :disabled="!result?.rows.length" class="rounded-xl bg-violet-500 px-4 py-2 text-xs font-bold disabled:opacity-40" @click="exportCsv"><Download :size="16" class="mr-1 inline"/> Exportar página CSV</button></div>
   </div>
   <p v-if="pending" class="my-4 text-sm text-[#a0a4bd]">Analizando registros…</p>
   <p v-if="error" role="alert" class="my-4 text-sm text-rose-300">{{error.message}}</p>
   <div class="mt-4 divide-y divide-white/[.06] overflow-hidden rounded-xl border border-white/10 bg-[#171a26]">
    <div v-for="row in result?.rows||[]" :key="row.id" class="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
     <div class="min-w-0"><p class="truncate text-sm font-semibold">{{row.name}}</p><p class="text-xs text-[#a3a6b9]">{{row.artist||'Artista no indicado'}}</p></div>
     <p class="text-xs text-amber-200/80">{{row.reason}}</p>
    </div>
    <p v-if="!pending&&!result?.rows.length" class="p-8 text-center text-sm text-[#a0a4b8]">No se encontraron registros.</p>
   </div>
   <div v-if="result?.total&&result.total>limit" class="mt-5 flex items-center justify-center gap-5 text-sm">
    <button class="rounded-lg border border-white/10 px-4 py-2 disabled:opacity-40" :disabled="page===1" @click="page--">Anterior</button>
    <span>{{page}} / {{Math.ceil(result.total/limit)}}</span>
    <button class="rounded-lg border border-white/10 px-4 py-2 disabled:opacity-40" :disabled="page*limit>=result.total" @click="page++">Siguiente</button>
   </div>
   <p class="mt-7 text-xs leading-6 text-[#8f93a7]">Los enlaces marcados «no verificados» pueden funcionar o no. No se han realizado solicitudes automáticas a servidores de música ni se han borrado registros.</p>
  </template>
 </main>
</div>
</template>
