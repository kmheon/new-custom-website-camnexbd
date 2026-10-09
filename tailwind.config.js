/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      colors: {
        canvas: '#FAF7F2',
        'surface-dark': '#0F172A',
        'surface-soft': '#F4EEE6',
        'border-subtle': '#EDE8E1',
        graphite: '#111827',
        'muted-text': '#5B6472',
        brand: {
          navy: '#0F172A',
          orange: '#F15A24',
          orangeHover: '#D94D1C',
          gray: '#F5F7FA'
        }
      },
      borderRadius: {
        'panel': '28px',
        'panel-sm': '20px',
        'card': '20px'
      }
    }
  },
  plugins: []
};

