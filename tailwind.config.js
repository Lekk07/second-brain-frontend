/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core dark surfaces
        void:    '#080810',
        surface: '#0f0f1a',
        panel:   '#13131f',
        card:    '#16162a',
        border:  '#1e1e35',
        // Accent — electric violet
        accent:  { DEFAULT: '#7c5cfc', dim: '#4a35a8', glow: '#a78bfa' },
        // Secondary accent — cyan
        cyan:    { DEFAULT: '#22d3ee', dim: '#0891b2' },
        // Text
        ink:     { primary: '#e8e8f0', secondary: '#8b8ba8', muted: '#44445a' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow:   '0 0 20px rgba(124,92,252,0.25)',
        'glow-sm': '0 0 10px rgba(124,92,252,0.15)',
        card:   '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(124,92,252,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(124,92,252,0.03) 1px, transparent 1px)`,
        'gradient-card': 'linear-gradient(135deg, #16162a 0%, #0f0f1a 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}
