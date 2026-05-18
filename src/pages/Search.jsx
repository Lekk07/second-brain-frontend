import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Sparkles, Loader2, Clock, Tag,
  Pin, RefreshCw, AlertCircle, ArrowRight
} from 'lucide-react'
import { searchService } from '../services/search'
import NoteEditor from '../components/notes/NoteEditor'
import { useNotes } from '../hooks/useNotes'

function ScoreBadge({ score }) {
  const color =
    score >= 80 ? 'text-green-400 border-green-400/30 bg-green-400/10' :
    score >= 60 ? 'text-accent border-accent/30 bg-accent/10' :
                  'text-ink-muted border-border bg-panel'
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${color}`}>
      {score}% match
    </span>
  )
}

function ResultCard({ note, onEdit }) {
  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-hover rounded-xl p-5 cursor-pointer group border border-border"
      style={note.color !== '#1e1e2e' ? { borderLeftColor: note.color, borderLeftWidth: '2px' } : {}}
      onClick={() => onEdit(note)}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display font-semibold text-ink-primary text-sm">
            {note.title}
          </h3>
          {note.is_pinned && <Pin size={10} className="text-accent fill-accent" />}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge score={note.score} />
          <ArrowRight size={14} className="text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* AI Summary or content preview */}
      {note.summary ? (
        <div className="mb-3 p-2.5 rounded-lg border border-accent/20 bg-accent/5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={10} className="text-accent" />
            <span className="text-xs font-mono text-accent/70">AI summary</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">{note.summary}</p>
        </div>
      ) : (
        <p className="text-ink-secondary text-xs leading-relaxed line-clamp-2 mb-3">
          {note.content}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4">
        {note.tags?.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag size={10} className="text-ink-muted" />
            <div className="flex gap-1 flex-wrap">
              {note.tags.slice(0, 4).map(t => (
                <span key={t} className="tag-pill">{t}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 text-ink-muted ml-auto">
          <Clock size={10} />
          <span className="text-xs font-mono">{timeAgo(note.updated_at)}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function SearchPage() {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [searched,  setSearched]  = useState(false)
  const [error,     setError]     = useState('')
  const [reindexing, setReindexing] = useState(false)
  const [editingNote, setEditing] = useState(null)
  const { updateNote }            = useNotes()
  const debounceRef               = useRef(null)

  const doSearch = async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setError('')
    try {
      const res = await searchService.search(q)
      setResults(res.data.data.results)
      setSearched(true)
    } catch (e) {
      const msg = e.response?.data?.error || 'Search failed'
      setError(msg)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (e) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q), 400)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceRef.current)
      doSearch(query)
    }
  }

  const handleReindex = async () => {
    setReindexing(true)
    try {
      const res = await searchService.reindex()
      alert(`✅ Indexed ${res.data.data.indexed} notes successfully`)
    } catch (e) {
      alert(e.response?.data?.error || 'Reindex failed')
    } finally {
      setReindexing(false)
    }
  }

  const handleSaveEdit = async (data) => {
    if (editingNote?.id) await updateNote(editingNote.id, data)
  }

  const isNotAvailable = error.includes('pip install')

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-ink-muted text-xs font-mono mb-1">Vector · Semantic · Neural</p>
            <h1 className="font-display font-bold text-2xl text-ink-primary">
              Semantic Search <span className="text-accent">✦</span>
            </h1>
          </div>
          {/* Reindex button */}
          <button
            onClick={handleReindex}
            disabled={reindexing}
            title="Re-index all notes into vector DB"
            className="btn-ghost text-xs flex items-center gap-1.5 border border-border rounded-lg px-3 py-2"
          >
            <RefreshCw size={12} className={reindexing ? 'animate-spin' : ''} />
            Reindex
          </button>
        </div>
        <p className="text-ink-muted text-sm">
          Search by meaning, not just keywords
        </p>
      </motion.div>

      {/* Search bar */}
      <div className="relative mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading
            ? <Loader2 size={16} className="text-accent animate-spin" />
            : <Search size={16} className="text-ink-muted" />
          }
        </div>
        <input
          autoFocus
          value={query}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder='Try "ideas about machine learning" or "meeting notes"...'
          className="input-field pl-11 pr-4 py-4 text-sm rounded-xl"
        />
        {query && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Sparkles size={14} className="text-accent animate-pulse-slow" />
          </div>
        )}
      </div>

      {/* Not available message */}
      {isNotAvailable && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/8 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-yellow-400 text-sm font-display font-medium mb-1">
                Semantic search not set up yet
              </p>
              <p className="text-ink-muted text-xs font-mono mb-2">
                Run this in your backend folder:
              </p>
              <code className="block bg-void border border-border rounded-lg px-3 py-2 text-xs font-mono text-cyan">
                pip install sentence-transformers chromadb
              </code>
              <p className="text-ink-muted text-xs mt-2">
                Then restart Flask and click <strong className="text-ink-secondary">Reindex</strong> above to index your existing notes.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Generic error */}
      {error && !isNotAvailable && (
        <div className="mb-6 p-3 bg-red-400/10 border border-red-400/20 rounded-lg text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {searched && !loading && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {results.length === 0 ? (
              <div className="text-center py-16">
                <Search size={36} className="text-ink-muted mx-auto mb-4 opacity-40" />
                <p className="font-display text-ink-secondary mb-1">No matches found</p>
                <p className="text-ink-muted text-sm">Try rephrasing your query or reindexing</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-mono text-ink-muted">
                    {results.length} result{results.length !== 1 ? 's' : ''} for
                  </span>
                  <span className="tag-pill">"{query}"</span>
                </div>
                <div className="space-y-3">
                  {results.map(note => (
                    <ResultCard key={note.id} note={note} onEdit={setEditing} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Empty state — before any search */}
        {!searched && !loading && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 animate-float">
              <Sparkles size={28} className="text-accent" />
            </div>
            <p className="font-display font-medium text-ink-secondary mb-2">
              Ask anything about your notes
            </p>
            <p className="text-ink-muted text-sm max-w-sm mx-auto">
              Semantic search understands meaning — search for concepts, ideas, or feelings, not just keywords.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
