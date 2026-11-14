import type { Track } from '~/types/music'
const STORAGE_KEY='webmusic.library.v1'
export type UserPlaylist={id:string;name:string;trackIds:string[];createdAt:string}
export function useLocalLibrary(){
 const favorites=useState<string[]>('wm-favorites',()=>[])
 const recent=useState<string[]>('wm-recent',()=>[])
 const playlists=useState<UserPlaylist[]>('wm-playlists',()=>[])
 const hydrated=useState('wm-hydrated',()=>false)
 function save(){
  if(import.meta.server||!hydrated.value)return
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({favorites:favorites.value,recent:recent.value,playlists:playlists.value}))}
  catch{/* Almacenamiento bloqueado o privado */}
 }
 function hydrate(){
  if(import.meta.server||hydrated.value)return
  try{
   const raw=localStorage.getItem(STORAGE_KEY)
   if(raw){
    const data=JSON.parse(raw) as Record<string,any>
    favorites.value=Array.isArray(data.favorites)?data.favorites.filter((x:unknown)=>typeof x==='string').slice(0,2000):[]
    recent.value=Array.isArray(data.recent)?data.recent.filter((x:unknown)=>typeof x==='string').slice(0,40):[]
    playlists.value=Array.isArray(data.playlists)?data.playlists.filter((x:any)=>x&&typeof x.id==='string'&&typeof x.name==='string'&&Array.isArray(x.trackIds)).slice(0,50).map((x:any)=>({
     id:x.id.slice(0,80),name:x.name.slice(0,80),createdAt:typeof x.createdAt==='string'?x.createdAt:'',
     trackIds:x.trackIds.filter((id:unknown)=>typeof id==='string').slice(0,200)
    })):[]
   }
  }catch{/* Datos inválidos */}
  hydrated.value=true
 }
 function isFavorite(id:string){return favorites.value.includes(id)}
 function toggleFavorite(id:string){favorites.value=isFavorite(id)?favorites.value.filter(x=>x!==id):[id,...favorites.value];save()}
 function remember(id:string){recent.value=[id,...recent.value.filter(x=>x!==id)].slice(0,30);save()}
 function favoriteTracks(tracks:Track[]){const lookup=new Map(tracks.map(t=>[t.id,t]));return favorites.value.map(id=>lookup.get(id)).filter((x):x is Track=>!!x)}
 function recentTracks(tracks:Track[]){const lookup=new Map(tracks.map(t=>[t.id,t]));return recent.value.map(id=>lookup.get(id)).filter((x):x is Track=>!!x)}
 function createPlaylist(name:string):string|null{
  const cleaned=name.trim().slice(0,80)
  if(!cleaned||playlists.value.length>=50)return null
  const id=crypto.randomUUID()
  playlists.value=[...playlists.value,{id,name:cleaned,trackIds:[],createdAt:new Date().toISOString()}]
  save();return id
 }
 function renamePlaylist(id:string,name:string){
  const cleaned=name.trim().slice(0,80)
  if(!cleaned)return
  playlists.value=playlists.value.map(x=>x.id===id?{...x,name:cleaned}:x)
  save()
 }
 function deletePlaylist(id:string){playlists.value=playlists.value.filter(x=>x.id!==id);save()}
 function addToPlaylist(id:string,trackId:string){
  playlists.value=playlists.value.map(x=>x.id===id&&!x.trackIds.includes(trackId)&&x.trackIds.length<200?{...x,trackIds:[...x.trackIds,trackId]}:x)
  save()
 }
 function removeFromPlaylist(id:string,trackId:string){
  playlists.value=playlists.value.map(x=>x.id===id?{...x,trackIds:x.trackIds.filter(t=>t!==trackId)}:x)
  save()
 }
 return {favorites,recent,playlists,hydrated,hydrate,isFavorite,toggleFavorite,remember,favoriteTracks,recentTracks,
  createPlaylist,renamePlaylist,deletePlaylist,addToPlaylist,removeFromPlaylist}
}
