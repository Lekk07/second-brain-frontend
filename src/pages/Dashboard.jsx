import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Pin, StickyNote, Loader2 } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import NoteCard from '../components/notes/NoteCard'
import NoteEditor from '../components/notes/NoteEditor'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const { notes, loading, error, createNote, updateNote, deleteNote, togglePin, fetchNotes } = useNotes()
  const [search, setSearch]       = useState('')
  const [editingNote, setEditing] = useState(null)  // null = closed, {} = new, note = edit
  const [filterTag, setFilterTag] = useState(null)

  // Filter locally for instant response
  const filtered = notes.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
    const matchTag    = !filterTag || n.tags?.includes(filterTag)
    return matchSearch && matchTag
  })

  const pinned   = filtered.filter(n => n.is_pinned)
  const unpinned = filtered.filter(n => !n.is_pinned)

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))].sort()

  const handleSave = async (data) => {
    if (editingNote?.id) {
      await updateNote(editingNote.id, data)
    } else {
      await createNote(data)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-ink-muted text-sm font-mono mb-1">{greeting()},</p>
          <h1 className="font-display font-bold text-2xl text-ink-primary">
            {user?.username} <span className="text-accent">✦</span>
          </h1>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-6 mt-4"
        >
          {[
            { label: 'Notes',  value: notes.length },
            { label: 'Pinned', value: pinned.length },
            { label: 'Tags',   value: allTags.length },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display font-bold text-lg text-accent">{stat.value}</p>
              <p className="text-xs text-ink-muted font-mono">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Search + New Note */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <button onClick={() => setEditing({})} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
          <Plus size={14} />
          New note
        </button>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterTag(null)}
            className={`text-xs font-mono px-3 py-1 rounded-full border transition-all ${
              !filterTag ? 'bg-accent/20 text-accent border-accent/40' : 'text-ink-muted border-border hover:border-ink-secondary'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag === filterTag ? null : tag)}
              className={`text-xs font-mono px-3 py-1 rounded-full border transition-all ${
                filterTag === tag ? 'bg-accent/20 text-accent border-accent/40' : 'text-ink-muted border-border hover:border-ink-secondary'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-400/10 border border-red-400/20 rounded-lg text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="text-accent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 text-center"
        >
          <StickyNote size={40} className="text-ink-muted mb-4 animate-float" />
          <p className="font-display font-medium text-ink-secondary mb-2">
            {search ? 'No notes match your search' : 'No notes yet'}
          </p>
          <p className="text-ink-muted text-sm mb-4">
            {search ? 'Try a different search term' : 'Create your first note to get started'}
          </p>
          {!search && (
            <button onClick={() => setEditing({})} className="btn-primary text-sm flex items-center gap-2">
              <Plus size={14} /> Create note
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Pinned */}
          {pinned.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Pin size={12} className="text-accent fill-accent" />
                <span className="text-xs font-mono text-ink-muted uppercase tracking-wider">Pinned</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <AnimatePresence>
                  {pinned.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={setEditing}
                      onDelete={deleteNote}
                      onTogglePin={togglePin}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* All notes */}
          {unpinned.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono text-ink-muted uppercase tracking-wider">All notes</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <AnimatePresence>
                  {unpinned.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={setEditing}
                      onDelete={deleteNote}
                      onTogglePin={togglePin}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Editor modal */}
      {editingNote !== null && (
        <NoteEditor
          note={editingNote?.id ? editingNote : null}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
