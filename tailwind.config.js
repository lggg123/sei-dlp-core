const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./src/app/globals.css",
  ],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      backdropBlur: { xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '12px', '2xl': '16px', '3xl': '24px' },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius)-2px)', sm: 'calc(var(--radius)-4px)' },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'holo-glow': { '0%': { filter: 'hue-rotate(0deg) brightness(1)' }, '100%': { filter: 'hue-rotate(360deg) brightness(1.2)' } },
        'stream-flow': { '0%': { transform: 'translateY(-100px)', opacity: '0' }, '50%': { opacity: '1' }, '100%': { transform: 'translateY(100px)', opacity: '0' } },
        'gradient-shift': { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'holo-glow': 'holo-glow 3s ease-in-out infinite alternate',
        'stream-flow': 'stream-flow 2s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      colors: {
        border:       'hsl(var(--border))',
        input:        'hsl(var(--input))',
        ring:         'hsl(var(--ring))',
        background:   'hsl(var(--background))',
        foreground:   'hsl(var(--foreground))',
        card:         { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        primary:      { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))', glow: 'hsl(var(--primary-glow))' },
        secondary:    { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        accent:       { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        muted:        { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        popover:      { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        destructive:  { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(function({ addComponents, theme }) {
      addComponents({
        // Glass card
        '.glass-card': {
          backdropFilter:         'blur(24px)',
          WebkitBackdropFilter:   'blur(24px)',
          border:                 `1px solid ${theme('colors.border')}`,
          backgroundColor:        'hsl(var(--card) / 0.8)',
          borderRadius:           theme('borderRadius.lg'),
          boxShadow:              '0 8px 32px hsl(var(--primary) / 0.1), inset 0 1px 0 hsl(var(--border) / 0.3)',
        },
        // Cyber button
        '.btn-cyber': {
          position:               'relative',
          overflow:               'hidden',
          padding:                `${theme('spacing.4')} ${theme('spacing.8')}`,
          borderRadius:           theme('borderRadius.md'),
          fontWeight:             theme('fontWeight.semibold'),
          transition:             `all ${theme('transitionDuration.300')} ease-in-out`,
          fontSize:               theme('fontSize.base')[0],
          background:             'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
          color:                  'hsl(var(--primary-foreground))',
          boxShadow:              '0 0 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.1)',
          '&:hover': {
            transform:            'scale(1.05)',
            boxShadow:            '0 0 30px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.2)',
          },
        },
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        // Vault card
        '.vault-card': {
          padding:                theme('spacing.6'),
          borderRadius:           theme('borderRadius.lg'),
          transition:             `all ${theme('transitionDuration.500')} ease-in-out`,
          background:             'linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted)), hsl(var(--card)))',
        'gradient-shift': 'gradient-shift 4s ease-in-out infinite',
          '&:hover': {
            transform:            'scale(1.05)',
            boxShadow:            '0 20px 60px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(var(--border) / 0.5)',
          },
        },
        // Data stream
        '.data-stream': {
          position:               'absolute',
          width:                  '1px',
          background:             'linear-gradient(to bottom, transparent 0%, hsl(var(--primary)) 50%, transparent 100%)',
          height:                 '100px',
          animation:              theme('animation.stream-flow'),
        },
        // Neural grid
        '.neural-grid': {
          backgroundImage:        'linear-gradient(hsl(var(--border) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.1) 1px, transparent 1px)',
          backgroundSize:         '50px 50px',
        },
        // Holo text
        '.holo-text': {
          fontWeight:             theme('fontWeight.extrabold') + ' !important',
          background:             'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent))) !important',
          backgroundSize:         '300% 100% !important',
          backgroundClip:         'text !important',
          WebkitBackgroundClip:   'text !important',
          color:                  'transparent !important',
          animation:              theme('animation.holo-glow') + ' !important',
          filter:                 'drop-shadow(0 0 8px hsl(var(--primary-glow))) !important',
        },
        'h2.holo-text, h1.holo-text, h3.holo-text': {
          fontWeight:             theme('fontWeight.extrabold') + ' !important',
          background:             'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent))) !important',
          backgroundSize:         '300% 100% !important',
          backgroundClip:         'text !important',
          WebkitBackgroundClip:   'text !important',
          color:                  'transparent !important',
          animation:              'holo-glow 3s ease-in-out infinite alternate !important',
          filter:                 'drop-shadow(0 0 8px hsl(var(--primary-glow))) !important',
        },
        // Primary glow text
        '.text-primary-glow': {
          color:                  'hsl(var(--primary-glow))',
          textShadow:             '0 0 8px hsl(var(--primary-glow)), 0 0 24px hsl(var(--primary-glow))',
          fontWeight:             theme('fontWeight.bold'),
        },
        // Hero section
        '.hero-section': {
          minHeight:              '100vh',
          display:                'flex',
          alignItems:             'center',
          justifyContent:         'center',
          background:             'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(var(--secondary) / 0.1) 0%, transparent 50%)',
        },
        '.hero-content': {
          textAlign:              'center',
          maxWidth:               theme('maxWidth.4xl'),
          marginLeft:             'auto',
          marginRight:            'auto',
          padding:                theme('spacing.4'),
        },
        '.hero-title': {
          fontSize:               theme('fontSize.5xl')[0],
          '@screen md': { fontSize: theme('fontSize.6xl')[0] },
          '@screen lg': { fontSize: theme('fontSize.7xl')[0] },
          fontWeight:             theme('fontWeight.bold'),
          marginBottom:           theme('spacing.6'),
          lineHeight:             theme('lineHeight.tight'),
        },
        '.hero-subtitle': {
          fontSize:               theme('fontSize.xl')[0],
          '@screen md': { fontSize: theme('fontSize.2xl')[0] },
          color:                  theme('colors.muted.foreground'),
          marginBottom:           theme('spacing.8'),
          maxWidth:               theme('maxWidth.2xl'),
          marginLeft:             'auto',
          marginRight:            'auto',
        },
        // Gradient animation utility
        '.animate-gradient': {
          backgroundSize:         '200% 200%',
          animation:              theme('animation.gradient-shift'),
        },
      })
    })
  ],
}