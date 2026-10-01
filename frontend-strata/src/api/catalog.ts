import api from './axios'

export interface CatalogTest {
  id: number
  slug: string
  name: string
  description: string
  duration_min: number
  item_count: number
}

export interface CatalogCategory {
  id: string
  label: string
  count: number
  tests: CatalogTest[]
}

export interface TestDetail extends CatalogTest {
  category: string
  category_label: string
}

export async function getCatalog(): Promise<CatalogCategory[]> {
  const { data } = await api.get('/api/catalog')
  return data.data
}

export async function getTest(slug: string): Promise<TestDetail> {
  const { data } = await api.get(`/api/catalog/${slug}`)
  return data.data
}
