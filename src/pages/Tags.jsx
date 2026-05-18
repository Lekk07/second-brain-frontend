import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, StickyNote, Search, Loader2, Hash, TrendingUp } from 'lucide-react'
import { notesService } from '../services/notes'
import NoteCard from '../components/notes/NoteCard'
import NoteEditor from '../components/notes/NoteEditor'
import { useNotes } from '../hooks/useNotes'

export default function TagsPage() {
  const [tags,        setTags]        = useState([])   // [{name, count}]
  const [selected,    setSelected]    = useState(null) // currently active tag
  const [tagNotes,    setTagNotes]    = useState([])   // notes for selected tag
  const [loadingTags, setLoadingTags] = useState(true)
  const [loadingNotes,setLoadingNotes]= useState(false)
  const [search,      setSearch]      = useState('')
  const [editingNote, setEditing]     = useState(null)
  const { updateNote, deleteNote, togglePin } = useNotes()

  // Load all tags + their counts on mount
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true)
      try {
        // Get all notes to compute counts
        const res = await notesService.getAll()
        const notes = res.data.data

        const countMap = {}
        notes.forEach(note => {
          (note.tags || []).forEach(tag => {
            countMap[tag] = (countMap[tag] || 0) + 1
          })
        })

        const sorted = Object.entries(countMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)  // most-used first

        setTags(sorted)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingTags(false)
      }
    }
    fetchTags()
  }, [])

  // Load notes for a selected tag
  const handleSelectTag = async (tagName) => {
    if (selected === tagName) { setSelected(null); setTagNotes([]); return }
    setSelected(tagName)
    setLoadingNotes(true)
    try {
      const res = await notesService.getAll({ tag: tagName })
      setTagNotes(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleSaveEdit = async (data) => {
    if (editingNote?.id) await updateNote(editingNote.id, data)
  }

  const handleDelete = async (id) => {
    await deleteNote(id)
    setTagNotes(prev => prev.filter(n => n.id !== id))
  }

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const maxCount = tags[0]?.count || 1

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-ink-muted text-xs font-mono mb-1">Organize · Browse · Filter</p>
        <h1 className="font-display font-bold text-2xl text-ink-primary flex items-center gap-2">
          <Hash size={22} className="text-accent" />
          Tags
        </h1>
      </motion.div>

      {/* Stats row */}
      {!loadingTags && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-6 mb-6"
        >
          {[
            { label: 'Unique tags',  value: tags.length },
            { label: 'Most used',    value: tags[0]?.name ? `#${tags[0].name}` : '—' },
            { label: 'Top count',    value: tags[0]?.count ?? 0 },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display font-bold text-lg text-accent">{s.value}</p>
              <p className="text-xs text-ink-muted font-mono">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Search tags */}
      <div className="relative max-w-sm mb-6">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter tags..."
          className="input-field pl-9 text-sm"
        />
      </div>

      {loadingTags ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={22} className="text-accent animate-spin" />
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-20">
          <Tag size={40} className="text-ink-muted mx-auto mb-4 opacity-30 animate-float" />
          <p className="font-display text-ink-secondary mb-1">No tags yet</p>
          <p className="text-ink-muted text-sm">Add tags to your notes and they'll appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — tag list */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp size={11} /> Sorted by usage
            </p>
            <AnimatePresence>
              {filteredTags.map((tag, i) => {
                const isActive  = selected === tag.name
                const barWidth  = Math.max((tag.count / maxCount) * 100, 8)

                return (
                  <motion.button
                    key={tag.name}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleSelectTag(tag.name)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 group
                      ${isActive
                        ? 'bg-accent/15 border-accent/35 shadow-glow-sm'
                        : 'glass-hover border-border'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Hash size={12} className={isActive ? 'text-accent' : 'text-ink-muted'} />
                        <span className={`font-mono text-sm font-medium ${isActive ? 'text-accent' : 'text-ink-primary'}`}>
                          {tag.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StickyNote size={10} className="text-ink-muted" />
                        <span className="text-xs font-mono text-ink-muted">{tag.count}</span>
                      </div>
                    </div>
                    {/* Usage bar */}
                    <div className="h-0.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isActive ? 'bg-accent' : 'bg-ink-muted/40'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                      />
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Right — notes for selected tag */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 text-center"
                >
                  <Tag size={36} className="text-ink-muted mb-3 opacity-30 animate-float" />
                  <p className="font-display text-ink-secondary mb-1">Select a tag</p>
                  <p className="text-ink-muted text-sm">Click any tag to browse its notes</p>
                </motion.div>
              ) : loadingNotes ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-40"
                >
                  <Loader2 size={20} className="text-accent animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Hash size={14} className="text-accent" />
                    <span className="font-display font-semibold text-ink-primary">{selected}</span>
                    <span className="text-xs font-mono text-ink-muted">
                      · {tagNotes.length} note{tagNotes.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {tagNotes.length === 0 ? (
                    <p className="text-ink-muted text-sm font-mono">No notes found for this tag.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <AnimatePresence>
                        {tagNotes.map(note => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={setEditing}
                            onDelete={handleDelete}
                            onTogglePin={togglePin}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingNote && (
        <NoteEditor
          note={editingNote}
          onSave={handleSaveEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
