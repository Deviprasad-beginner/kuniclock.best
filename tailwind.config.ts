import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        solid: 'var(--bg-solid)',
        'glass-nav': 'var(--bg-glass-nav)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        green: {
          DEFAULT: 'var(--accent-green)',
          dim: 'var(--accent-green-dim)',
        },
        red: {
          DEFAULT: 'var(--accent-red)',
          dim: 'var(--accent-red-dim)',
        },
        blue: {
          DEFAULT: 'var(--accent-blue)',
        },
        purple: {
          DEFAULT: 'var(--accent-purple)',
        },
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        'lg': 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
