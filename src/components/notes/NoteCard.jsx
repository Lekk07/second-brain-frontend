import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pin, Trash2, Edit3, Clock, Sparkles, Loader2, X } from 'lucide-react'
import { aiService } from '../../services/ai'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, onSummaryUpdate }) {
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary]         = useState(note.summary || null)
  const [showSummary, setShowSummary] = useState(!!note.summary)

  const handleSummarize = async (e) => {
    e.stopPropagation()
    setSummarizing(true)
    try {
      const res = await aiService.summarize(note.id)
      const s = res.data.data.summary
      setSummary(s)
      setShowSummary(true)
      onSummaryUpdate?.(note.id, s)
    } catch (err) {
      alert(err.response?.data?.error || 'Summary failed — check your OpenAI key in backend/.env')
    } finally {
      setSummarizing(false)
    }
  }

  const handleClearSummary = async (e) => {
    e.stopPropagation()
    await aiService.clearSummary(note.id)
    setSummary(null)
    setShowSummary(false)
    onSummaryUpdate?.(note.id, null)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="glass-hover rounded-xl p-4 cursor-pointer group relative border border-border"
      style={note.color !== '#1e1e2e' ? { borderLeftColor: note.color, borderLeftWidth: '2px' } : {}}
      onClick={() => onEdit(note)}
    >
      {note.is_pinned && (
        <div className="absolute top-3 right-3">
          <Pin size={11} className="text-accent fill-accent" />
        </div>
      )}

      <h3 className="font-display font-semibold text-ink-primary text-sm leading-snug pr-5 mb-2 line-clamp-2">
        {note.title}
      </h3>

      {showSummary && summary ? (
        <div className="mb-3 p-2.5 rounded-lg border border-accent/20 relative" style={{background:'rgba(124,92,252,0.06)'}} onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={10} className="text-accent" />
            <span className="text-xs font-mono text-accent/80">AI summary</span>
            <button onClick={handleClearSummary} className="ml-auto text-ink-muted hover:text-red-400 transition-colors">
              <X size={10} />
            </button>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">{summary}</p>
        </div>
      ) : (
        <p className="text-ink-secondary text-xs leading-relaxed line-clamp-3 mb-3 font-body">
          {note.content}
        </p>
      )}

      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-ink-muted font-mono">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-ink-muted">
          <Clock size={10} />
          <span className="text-xs font-mono">{timeAgo(note.updated_at)}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleSummarize} disabled={summarizing} title="AI summary"
            className="p-1.5 rounded-md text-ink-muted hover:text-accent transition-colors disabled:opacity-50">
            {summarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          </button>
          <button onClick={e => { e.stopPropagation(); onTogglePin(note.id) }}
            className={`p-1.5 rounded-md transition-colors ${note.is_pinned ? 'text-accent' : 'text-ink-muted hover:text-accent'}`}>
            <Pin size={12} />
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(note) }}
            className="p-1.5 rounded-md text-ink-muted hover:text-cyan transition-colors">
            <Edit3 size={12} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(note.id) }}
            className="p-1.5 rounded-md text-ink-muted hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
