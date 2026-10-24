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

export default function NoteRenderer({
  note,
  viewMode = 'blocks', // 'blocks' | 'conventional'
  stepWidth = 24,       // pixel width per 16th note
  rowHeight = 36,       // pixel height per pitch/sound row
  showChironomy = true,
  isSelected = false,
  onSelect = null,
  onDelete = null,
}) {
  const widthPx = Math.max(stepWidth * (note.duration || 4) - 4, 18);
  const leftPx = note.step * stepWidth;
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

  // Stem height: ~35px upward
  const stemUp = true;
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
          <svg viewBox="0 0 40 50" className="w-10 h-12 overflow-visible">
            {/* Accidental prefix if present */}
            {note.accidental === 1 && (
              <text x="-12" y="28" className="text-lg font-black fill-slate-800">
                ♯
              </text>
            )}
            {note.accidental === -1 && (
              <text x="-10" y="26" className="text-lg font-black fill-slate-800">
                ♭
              </text>
            )}

            {/* Notehead: tilted ellipse */}
            <ellipse
              cx="16"
              cy="25"
              rx="9"
              ry="6"
              transform="rotate(-20 16 25)"
              fill={isWhole || isHalf ? '#FFFFFF' : headColor}
              stroke="#1E293B"
              strokeWidth="2.5"
            />

            {/* Note Stem (Not needed for Whole note) */}
            {!isWhole && (
              <line
                x1="23"
                y1="23"
                x2="23"
                y2="2"
                stroke="#1E293B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Flags for Eighth (♪) and Sixteenth (♬) */}
            {isEighth && (
              <path
                d="M 23 2 C 28 8, 32 14, 28 20"
                fill="none"
                stroke="#1E293B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
            {isSixteenth && (
              <>
                <path
                  d="M 23 2 C 28 8, 32 14, 28 18"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 23 8 C 28 14, 32 20, 28 24"
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
