export interface Artist{id:string;name:string;slug:string;description:string;cover:string;accent:string;genre?:string}
export interface Album{id:string;title:string;slug:string;artistId:string;year:number;cover:string;genre?:string;releaseType?:string}
export interface Track{id:string;title:string;slug:string;artistId:string;albumId:string;duration:number;audioUrl:string;cover:string;plays:number;trackNumber?:number;sourceStatus?:string;sourcePage?:string}
export interface Catalog{artists:Artist[];albums:Album[];tracks:Track[]}
