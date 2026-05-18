import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network, Loader2, RefreshCw, ZoomIn, ZoomOut,
  Maximize2, Info, StickyNote, Tag, Link2
} from 'lucide-react'
import { graphService } from '../services/graph'

/* ─── D3 is loaded from CDN in index.html — window.d3 ─── */

const NODE_RADIUS = { note: 10, tag: 7 }
const NOTE_COLOR_DEFAULT = '#7c5cfc'

export default function GraphPage() {
  const svgRef    = useRef(null)
  const simRef    = useRef(null)
  const [graphData, setGraphData]   = useState(null)
  const [loading,   setLoading]     = useState(true)
  const [error,     setError]       = useState('')
  const [selected,  setSelected]    = useState(null)   // hovered/clicked node
  const [stats,     setStats]       = useState(null)
  const [zoom,      setZoom]        = useState(1)
  const zoomRef = useRef(null)

  const fetchGraph = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await graphService.getGraph()
      setGraphData(res.data.data)
      setStats(res.data.data.stats)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load graph')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGraph() }, [fetchGraph])

  // ── Draw D3 graph whenever data changes ───────────────────────────
  useEffect(() => {
    if (!graphData || !svgRef.current || typeof window.d3 === 'undefined') return
    const d3 = window.d3
    const { nodes: rawNodes, links: rawLinks } = graphData

    if (rawNodes.length === 0) return

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove()

    const W = svgRef.current.clientWidth  || 800
    const H = svgRef.current.clientHeight || 600

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H)

    // Defs — glow filter + arrowhead
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const merge = filter.append('feMerge')
    merge.append('feMergeNode').attr('in', 'coloredBlur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Root group (zoom target)
    const g = svg.append('g')

    // Zoom behaviour
    const zoomBehaviour = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (e) => {
        g.attr('transform', e.transform)
        setZoom(+e.transform.k.toFixed(2))
      })
    svg.call(zoomBehaviour)
    zoomRef.current = zoomBehaviour

    // Deep-copy nodes/links (D3 mutates them)
    const nodes = rawNodes.map(n => ({ ...n }))
    const links = rawLinks.map(l => ({ ...l }))

    // Force simulation
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => d.type === 'note_tag' ? 80 : 140)
        .strength(d => d.type === 'note_tag' ? 0.6 : 0.3)
      )
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(d => NODE_RADIUS[d.type] + 12))
    simRef.current = sim

    // Links
    const link = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', d => d.type === 'note_note' ? '#7c5cfc' : '#1e1e35')
      .attr('stroke-opacity', d => d.type === 'note_note' ? 0.5 : 0.3)
      .attr('stroke-width', d => d.type === 'note_note' ? Math.min(d.weight * 1.5, 4) : 1)
      .attr('stroke-dasharray', d => d.type === 'note_note' ? '4 2' : null)

    // Node groups
    const node = g.append('g').selectAll('g')
      .data(nodes).join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (e, d) => {
            if (!e.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end', (e, d) => {
            if (!e.active) sim.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )
      .on('click', (e, d) => { e.stopPropagation(); setSelected(d) })
      .on('mouseenter', (e, d) => {
        // Highlight connected links
        link.attr('stroke-opacity', l =>
          (l.source.id === d.id || l.target.id === d.id) ? 0.9 : 0.1
        )
      })
      .on('mouseleave', () => {
        link.attr('stroke-opacity', d => d.type === 'note_note' ? 0.5 : 0.3)
      })

    // Dismiss panel on svg click
    svg.on('click', () => setSelected(null))

    // Circles
    node.append('circle')
      .attr('r', d => NODE_RADIUS[d.type])
      .attr('fill', d => {
        if (d.type === 'tag') return 'rgba(124,92,252,0.15)'
        return d.color !== '#1e1e2e' ? d.color + '33' : 'rgba(124,92,252,0.15)'
      })
      .attr('stroke', d => {
        if (d.type === 'tag') return '#7c5cfc'
        return d.color !== '#1e1e2e' ? d.color : '#7c5cfc'
      })
      .attr('stroke-width', d => d.pinned ? 2.5 : 1.5)
      .attr('filter', d => d.pinned || d.type === 'tag' ? 'url(#glow)' : null)

    // AI summary dot
    node.filter(d => d.has_summary)
      .append('circle')
      .attr('r', 3)
      .attr('cx', 7).attr('cy', -7)
      .attr('fill', '#22d3ee')
      .attr('filter', 'url(#glow)')

    // Labels
    node.append('text')
      .text(d => d.label)
      .attr('x', d => NODE_RADIUS[d.type] + 5)
      .attr('y', 4)
      .attr('font-size', d => d.type === 'tag' ? '9px' : '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', d => d.type === 'tag' ? '#a78bfa' : '#8b8ba8')
      .attr('pointer-events', 'none')

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => sim.stop()
  }, [graphData])

  const handleZoomIn  = () => {
    if (!svgRef.current || !zoomRef.current) return
    window.d3?.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.4)
  }
  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return
    window.d3?.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.7)
  }
  const handleFit = () => {
    if (!svgRef.current || !zoomRef.current) return
    window.d3?.select(svgRef.current).transition()
      .call(zoomRef.current.transform, window.d3.zoomIdentity)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border glass z-10 shrink-0">
        <div>
          <p className="text-ink-muted text-xs font-mono mb-0.5">Tag · Semantic · Neural</p>
          <h1 className="font-display font-bold text-lg text-ink-primary flex items-center gap-2">
            <Network size={18} className="text-accent" />
            Knowledge Graph
          </h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="hidden sm:flex items-center gap-6">
            {[
              { icon: StickyNote, label: 'Notes', value: stats.note_count },
              { icon: Tag,        label: 'Tags',  value: stats.tag_count  },
              { icon: Link2,      label: 'Links', value: stats.link_count },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="flex items-center gap-1 justify-center text-accent mb-0.5">
                  <Icon size={12} />
                  <span className="font-display font-bold text-sm">{value}</span>
                </div>
                <p className="text-xs font-mono text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-ink-muted hidden sm:block">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn}  className="btn-ghost p-2 rounded-lg"><ZoomIn  size={14} /></button>
          <button onClick={handleZoomOut} className="btn-ghost p-2 rounded-lg"><ZoomOut size={14} /></button>
          <button onClick={handleFit}     className="btn-ghost p-2 rounded-lg"><Maximize2 size={14} /></button>
          <button onClick={fetchGraph}    className="btn-ghost p-2 rounded-lg"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="text-accent animate-spin" />
            <p className="text-ink-muted text-sm font-mono">Building graph…</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </div>
        ) : graphData?.nodes?.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <Network size={48} className="text-ink-muted mb-4 opacity-30 animate-float" />
            <p className="font-display font-medium text-ink-secondary mb-2">No notes to graph yet</p>
            <p className="text-ink-muted text-sm">Create some notes with tags and they'll appear here as a network</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ background: 'transparent' }}
          />
        )}

        {/* Legend */}
        {!loading && !error && graphData?.nodes?.length > 0 && (
          <div className="absolute bottom-4 left-4 glass rounded-xl p-3 text-xs font-mono space-y-2">
            <p className="text-ink-muted mb-2 flex items-center gap-1.5">
              <Info size={10} /> Legend
            </p>
            {[
              { color: 'bg-accent/40 border border-accent', label: 'Note node' },
              { color: 'bg-accent/10 border border-accent/50', label: 'Tag node' },
              { color: 'bg-cyan border-cyan', label: '· AI summary' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-ink-muted">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-6 border-t border-dashed border-accent/60" />
              <span className="text-ink-muted">Shared tags</span>
            </div>
          </div>
        )}

        {/* Selected node panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-64 glass rounded-xl p-4 border border-border shadow-card"
            >
              <div className="flex items-center gap-2 mb-3">
                {selected.type === 'tag'
                  ? <Tag size={14} className="text-accent" />
                  : <StickyNote size={14} className="text-accent" />
                }
                <span className="text-xs font-mono text-ink-muted uppercase">
                  {selected.type === 'tag' ? 'Tag' : 'Note'}
                </span>
              </div>
              <p className="font-display font-semibold text-ink-primary text-sm mb-2 leading-snug">
                {selected.label}
              </p>
              {selected.type === 'note' && selected.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map(t => (
                    <span key={t} className="tag-pill">{t}</span>
                  ))}
                </div>
              )}
              {selected.has_summary && (
                <p className="text-xs text-cyan font-mono mt-2 flex items-center gap-1">
                  ✦ Has AI summary
                </p>
              )}
              {selected.pinned && (
                <p className="text-xs text-accent font-mono mt-1">📌 Pinned</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
