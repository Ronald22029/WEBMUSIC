export default defineEventHandler(event => {
 setHeader(event,'content-type','text/plain; charset=utf-8')
 return 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin/\nDisallow: /biblioteca\nDisallow: /buscar\nSitemap: '+useRuntimeConfig(event).public.siteUrl+'/sitemap.xml\n'
})
