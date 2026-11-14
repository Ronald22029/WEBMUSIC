import { copyFile, mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import seed from '../data/catalog.json'
import type { Artist, Album, Catalog, Track } from '../../types/music'
import type { ImportTrack } from './csv-music'

export type LocalTrack = Track & { published?: number }
export type LocalCatalog = { artists: Artist[]; albums: Album[]; tracks: LocalTrack[] }
const dataDir = process.env.WEBMUSIC_DATA_DIR ? resolve(process.env.WEBMUSIC_DATA_DIR) : resolve(process.cwd(), '.data', 'webmusic')
export const localCatalogPath = resolve(dataDir, 'catalog.local.json')
const backupPath = localCatalogPath + '.bak'
const initialCatalog = seed as Catalog

// Excluye la prueba de video de Génesis Campos del catálogo local, incluso si
// una copia de esa entrada se guardó antes en .data/. No toca ninguna otra
// canción ni un enlace que el usuario haya reemplazado posteriormente.
function withoutRemovedVideoExperiment(data: LocalCatalog): LocalCatalog {
  const trackId = 't-genesis-campos-fluye-en-mi-medley-001-fluye-en-mi'
  const albumId = 'alb-genesis-campos-fluye-en-mi-medley'
  const artistId = 'a-genesis-campos'
  const legacyUrls = new Set([
    'https://dai.ly/xbvseii',
    'https://www.dailymotion.com/video/xbvseii'
  ])
  const oldCount = data.tracks.length
  data.tracks = data.tracks.filter(t =>
    !(t.id === trackId && legacyUrls.has(t.audioUrl))
  )
  if (data.tracks.length !== oldCount) {
    if (!data.tracks.some(t => t.albumId === albumId)) {
      data.albums = data.albums.filter(a => a.id !== albumId)
    }
    if (!data.albums.some(a => a.artistId === artistId)) {
      data.artists = data.artists.filter(a => a.id !== artistId)
    }
  }
  return data
}

function verifyCatalog(value: unknown): asserts value is LocalCatalog {
  if (!value || typeof value !== 'object') throw new Error('Catálogo local inválido: no es un objeto')
  const data = value as Record<string, unknown>
  if (!Array.isArray(data.artists) || !Array.isArray(data.albums) || !Array.isArray(data.tracks)) {
    throw new Error('Catálogo local inválido: faltan artistas, álbumes o canciones')
  }
}
export async function readLocalCatalog(): Promise<LocalCatalog> {
  try {
    const content = await readFile(localCatalogPath, 'utf8')
    const parsed: unknown = JSON.parse(content)
    verifyCatalog(parsed)
    return withoutRemovedVideoExperiment(parsed)
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      // El catálogo inicial es de solo lectura; se crea copia privada al primer guardado.
      return structuredClone(initialCatalog)
    }
    // Jamás sustituir silenciosamente un archivo dañado por datos de demostración.
    throw error
  }
}
async function persistCatalog(catalog: LocalCatalog) {
  verifyCatalog(catalog)
  const dir = dirname(localCatalogPath)
  await mkdir(dir, { recursive: true })
  const temp = localCatalogPath + '.' + crypto.randomUUID() + '.tmp'
  try {
    await writeFile(temp, JSON.stringify(catalog, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' })
    try { await copyFile(localCatalogPath, backupPath) }
    catch (error: unknown) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    await rename(temp, localCatalogPath)
  } finally {
    await unlink(temp).catch(() => {})
  }
}
let mutationQueue: Promise<void> = Promise.resolve()
export function mutateLocalCatalog<T>(modify: (catalog: LocalCatalog) => T): Promise<T> {
  const task = mutationQueue.then(async () => {
    const catalog = await readLocalCatalog()
    const result = modify(catalog)
    await persistCatalog(catalog)
    return result
  })
  mutationQueue = task.then(() => {}, () => {})
  return task
}
export function publishedCatalog(catalog: LocalCatalog): Catalog {
  return {
    artists: catalog.artists,
    albums: catalog.albums,
    tracks: catalog.tracks.filter(track => track.published !== 0)
  }
}
export type ImportStats = { newArtists: number; newAlbums: number; newTracks: number; updatedTracks: number }
export function mergeCsvTracks(catalog: LocalCatalog, rows: ImportTrack[]): ImportStats {
  const artists = new Map(catalog.artists.map(x => [x.id, x]))
  const albums = new Map(catalog.albums.map(x => [x.id, x]))
  const tracks = new Map(catalog.tracks.map(x => [x.id, x]))
  const stats: ImportStats = { newArtists: 0, newAlbums: 0, newTracks: 0, updatedTracks: 0 }
  for (const r of rows) {
    const artist = artists.get(r.artistId)
    if (!artist) {
      artists.set(r.artistId, {
        id: r.artistId, name: r.artistName, slug: r.artistSlug,
        description: 'Discografía de ' + r.artistName, cover: r.cover, accent: '#a17aff'
      })
      stats.newArtists++
    } else if (!artist.cover && r.cover) artist.cover = r.cover
    const album = albums.get(r.albumId)
    if (!album) {
      albums.set(r.albumId, {
        id:r.albumId, title:r.albumTitle, slug:r.albumSlug, artistId:r.artistId,
        year:r.year, cover:r.cover, genre:r.genre, releaseType:r.releaseType
      })
      stats.newAlbums++
    } else if (!album.cover && r.cover) album.cover = r.cover
    const old = tracks.get(r.id)
    if (old) {
      // La importación mantiene favoritos e IDs; no vuelve a publicar canciones ocultas.
      old.audioUrl = r.audioUrl
      old.sourceStatus = 'unverified'
      old.sourcePage = r.sourcePage
      if (r.cover) old.cover = r.cover
      stats.updatedTracks++
    } else {
      tracks.set(r.id, {
        id:r.id, title:r.title, slug:r.slug, artistId:r.artistId, albumId:r.albumId,
        duration:0, audioUrl:r.audioUrl, cover:r.cover, plays:0, trackNumber:r.trackNumber,
        sourceStatus:'unverified', sourcePage:r.sourcePage, published:1
      })
      stats.newTracks++
    }
  }
  catalog.artists = [...artists.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'))
  catalog.albums = [...albums.values()].sort((a,b)=>b.year-a.year||a.title.localeCompare(b.title,'es'))
  catalog.tracks = [...tracks.values()].sort((a,b)=>a.albumId.localeCompare(b.albumId)||((a.trackNumber||0)-(b.trackNumber||0)))
  return stats
}
