import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Send, Sparkles, Loader2,
  Trash2, StickyNote, User, Brain, AlertCircle
} from 'lucide-react'
import { chatService } from '../services/chat'

// ── Suggested starter questions ───────────────────────────────────────
const SUGGESTIONS = [
  "What are my key ideas about AI?",
  "Summarize my recent notes",
  "What topics do I write about most?",
  "What have I learned about programming?",
  "Find connections between my notes",
]

// ── A single chat bubble ──────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 px-4"
      >
        <div className="w-7 h-7 rounded-full bg-red-400/20 border border-red-400/30 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle size={14} className="text-red-400" />
        </div>
        <div className="flex-1 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm font-mono">{msg.content}</p>
          {msg.hint && (
            <p className="text-red-300/60 text-xs mt-1 font-mono">{msg.hint}</p>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 px-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border
        ${isUser
          ? 'bg-accent/20 border-accent/40'
          : 'bg-cyan/10 border-cyan/30'
        }`}
      >
        {isUser
          ? <User size={13} className="text-accent" />
          : <Brain size={13} className="text-cyan" />
        }
      </div>

      <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Bubble */}
        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-accent/15 border border-accent/25 text-ink-primary ml-auto'
            : 'glass border border-border text-ink-primary'
          }`}
        >
          {msg.content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < msg.content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>

        {/* Source notes pills */}
        {!isUser && msg.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-xs font-mono text-ink-muted">Sources:</span>
            {msg.sources.map(s => s.id && (
              <span
                key={s.id}
                className="flex items-center gap-1 text-xs font-mono px-2 py-0.5
                           rounded-full bg-accent/8 border border-accent/20 text-accent/80"
              >
                <StickyNote size={9} />
                {s.title?.slice(0, 24)}{s.title?.length > 24 ? '…' : ''}
                {s.score && <span className="text-accent/50 ml-0.5">{s.score}%</span>}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {msg.time && (
          <span className="text-xs font-mono text-ink-muted px-1">
            {msg.time}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 px-4"
    >
      <div className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center shrink-0">
        <Brain size={13} className="text-cyan" />
      </div>
      <div className="glass border border-border rounded-xl px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyan/60"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Second Brain assistant. Ask me anything about your notes — I'll search them and answer based on what you've written.",
      sources: [],
      time: now(),
    }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')

    // Add user message immediately
    const userMsg = { role: 'user', content: msg, time: now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Build history for the API (exclude the greeting and errors)
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await chatService.send(msg, history)
      const { reply, sources } = res.data.data
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        sources,
        time: now(),
      }])
    } catch (e) {
      const errMsg = e.response?.data?.error || 'Something went wrong'
      const needsKey = errMsg.includes('OPENAI_API_KEY') || errMsg.includes('API key')
      setMessages(prev => [...prev, {
        role: 'error',
        content: errMsg,
        hint: needsKey ? 'Add OPENAI_API_KEY to backend/.env then restart Flask' : null,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. What would you like to explore in your notes?",
      sources: [],
      time: now(),
    }])
  }

  const hasOnlyGreeting = messages.length === 1

  return (
    <div className="h-screen flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border glass shrink-0 z-10">
        <div>
          <p className="text-ink-muted text-xs font-mono mb-0.5">RAG · GPT-4o-mini · Your notes</p>
          <h1 className="font-display font-bold text-lg text-ink-primary flex items-center gap-2">
            <MessageSquare size={18} className="text-accent" />
            AI Chat
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan/25 bg-cyan/8">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            <span className="text-xs font-mono text-cyan/80">Live</span>
          </div>
          <button
            onClick={clearChat}
            className="btn-ghost p-2 rounded-lg text-ink-muted hover:text-red-400"
            title="Clear chat"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}
        </AnimatePresence>

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — only shown before first user message */}
      {hasOnlyGreeting && (
        <div className="px-4 pb-3">
          <p className="text-xs font-mono text-ink-muted mb-2 px-1">Try asking…</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs font-mono px-3 py-1.5 rounded-full border border-border
                           text-ink-secondary hover:border-accent/40 hover:text-accent
                           hover:bg-accent/5 transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
        <div className="flex items-end gap-3 glass rounded-xl border border-border p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your notes…"
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent outline-none text-sm text-ink-primary
                       placeholder-ink-muted font-body resize-none px-2 py-1.5
                       leading-relaxed disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '36px' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-accent-glow transition-all duration-200 shrink-0"
            style={{ boxShadow: input.trim() ? '0 0 16px rgba(124,92,252,0.4)' : 'none' }}
          >
            {loading
              ? <Loader2 size={15} className="text-white animate-spin" />
              : <Send size={15} className="text-white" />
            }
          </button>
        </div>
        <p className="text-center text-xs font-mono text-ink-muted mt-2">
          Enter to send · Shift+Enter for new line · Answers grounded in your notes
        </p>
      </div>
    </div>
  )
}
