import api from './api'
export const graphService = {
  getGraph: () => api.get('/graph'),
}
