import api from './api'

export const searchService = {
  search:  (query, limit = 8) => api.get('/search', { params: { q: query, limit } }),
  reindex: ()                  => api.post('/search/reindex'),
}
