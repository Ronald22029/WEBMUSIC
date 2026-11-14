import type {Ref} from 'vue'
import type { TrackPage } from '~/types/music'
// Consultas paginadas para no transmitir decenas de miles de canciones al navegador.
export function useTracks(query:Record<string,any>|Ref<Record<string,any>>){
 return useFetch<TrackPage>('/api/tracks',{query,default:()=>({rows:[],total:0,offset:0,limit:30})})
}
