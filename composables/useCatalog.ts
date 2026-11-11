import type { Catalog } from '~/types/music'
export const useCatalog = () => useFetch<Catalog>('/api/catalog', { key: 'music-catalog', default: () => ({ artists: [], albums: [], tracks: [] }) })
