import { StaffGlyph } from './StaffGlyph';
import { groupBeams, splitNotation } from '../engine/Notation';
import { getMeter } from '../engine/Transport';

export function ScoreStaff({ rows, rowHeight, stepWidth, indent, totalSteps, signature, treble }) {
  const width = indent + totalSteps * stepWidth;
  const { barSteps } = getMeter(signature);
  const [top, bottom] = signature.split('/');
  const groups = new Map();
  rows.forEach((row, i) => {
    const voice = row.voice || 1;
    if (row.isLine) groups.set(voice, [...(groups.get(voice) || []), (i + 0.5) * rowHeight]);
  });
  if (groups.size === 0) {
    rows.forEach((_, i) => groups.set(i, [(i + 0.5) * rowHeight]));
  }
  return (
    <svg width={width} height={rows.length * rowHeight} className="score-paper block pointer-events-none" aria-hidden="true">
      {[...groups.entries()].map(([voice, ys]) => {
        const middle = (ys[0] + ys.at(-1)) / 2;
        return <g key={voice} stroke="#667398" strokeWidth="1">
          {ys.map(y => <path key={y} d={`M0 ${y}H${width - 1}`} />)}
          {Array.from({ length: Math.ceil(totalSteps / barSteps) }, (_, i) => {
            const x = Math.min(width - 2, indent + (i + 1) * barSteps * stepWidth);
            return <path key={i} d={`M${x} ${ys[0] - (ys.length === 1 ? 11 : 0)}V${ys.at(-1) + (ys.length === 1 ? 11 : 0)}`}
              stroke="#25304a" strokeWidth={x >= width - 2 ? 2.5 : 1.3} />;
          })}
          {treble && <>
            <text x="8" y={ys.at(-2)} stroke="none" fill="#182746" className="music-glyph" fontSize={rowHeight * 5}>{"\uE050"}</text>
            <text x="67" y={middle - rowHeight} stroke="none" fill="#182746" dominantBaseline="central" textAnchor="middle" fontSize={rowHeight * 1.6} fontWeight="800">{top}</text>
            <text x="67" y={middle + rowHeight} stroke="none" fill="#182746" dominantBaseline="central" textAnchor="middle" fontSize={rowHeight * 1.6} fontWeight="800">{bottom}</text>
          </>}
        </g>;
      })}
    </svg>
  );
}

export function ScoreNotes({ notes, rows, rowHeight, stepWidth, indent, totalSteps, signature, selectedId }) {
  const { barSteps } = getMeter(signature);
  const xAt = step => indent + (step + 0.5) * stepWidth;
  const altered = new Map();
  const parts = [...notes].sort((a, b) => a.step - b.step).flatMap(note => {
    const row = rows.findIndex(candidate => candidate.id === note.rowId);
    if (row < 0) return [];
    const meta = rows[row];
    const voice = meta.voice || 1;
    const restRow = rows.findIndex(candidate => (candidate.voice || 1) === voice && candidate.id.replace(/^v2:/, '') === 'SI');
    const y = ((note.isRest && restRow >= 0 ? restRow : row) + 0.5) * rowHeight;
    const accidentalKey = `${Math.floor(note.step / barSteps)}:${note.rowId}`;
    const previous = altered.get(accidentalKey) || 0;
    const accidental = note.accidental || 0;
    if (!note.isRest && meta.pitch) altered.set(accidentalKey, accidental);
    if (!Number.isInteger(note.step) || note.step < 0 || note.step >= totalSteps) return [];
    return splitNotation({ ...note, duration: Math.min(note.duration || 4, totalSteps - note.step) }, barSteps).map((part, i) => ({
      ...part, key: `${note.id}:${i}`, id: note.id, isRest: note.isRest,
      x: xAt(part.step), y, ledger: meta.isLedger,
      track: meta.pitch ? `voice${voice}` : note.rowId,
      stemUp: !meta.pitch || restRow < 0 || row > restRow,
      accidental: i === 0 && !note.isRest && meta.pitch && accidental !== previous ? accidental : null,
    }));
  });
  const beams = groupBeams(parts, signature);
  const beamed = new Set(beams.flatMap(group => group.map(note => note.key)));
  const ink = '#172341';
  return (
    <svg className="absolute inset-0 overflow-visible pointer-events-none" aria-hidden="true"
      width={indent + totalSteps * stepWidth} height={rows.length * rowHeight}>
      {parts.map(part => <g key={part.key}>
        <StaffGlyph x={part.x} y={part.y} duration={part.duration} ledger={part.ledger}
          stemUp={part.stemUp} accidental={part.accidental} rest={part.isRest} beamed={beamed.has(part.key)}
          color={part.id === selectedId ? '#5a35c8' : ink} />
        {part.tiedTo && part.step + part.duration < totalSteps && <path
          d={`M${part.x + 7} ${part.y + 7} Q${part.x + part.duration * stepWidth / 2} ${part.y + 21} ${xAt(part.step + part.duration) - 7} ${part.y + 7}`}
          fill="none" stroke={ink} strokeWidth="1.5" />}
      </g>)}
      {beams.map(group => {
        const up = group.filter(part => part.stemUp).length >= group.length / 2;
        const sign = up ? -1 : 1;
        const x = note => note.x + (up ? 6 : -6);
        const y = (up ? Math.min(...group.map(n => n.y)) : Math.max(...group.map(n => n.y))) + sign * 26;
        return <g key={group[0].key} stroke={ink}>
          <path d={`M${x(group[0])} ${y}H${x(group.at(-1))}`} strokeWidth="3.5" />
          {group.map((note, i) => {
            const next = group[i + 1];
            const previous = group[i - 1];
            const end = next?.duration === 1 ? x(next) : previous?.duration === 1 ? null
              : x(note) + (next ? 8 : -8);
            return <g key={note.key}>
              <path d={`M${x(note)} ${note.y}V${y}`} strokeWidth="1.45" />
              {note.duration === 1 && end != null && <path d={`M${x(note)} ${y - 5 * sign}H${end}`} strokeWidth="3" />}
            </g>;
          })}
        </g>;
      })}
    </svg>
  );
}
