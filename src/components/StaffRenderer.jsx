import React from 'react';

/**
 * StaffRenderer.jsx - Musical Staff Lines & Clefs Renderer
 * Dynamically switches between Bigram (2 lines), Trigram (3 lines), Pentagram (5 lines),
 * Dual Staves (polyphony), and Body Percussion multi-track rows.
 */

// Staff Pitch definitions (Y-index mapping from top to bottom)
export const PENTAGRAM_ROWS = [
  { id: 'FA_HIGH', pitch: 'F5', label: 'Fa²', isLine: true, lineIndex: 5 },
  { id: 'MI_HIGH', pitch: 'E5', label: 'Mi²', isLine: false },
  { id: 'RE_HIGH', pitch: 'D5', label: 'Re²', isLine: true, lineIndex: 4 },
  { id: 'DO_HIGH', pitch: 'C5', label: 'Do²', isLine: false },
  { id: 'SI', pitch: 'B4', label: 'Si', isLine: true, lineIndex: 3 },
  { id: 'LA', pitch: 'A4', label: 'La', isLine: false },
  { id: 'SOL', pitch: 'G4', label: 'Sol', isLine: true, lineIndex: 2 },
  { id: 'FA', pitch: 'F4', label: 'Fa', isLine: false },
  { id: 'MI', pitch: 'E4', label: 'Mi', isLine: true, lineIndex: 1 },
  { id: 'RE', pitch: 'D4', label: 'Re', isLine: false },
  { id: 'DO', pitch: 'C4', label: 'Do', isLine: false, isLedger: true }, // Middle C
];

export const TRIGRAM_ROWS = [
  { id: 'LA', pitch: 'A4', label: 'La', isLine: false },
  { id: 'SOL', pitch: 'G4', label: 'Sol', isLine: true, lineIndex: 3 },
  { id: 'MI', pitch: 'E4', label: 'Mi', isLine: true, lineIndex: 2 },
  { id: 'RE', pitch: 'D4', label: 'Re', isLine: false },
  { id: 'DO', pitch: 'C4', label: 'Do', isLine: true, lineIndex: 1 },
];

export const BIGRAM_ROWS = [
  { id: 'LA', pitch: 'A4', label: 'La', isLine: false },
  { id: 'SOL', pitch: 'G4', label: 'Sol', isLine: true, lineIndex: 2 },
  { id: 'MI', pitch: 'E4', label: 'Mi', isLine: true, lineIndex: 1 },
];

export const PERCUSSION_ROWS = [
  { id: 'clap', sound: 'clap', label: 'Mani (Clap)', icon: '👏', color: '#38BDF8' },
  { id: 'snap', sound: 'snap', label: 'Dita (Snap)', icon: '🫰', color: '#C084FC' },
  { id: 'chest', sound: 'chest', label: 'Petto (Chest)', icon: '🫀', color: '#FB7185' },
  { id: 'thighs', sound: 'thighs', label: 'Cosce (Thighs)', icon: '🦵', color: '#FBBF24' },
  { id: 'feet', sound: 'feet', label: 'Piedi (Feet)', icon: '🦶', color: '#34D399' },
];

export const ORFF_ROWS = [
  { id: 'claves', sound: 'claves', label: 'Legnetti', icon: '🥢', color: '#D97706' },
  { id: 'tambourine', sound: 'tambourine', label: 'Tamburello', icon: '🪘', color: '#F472B6' },
  { id: 'triangle', sound: 'triangle', label: 'Triangolo', icon: '📐', color: '#FDE047' },
  { id: 'cymbals', sound: 'cymbals', label: 'Piatti', icon: '🪙', color: '#22D3EE' },
];

export const ALL_RHYTHMIC_ROWS = [...PERCUSSION_ROWS, ...ORFF_ROWS];

export default function StaffRenderer({
  staffType = 'single', // 'single' | 'bigram' | 'trigram' | 'pentagram' | 'dual'
  activeRows = [],
  stepWidth = 24,
  rowHeight = 36,
  totalSteps = 16,
  timeSignature = '4/4',
  trackIndex = 0,
}) {
  const getSixteenthsPerBar = (ts) => {
    switch (ts) {
      case '2/4': return 8;
      case '3/4': return 12;
      case '6/8': return 12;
      case '4/4':
      default: return 16;
    }
  };

  const sixteenthsPerBar = getSixteenthsPerBar(timeSignature);
  const totalWidthPx = totalSteps * stepWidth;
  const barsCount = Math.ceil(totalSteps / sixteenthsPerBar);

  // Measure bar lines
  const barLinePositions = [];
  for (let b = 1; b <= barsCount; b++) {
    barLinePositions.push(b * sixteenthsPerBar * stepWidth);
  }

  // Beat subdivision lines
  const beatStep = timeSignature === '6/8' ? 2 : 4;
  const beatLinePositions = [];
  for (let s = beatStep; s < totalSteps; s += beatStep) {
    if (s % sixteenthsPerBar !== 0) {
      beatLinePositions.push(s * stepWidth);
    }
  }

  const [tsTop, tsBottom] = timeSignature.split('/');

  return (
    <div className="relative w-full select-none" style={{ width: `${totalWidthPx}px` }}>
      {/* Background Grid Lines: Beats and Bars */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Subtle 16th note background grid */}
        {Array.from({ length: totalSteps }).map((_, stepIdx) => (
          <div
            key={`step-${stepIdx}`}
            className="absolute top-0 bottom-0 border-r border-slate-100"
            style={{ left: `${stepIdx * stepWidth}px`, width: `${stepWidth}px` }}
          />
        ))}

        {/* Beat division lines */}
        {beatLinePositions.map((pos, idx) => (
          <div
            key={`beat-${idx}`}
            className="absolute top-0 bottom-0 border-r border-amber-200/80"
            style={{ left: `${pos}px` }}
          />
        ))}

        {/* Measure bar lines (Thick) */}
        {barLinePositions.map((pos, idx) => (
          <div
            key={`bar-${idx}`}
            className="absolute top-0 bottom-0 border-r-2 border-slate-700 z-10"
            style={{ left: `${pos}px` }}
          />
        ))}

        {/* Treble Clef (Chiave di Sol) for Pentagram Staff */}
        {(staffType === 'pentagram' || staffType === 'dual') && (
          <>
            <div
              className="absolute left-1 z-10 pointer-events-none select-none flex items-center justify-center opacity-75"
              style={{
                top: `${0 * rowHeight}px`,
                height: `${9 * rowHeight}px`,
                width: '40px',
              }}
            >
              <span className="text-7xl font-serif text-slate-800 leading-none select-none drop-shadow-xs">
                𝄞
              </span>
            </div>

            {/* Time signature symbol */}
            <div
              className="absolute left-11 z-10 pointer-events-none select-none flex flex-col items-center justify-center font-serif font-black text-slate-800 opacity-80"
              style={{
                top: `${4 * rowHeight - 4}px`,
                height: `${4 * rowHeight}px`,
                width: '24px',
              }}
            >
              <span className="text-xl font-black leading-none">{tsTop}</span>
              <span className="text-xl font-black leading-none">{tsBottom}</span>
            </div>
          </>
        )}
      </div>

      {/* Rows & Musical Staff Lines */}
      {activeRows.map((row, rowIdx) => {
        const topPx = rowIdx * rowHeight;
        const isLine = row.isLine;
        const isLedger = row.isLedger;

        return (
          <div
            key={row.id}
            className="relative flex items-center border-b border-slate-100/60 transition-colors"
            style={{ height: `${rowHeight}px` }}
          >
            {/* The Musical Staff Horizontal Line */}
            {isLine && (
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-700/80 pointer-events-none z-0" />
            )}

            {/* Ledger Line for Middle C (Do4) */}
            {isLedger && (
              <div className="absolute inset-0 flex items-center pointer-events-none z-0">
                {/* Visual faint dashed guide */}
                <div className="w-full h-[1px] border-b border-dashed border-slate-300" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
