import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Hash } from 'lucide-react'

const COLORS = [
  { value: '#1e1e2e', label: 'Default' },
  { value: '#2d1b69', label: 'Purple'  },
  { value: '#1a2d4a', label: 'Blue'    },
  { value: '#1a3a2a', label: 'Green'   },
  { value: '#3a1a1a', label: 'Red'     },
]

export default function NoteEditor({ note, onSave, onClose }) {
  const [title,   setTitle]   = useState(note?.title   || '')
  const [content, setContent] = useState(note?.content || '')
  const [tagInput, setTagInput] = useState('')
  const [tags,    setTags]    = useState(note?.tags    || [])
  const [color,   setColor]   = useState(note?.color   || '#1e1e2e')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    // Focus title on open
    document.getElementById('note-title-input')?.focus()
  }, [])

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag))

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return setError('Title is required')
    if (!content.trim()) return setError('Content is required')
    setSaving(true)
    setError('')
    try {
      await onSave({ title: title.trim(), content: content.trim(), tags, color })
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save note')
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          className="w-full max-w-2xl glass rounded-2xl border border-border shadow-card"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-ink-primary">
              {note ? 'Edit note' : 'New note'}
            </h2>
            <button onClick={onClose} className="text-ink-muted hover:text-ink-primary transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {error && (
              <p className="text-red-400 text-xs font-mono bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
                {error}
              </p>
            )}

            <input
              id="note-title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note title..."
              className="input-field font-display font-medium text-base"
              onKeyDown={e => e.key === 'Enter' && document.getElementById('note-content')?.focus()}
            />

            <textarea
              id="note-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              rows={8}
              className="input-field font-body resize-none leading-relaxed"
            />

            {/* Tags */}
            <div>
              <div className="flex flex-wrap items-center gap-2 p-3 bg-panel border border-border rounded-lg min-h-[44px]">
                <Hash size={14} className="text-ink-muted shrink-0" />
                {tags.map(tag => (
                  <span key={tag} className="tag-pill flex items-center gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400 ml-1">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                  placeholder={tags.length === 0 ? 'Add tags...' : ''}
                  className="bg-transparent outline-none text-xs font-mono text-ink-primary placeholder-ink-muted flex-1 min-w-[80px]"
                />
              </div>
              <p className="text-xs text-ink-muted mt-1 ml-1">Press Enter or comma to add a tag</p>
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-muted font-mono">Card color</span>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    title={c.label}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      color === c.value ? 'border-accent scale-110' : 'border-border hover:border-ink-secondary'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              {note ? 'Save changes' : 'Create note'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
