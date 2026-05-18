import api from './api'

export const notesService = {
  getAll:    (params = {}) => api.get('/notes', { params }),
  getById:   (id)          => api.get(`/notes/${id}`),
  create:    (data)        => api.post('/notes', data),
  update:    (id, data)    => api.put(`/notes/${id}`, data),
  delete:    (id)          => api.delete(`/notes/${id}`),
  togglePin: (id)          => api.patch(`/notes/${id}/pin`),
  getTags:   ()            => api.get('/notes/tags'),
}
