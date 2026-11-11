import type { Artist, Album, Track } from '../../types/music'

// Ficha de prueba; NO se descarga audio ni video. Su reproducción depende del
// reproductor de Dailymotion, de los permisos de inserción y del navegador.
const cover = 'https://s2.dmcdn.net/v/gqyDw1gz9w9ipkX5W'
const artistId = 'a-genesis-campos'
const albumId = 'alb-genesis-campos-fluye-en-mi-medley'
export const dailymotionArtist: Artist = {
  id: artistId, name: 'Génesis Campos', slug: 'genesis-campos',
  description: 'Intérprete de música cristiana. Prueba de reproducción externa por Dailymotion.',
  cover, accent: '#9d7eea'
}
export const dailymotionAlbum: Album = {
  id: albumId, title: 'Fluye en Mí — Medley', slug: 'genesis-campos-fluye-en-mi-medley',
  artistId, year: 0, cover, genre: 'Música cristiana', releaseType: 'Video en vivo'
}
export const dailymotionTrack: Track = {
  id: 't-genesis-campos-fluye-en-mi-medley-001-fluye-en-mi',
  title: 'Fluye en Mí (Medley: Deléitate, Gran Rey, Fluye en Mí, Todos Reunidos)',
  slug: 'genesis-campos-fluye-en-mi-medley-001-fluye-en-mi',
  artistId, albumId, duration: 1063, audioUrl: 'https://dai.ly/xbvseii',
  cover, plays: 0, trackNumber: 1, mediaType: 'dailymotion',
  sourceStatus: 'unverified', sourcePage: 'https://www.dailymotion.com/video/xbvseii'
}
