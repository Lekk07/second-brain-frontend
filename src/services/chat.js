import api from './api'

export const chatService = {
  send: (message, history) => api.post('/chat', { message, history }),
}
