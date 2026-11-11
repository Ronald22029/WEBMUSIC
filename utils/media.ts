import type { Track } from '~/types/music'

// Admitimos exclusivamente URL públicas del sitio oficial o sus enlaces cortos.
export function dailymotionVideoId(source: string): string | null {
  try {
    const url = new URL(source)
    if (url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase()
    const match = host === 'dai.ly'
      ? url.pathname.match(/^\/([a-z0-9]+)\/?$/i)
      : (host === 'dailymotion.com' || host === 'www.dailymotion.com')
        ? url.pathname.match(/^\/(?:video|embed\/video)\/([a-z0-9]+)(?:\/.*)?$/i)
        : null
    return match?.[1] || null
  } catch { return null }
}
export function isDailymotionTrack(track: Pick<Track, 'audioUrl'> | null | undefined): boolean {
  return !!track && !!dailymotionVideoId(track.audioUrl)
}
export function dailymotionEmbedUrl(source: string, playerId: string): string | null {
  const id = dailymotionVideoId(source)
  if (!id || !/^[a-z0-9]+$/i.test(playerId)) return null
  return 'https://geo.dailymotion.com/player/' + encodeURIComponent(playerId) + '.html?video=' + encodeURIComponent(id)
}
