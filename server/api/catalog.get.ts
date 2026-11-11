import { demoCatalog } from '../utils/demo'
export default defineEventHandler(async (event) => {
  // Los datos reales provendrán de D1 al vincular DB en Cloudflare.
  const db = event.context.cloudflare?.env?.DB
  if (!db) return demoCatalog
  try {
    const [artists, albums, tracks] = await Promise.all([
      db.prepare('SELECT id, name, slug, description, cover, accent FROM artists WHERE published = 1 ORDER BY name LIMIT 500').all(),
      db.prepare('SELECT id, title, slug, artist_id AS artistId, year, cover FROM albums WHERE published = 1 ORDER BY year DESC LIMIT 500').all(),
      db.prepare('SELECT id, title, slug, artist_id AS artistId, album_id AS albumId, duration, audio_url AS audioUrl, cover, plays FROM tracks WHERE published = 1 ORDER BY plays DESC LIMIT 500').all()
    ])
    return { artists: artists.results, albums: albums.results, tracks: tracks.results }
  } catch (error) {
    console.error('Error reading D1 music catalog', error)
    throw createError({ statusCode: 503, statusMessage: 'Catálogo temporalmente no disponible' })
  }
})
