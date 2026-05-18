import api from './api'

export const aiService = {
  summarize:     (noteId) => api.post(`/ai/notes/${noteId}/summarize`),
  clearSummary:  (noteId) => api.delete(`/ai/notes/${noteId}/summarize`),
}
