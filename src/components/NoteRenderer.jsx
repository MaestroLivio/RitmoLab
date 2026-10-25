import { SOLFEGE_MAP } from '../engine/AudioEngine';
import KodalyHandSign from './KodalyHandSign';

/**
 * NoteRenderer.jsx - Dual-Mode Note Visualizer
 * Supports:
 * 1) "blocks" - Proportional Montessori blocks
 * 2) "conventional" - Traditional musical notation (heads, stems, flags, rests, ledger lines, accidentals)
 */

export const SOUND_COLORS = {
  clap: { bg: '#38BDF8', border: '#0284C7', text: '#0C4A6E', label: 'Mani', icon: '👏' },
  chest: { bg: '#FB7185', border: '#E11D48', text: '#881337', label: 'Petto', icon: '🫀' },
  thighs: { bg: '#FBBF24', border: '#D97706', text: '#78350F', label: 'Cosce', icon: '🦵' },
  feet: { bg: '#34D399', border: '#059669', text: '#064E3B', label: 'Piedi', icon: '🦶' },
  snap: { bg: '#C084FC', border: '#9333EA', text: '#581C87', label: 'Dita', icon: '🫰' },
  claves: { bg: '#D97706', border: '#92400E', text: '#451A03', label: 'Legnetti', icon: '🥢' },
  tambourine: { bg: '#F472B6', border: '#DB2777', text: '#831843', label: 'Tamburello', icon: '🪘' },
  triangle: { bg: '#FDE047', border: '#CA8A04', text: '#713F12', label: 'Triangolo', icon: '📐' },
  cymbals: { bg: '#22D3EE', border: '#0891B2', text: '#164E63', label: 'Piatti', icon: '🪙' },
};

// Staff position indices (bottom C4 = 0 … top F5 = 10). Middle line B4 = 6.
const SCIENTIFIC_STAFF_INDEX = {
  'C4': 0, 'D4': 1, 'E4': 2, 'F4': 3, 'G4': 4, 'A4': 5, 'B4': 6,
  'C5': 7, 'D5': 8, 'E5': 9, 'F5': 10,
};
const SOLFEGE_STAFF_INDEX = {
  'DO': 0, 'RE': 1, 'MI': 2, 'FA': 3, 'SOL': 4, 'LA': 5, 'SI': 6,
  'DO_HIGH': 7, 'RE_HIGH': 8, 'MI_HIGH': 9, 'FA_HIGH': 10,
};

/**
 * Resolves a pitch (solfege key or scientific name) to its staff index,
 * or null when unknown. Used to compute the correct stem direction.
 */
function getStaffPitchIndex(pitch) {
  if (!pitch) return null;
  const p = String(pitch).toUpperCase().trim();
  if (SCIENTIFIC_STAFF_INDEX[p] !== undefined) return SCIENTIFIC_STAFF_INDEX[p];
  if (SOLFEGE_STAFF_INDEX[p] !== undefined) return SOLFEGE_STAFF_INDEX[p];
  const meta = SOLFEGE_MAP[p];
  if (meta && SCIENTIFIC_STAFF_INDEX[meta.note] !== undefined) return SCIENTIFIC_STAFF_INDEX[meta.note];
  return null;
}

export default function NoteRenderer({
  note,
  viewMode = 'blocks', // 'blocks' | 'conventional'
  stepWidth = 24,       // pixel width per 16th note
  rowHeight = 36,       // pixel height per pitch/sound row
  indent = 0,           // left gutter (px) reserved for clef + time signature
  showChironomy = true,
  isSelected = false,
  onSelect = null,
  onDelete = null,
}) {
  const widthPx = Math.max(stepWidth * (note.duration || 4) - 4, 18);
  const leftPx = indent + note.step * stepWidth;
  const isRest = !!note.isRest;

  // Sound style for percussion
  const soundMeta = note.sound ? SOUND_COLORS[note.sound] : null;

  // Solfege meta for melodic
  const solfegeMeta = note.pitch ? SOLFEGE_MAP[note.pitch.toUpperCase()] : null;

  const primaryColor = solfegeMeta?.color || soundMeta?.bg || '#38BDF8';
  const borderColor = soundMeta?.border || (solfegeMeta ? '#1E293B' : '#0284C7');

  if (viewMode === 'blocks') {
    // ------------------------------------------------------------------
    // PROPORTIONAL BLOCKS VIEW
    // ------------------------------------------------------------------
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) onSelect(note);
        }}
        className={`absolute top-1 bottom-1 rounded-xl flex items-center justify-between px-2 cursor-grab active:cursor-grabbing transition-all select-none border-2 shadow-playful-sm ${
          isSelected ? 'ring-4 ring-purple-400 ring-offset-2 z-20 scale-[1.02]' : 'z-10'
        } ${isRest ? 'bg-slate-200/90 border-slate-400 border-dashed' : ''}`}
        style={{
          left: `${leftPx}px`,
          width: `${widthPx}px`,
          backgroundColor: isRest ? '#F1F5F9' : primaryColor,
          borderColor: isRest ? '#94A3B8' : borderColor,
        }}
        title={`${isRest ? 'Pausa' : (solfegeMeta?.label || soundMeta?.label || 'Nota')} (${
          note.duration === 16 ? 'Intero 4/4' : note.duration === 8 ? 'Metà 2/4' : note.duration === 4 ? 'Quarto 1/4' : note.duration === 2 ? 'Ottavo 1/8' : 'Sedicesimo 1/16'
        })`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
          {/* Icon / Chironomy */}
          {isRest ? (
            <span className="text-base font-black text-slate-600">𝄽</span>
          ) : showChironomy && note.pitch ? (
            <KodalyHandSign pitch={note.pitch} size="sm" />
          ) : soundMeta?.icon ? (
            <span className="text-base select-none">{soundMeta.icon}</span>
          ) : (
            <span className="text-sm font-bold">♪</span>
          )}

          {/* Label */}
          <span className="text-xs font-black text-slate-800 drop-shadow-sm select-none">
            {isRest
              ? (note.duration === 16 ? 'Pausa 4/4' : note.duration === 8 ? 'Pausa 2/4' : note.duration === 4 ? 'Pausa 1/4' : 'Pausa 1/8')
              : (solfegeMeta?.label || soundMeta?.label || '')}
            {note.accidental === 1 && ' ♯'}
            {note.accidental === -1 && ' ♭'}
          </span>
        </div>

        {/* Duration badge for educational math */}
        {widthPx > 36 && (
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white/80 text-slate-800 ml-1 shadow-xs">
            {note.duration === 16 ? 'Intero 4/4' : note.duration === 8 ? 'Metà 2/4' : note.duration === 4 ? 'Quarto 1/4' : note.duration === 2 ? 'Ottavo 1/8' : 'Sedicesimo 1/16'}
          </span>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // CONVENTIONAL NOTATION VIEW (Traditional Noteheads, Stems, Flags)
  // ------------------------------------------------------------------
  const isWhole = note.duration >= 16;
  const isHalf = note.duration >= 8 && note.duration < 16;
  const isQuarter = note.duration === 4;
  const isEighth = note.duration === 2;
  const isSixteenth = note.duration <= 1;

  // Correct stem direction: notes below the middle line (B4) get an upward stem,
  // notes on or above it get a downward stem (standard notation convention).
  const staffIdx = getStaffPitchIndex(note.pitch);
  const stemUp = staffIdx === null ? true : staffIdx < 6;
  const headColor = isRest ? '#64748B' : (solfegeMeta?.color || '#1E293B');

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect) onSelect(note);
      }}
      className={`absolute top-0 bottom-0 flex items-center cursor-pointer select-none transition-transform ${
        isSelected ? 'scale-110 z-20' : 'z-10'
      }`}
      style={{
        left: `${leftPx + (stepWidth * 0.2)}px`,
        width: `${widthPx}px`,
      }}
    >
      {/* Overlaid Kodaly Hand Sign badge in Conventional View */}
      {showChironomy && note.pitch && (
        <div className="absolute -top-3.5 left-0 z-30 pointer-events-none drop-shadow-sm">
          <KodalyHandSign pitch={note.pitch} size="sm" />
        </div>
      )}

      <div className="relative w-8 h-12 flex items-center justify-center">
        {isRest ? (
          // Conventional Rests
          <div className="flex flex-col items-center justify-center">
            {note.duration >= 4 ? (
              <span className="text-3xl font-black text-slate-800 select-none">𝄽</span>
            ) : (
              <span className="text-2xl font-black text-slate-800 select-none">𝄾</span>
            )}
          </div>
        ) : (
          <svg viewBox="0 0 40 56" className="w-10 h-14 overflow-visible">
            {/* Accidental prefix if present */}
            {note.accidental === 1 && (
              <text x="-12" y="30" className="text-lg font-black fill-slate-800">
                ♯
              </text>
            )}
            {note.accidental === -1 && (
              <text x="-10" y="28" className="text-lg font-black fill-slate-800">
                ♭
              </text>
            )}

            {/* Notehead: tilted ellipse */}
            <ellipse
              cx="16"
              cy="28"
              rx="9"
              ry="6"
              transform="rotate(-20 16 28)"
              fill={isWhole || isHalf ? '#FFFFFF' : headColor}
              stroke="#1E293B"
              strokeWidth="2.5"
            />

            {/* Note Stem (Not needed for Whole note) */}
            {!isWhole && (
              <line
                x1={stemUp ? 23 : 9}
                y1={stemUp ? 26 : 30}
                x2={stemUp ? 23 : 9}
                y2={stemUp ? 4 : 52}
                stroke="#1E293B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Flags for Eighth (♪) and Sixteenth (♬) */}
            {isEighth && stemUp && (
              <path
                d="M 23 4 C 28 10, 32 16, 28 22"
                fill="none"
                stroke="#1E293B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
            {isEighth && !stemUp && (
              <path
                d="M 9 52 C 4 46, 0 40, 4 34"
                fill="none"
                stroke="#1E293B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
            {isSixteenth && stemUp && (
              <>
                <path
                  d="M 23 4 C 28 10, 32 16, 28 20"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 23 10 C 28 16, 32 22, 28 26"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}
            {isSixteenth && !stemUp && (
              <>
                <path
                  d="M 9 52 C 4 46, 0 40, 4 36"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 9 46 C 4 40, 0 34, 4 30"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
