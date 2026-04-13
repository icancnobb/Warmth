import { readFromStore, writeToStore } from '@/lib/storage'
import { DRAW_ARTWORKS_KEY, type Artwork } from './types'

export function readArtworks() {
  return readFromStore<Artwork[]>(DRAW_ARTWORKS_KEY, [])
}

export function writeArtworks(artworks: Artwork[]) {
  writeToStore(DRAW_ARTWORKS_KEY, artworks)
}
