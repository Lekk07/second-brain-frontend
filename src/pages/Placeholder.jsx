import { Construction } from 'lucide-react'

export default function Placeholder({ title }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <Construction size={40} className="text-accent/40 mb-4 animate-float" />
      <h1 className="font-display font-bold text-xl text-ink-primary mb-2">{title}</h1>
      <p className="text-ink-muted text-sm font-mono">Coming in the next step</p>
    </div>
  )
}
