export type ExternalStoreManualRating = {
  store_id: string
  avg_rating: number
  total_reviews: number
  source_note?: string
}

const externalStoreManualRatings: ExternalStoreManualRating[] = [
  {
    store_id: 'dkworks',
    avg_rating: 4.8,
    total_reviews: 1720,
    source_note: 'Historico legado DKWorks',
  },
  {
    store_id: 'vitrine-segura',
    avg_rating: 4.7,
    total_reviews: 595,
    source_note: 'Historico legado Vitrine Segura',
  },
  {
    store_id: 'ciceranails',
    avg_rating: 4.9,
    total_reviews: 240,
    source_note: 'Historico legado Cicera Nails',
  },
]

export default externalStoreManualRatings