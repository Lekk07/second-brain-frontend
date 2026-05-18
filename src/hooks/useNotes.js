import { useState, useEffect, useCallback } from 'react'
import { notesService } from '../services/notes'

export function useNotes() {
  const [notes, setNotes]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchNotes = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const res = await notesService.getAll(params)
      setNotes(res.data.data)
      setError(null)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const createNote = async (data) => {
    const res = await notesService.create(data)
    setNotes(prev => [res.data.data, ...prev])
    return res.data.data
  }

  const updateNote = async (id, data) => {
    const res = await notesService.update(id, data)
    setNotes(prev => prev.map(n => n.id === id ? res.data.data : n))
    return res.data.data
  }

  const deleteNote = async (id) => {
    await notesService.delete(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const togglePin = async (id) => {
    const res = await notesService.togglePin(id)
    setNotes(prev => prev.map(n => n.id === id ? res.data.data : n))
  }

  return { notes, loading, error, fetchNotes, createNote, updateNote, deleteNote, togglePin }
}
