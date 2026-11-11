import {demoCatalog} from '../utils/demo'
const escapeXml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')
export default defineEventHandler(async(event)=>{
 setHeader(event,'content-type','application/xml; charset=utf-8')
 const origin=String(useRuntimeConfig(event).public.siteUrl).replace(/\/$/,'')
 const urls=['/','/explorar','/artistas','/albumes',...demoCatalog.artists.map(a=>'/artista/'+a.slug),...demoCatalog.albums.map(a=>'/album/'+a.slug)]
 return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+escapeXml(origin+u)+'</loc></url>').join('')+'</urlset>'
})
