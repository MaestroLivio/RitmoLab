import React from 'react';

/**
 * KodalyHandSign.jsx - Authentic Vector Visualizer for Kodály / Curwen Hand Signs
 * Renders recognizable, clean, high-contrast SVG illustrations of the 7 Curwen hand signs.
 */

export const KODALY_SIGNS_DATA = {
  DO: {
    syllable: 'Do',
    name: 'Pugno (Fist)',
    description: 'Pugno chiuso solido e orizzontale: radice forte e stabile.',
    color: '#EF4444', // Red
    textColor: '#FFFFFF',
    keyboardKey: 'A',
    keyNumber: '1',
  },
  RE: {
    syllable: 'Re',
    name: 'Rampa (Slope)',
    description: 'Mano distesa inclinata a 45° verso l\'alto: sale verso il Mi.',
    color: '#F97316', // Orange
    textColor: '#FFFFFF',
    keyboardKey: 'S',
    keyNumber: '2',
  },
  MI: {
    syllable: 'Mi',
    name: 'Piano (Flat)',
    description: 'Palmo orizzontale disteso rivolto verso il basso: calma e riposo.',
    color: '#FBBF24', // Warm Yellow
    textColor: '#78350F',
    keyboardKey: 'D',
    keyNumber: '3',
  },
  FA: {
    syllable: 'Fa',
    name: 'Pollice Giù (Thumb Down)',
    description: 'Pugno con pollice puntato decisamente verso il basso: tensione verso il Mi.',
    color: '#10B981', // Emerald Green
    textColor: '#FFFFFF',
    keyboardKey: 'F',
    keyNumber: '4',
  },
  SOL: {
    syllable: 'Sol',
    name: 'Muro / Specchio (Open Palm)',
    description: 'Palmo verticale piatto rivolto verso il proprio viso: chiaro e luminoso.',
    color: '#3B82F6', // Blue
    textColor: '#FFFFFF',
    keyboardKey: 'G',
    keyNumber: '5',
  },
  LA: {
    syllable: 'La',
    name: 'Cupola / Campana (Arch)',
    description: 'Mano morbida arcuata a campana rivolta verso il basso: dolcezza sospesa.',
    color: '#6366F1', // Indigo
    textColor: '#FFFFFF',
    keyboardKey: 'H',
    keyNumber: '6',
  },
  SI: {
    syllable: 'Si',
    name: 'Indice Su (Point Up)',
    description: 'Dito indice teso verso l\'alto: attrazione verso il Do acuto.',
    color: '#EC4899', // Pink
    textColor: '#FFFFFF',
    keyboardKey: 'J',
    keyNumber: '7',
  },
  DO_HIGH: {
    syllable: 'Do²',
    name: 'Pugno Alto',
    description: 'Pugno solido sollevato in alto.',
    color: '#DC2626',
    textColor: '#FFFFFF',
    keyboardKey: 'K',
    keyNumber: '8',
  }
};

export default function KodalyHandSign({
  pitch = 'SOL',
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = false,
  className = '',
}) {
  const normalizedKey = (pitch || 'SOL').toUpperCase().replace('4', '').replace('5', '');
  const isHighDo = pitch === 'DO_HIGH' || pitch === 'C5';
  const dataKey = isHighDo ? 'DO_HIGH' : (KODALY_SIGNS_DATA[normalizedKey] ? normalizedKey : 'SOL');
  const info = KODALY_SIGNS_DATA[dataKey] || KODALY_SIGNS_DATA.SOL;

  // Dimensions
  const pxSize = size === 'sm' ? 22 : size === 'lg' ? 48 : 32;

  // Distinct clean vector drawing of each gesture
  const renderGesturePath = () => {
    switch (dataKey) {
      case 'DO':
      case 'DO_HIGH':
        // Closed horizontal solid fist
        return (
          <g fill="currentColor" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="7" y="10" width="18" height="12" rx="4" />
            <path d="M 7 13 L 21 13" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity="0.6" />
            <path d="M 7 16 L 21 16" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity="0.6" />
            <circle cx="10" cy="18" r="2.5" fill="#FFFFFF" opacity="0.4" />
          </g>
        );

      case 'RE':
        // Slanted open palm tilted upward 45 deg
        return (
          <g fill="currentColor" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M 6 22 L 20 8 C 22 6, 26 10, 24 12 L 10 26 Z" />
            <line x1="12" y1="12" x2="22" y2="12" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
          </g>
        );

      case 'MI':
        // Horizontal flat palm facing downward
        return (
          <g fill="currentColor" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="5" y="13" width="22" height="6" rx="3" />
            <line x1="5" y1="19" x2="16" y2="23" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="15" x2="24" y2="15" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
          </g>
        );

      case 'FA':
        // Fist with thumb pointing down
        return (
          <g fill="currentColor" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="8" y="7" width="16" height="12" rx="3" />
            {/* Thumb pointing down */}
            <path d="M 12 18 L 12 25 C 12 26.5, 9 26.5, 9 25 L 9 18 Z" fill="#1E293B" />
          </g>
        );

      case 'SOL':
        // Flat vertical open palm facing self
        return (
          <g fill="currentColor" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="11" y="5" width="10" height="20" rx="3" />
            <line x1="14" y1="7" x2="14" y2="23" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
            <line x1="18" y1="7" x2="18" y2="23" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
          </g>
        );

      case 'LA':
        // Arched downward curved bell/dome
        return (
          <g fill="currentColor" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M 6 22 C 6 10, 26 10, 26 22 L 21 22 C 21 14, 11 14, 11 22 Z" />
          </g>
        );

      case 'SI':
        // Pointing index finger up
        return (
          <g fill="currentColor" stroke="#1E293B" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="9" y="14" width="14" height="11" rx="3" />
            {/* Index finger pointing up */}
            <rect x="12" y="5" width="4.5" height="11" rx="2" fill="#1E293B" />
          </g>
        );

      default:
        return <circle cx="16" cy="16" r="8" fill="currentColor" />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`} title={`${info.syllable}: ${info.name} - ${info.description}`}>
      <div
        className="rounded-full flex items-center justify-center shadow-xs border border-slate-700/30 flex-shrink-0 transition-transform"
        style={{
          width: `${pxSize}px`,
          height: `${pxSize}px`,
          backgroundColor: info.color,
          color: info.textColor,
        }}
      >
        <svg viewBox="0 0 32 32" className="w-[85%] h-[85%]">
          {renderGesturePath()}
        </svg>
      </div>

      {showLabel && (
        <span className="text-xs font-black text-slate-800">
          {info.syllable}
        </span>
      )}
    </div>
  );
}
