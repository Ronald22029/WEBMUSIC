import type { Ref } from 'vue'
import type { TrackPage } from '~/types/music'

// Los IDs se transmiten por POST; las playlists grandes no se truncan.
export function useTrackIds(ids: Ref<string[]>, key: string){
 return useAsyncData<TrackPage>(key,async()=>{
  const unique=[...new Set(ids.value)].slice(0,250)
  if(!unique.length)return {rows:[],total:0,offset:0,limit:250}
  return await $fetch<TrackPage>('/api/tracks-by-ids',{method:'POST',body:{ids:unique}})
 },{watch:[ids],default:()=>({rows:[],total:0,offset:0,limit:250})})
}
