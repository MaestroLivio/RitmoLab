/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        montessori: {
          cream: '#FFFBEB',
          butter: '#FEF3C7',
          sun: '#FDE047',
          mint: '#D1FAE5',
          sage: '#A7F3D0',
          emerald: '#34D399',
          sky: '#E0F2FE',
          azure: '#7DD3FC',
          ocean: '#38BDF8',
          lavender: '#F3E8FF',
          lilac: '#D8B4FE',
          purple: '#A855F7',
          rose: '#FFE4E6',
          coral: '#FDA4AF',
          peach: '#FFEDD5',
          amber: '#FDBA74',
          slate: '#334155',
          dark: '#1E293B',
          card: '#FFFFFF',
        },
        bodyPart: {
          clap: '#38BDF8',    // Sky blue (Mani/Clap)
          chest: '#FB7185',   // Coral/Rose (Petto)
          thighs: '#FBBF24',  // Amber/Warm Yellow (Cosce)
          feet: '#34D399',    // Mint/Emerald (Piedi)
          snap: '#A855F7',    // Lilac/Purple (Dita)
        },
        orff: {
          claves: '#B45309',    // Wood
          tambourine: '#EC4899',// Pink tambourine
          triangle: '#EAB308',  // Golden triangle
          cymbals: '#06B6D4',   // Shimmering cyan
        },
        solfege: {
          do: '#EF4444', // Red
          re: '#F97316', // Orange
          mi: '#FBBF24', // Yellow
          fa: '#10B981', // Green
          sol: '#3B82F6', // Blue
          la: '#6366F1', // Indigo
          si: '#EC4899', // Pink / Violet
        }
      },
      fontFamily: {
        bubble: ['"Fredoka"', '"Quicksand"', '"Chalkboard SE"', '"Comic Sans MS"', 'sans-serif'],
        music: ['"Bravura"', '"Petaluma"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'playful': '0 8px 0px rgba(0, 0, 0, 0.08), 0 12px 20px -3px rgba(0, 0, 0, 0.1)',
        'playful-sm': '0 4px 0px rgba(0, 0, 0, 0.08)',
        'playful-pressed': '0 2px 0px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
