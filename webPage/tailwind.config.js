

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        oldStandard: ['"Old Standard TT"', 'serif'], 
        unica: ['"Unica One"', 'sans-serif'],
        saira: ['"Saira Stencil One"', 'sans-serif'],
        orbitron: ['"Orbitron"', 'sans-serif'],
        poiret: ['"Poiret One"', 'sans-serif'],
        fascinate: ['"Fascinate Inline"', 'cursive'],
        fredoka: ['"Fredoka One"', 'sans-serif'],
        ralewayDots: ['"Raleway Dots"', 'sans-serif'],
        
      },
      dropShadow: {
        'glow-black': '0 0 10px #000000, 0 0 30px #000000, 0 0 60px #000000', // Enhanced black glow
      },
      animation: {
        'bounce': 'bounce 1s infinite',
        'smooth-bounce': 'smooth-bounce 0.9s cubic-bezier(0.25, 1, 0.5, 1) infinite',
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        'smooth-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        }
      },
      scaleIn: {
        "0%": { transform: "scale(0.9)", opacity: 0 },
        "100%": { transform: "scale(1)", opacity: 1 },
      },
    },
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};

