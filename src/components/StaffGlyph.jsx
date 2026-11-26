const RESTS = { 16: '\uE4E3', 8: '\uE4E4', 4: '\uE4E5', 2: '\uE4E6', 1: '\uE4E7' };
const ACCIDENTALS = { '-1': '\uE260', 0: '\uE261', 1: '\uE262' };

export function StaffGlyph({
  x = 0, y = 0, duration = 4, rest = false, accidental = null, ledger = false,
  stemUp = true, color = 'currentColor', scale = 1, beamed = false,
}) {
  const dotted = [3, 6, 12, 24].includes(duration);
  const value = dotted ? duration * 2 / 3 : duration;
  const head = value >= 16 ? '\uE0A2' : value >= 8 ? '\uE0A3' : '\uE0A4';
  const stemX = stemUp ? 6 : -6;
  const stemY = stemUp ? -30 : 30;
  const flagCount = value === 1 ? 2 : value === 2 ? 1 : 0;
  const flag = stemUp
    ? (flagCount === 2 ? '\uE242' : '\uE240')
    : (flagCount === 2 ? '\uE243' : '\uE241');

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={color}>
      {rest ? (
        <text className="music-glyph" x="-5" y={value === 16 ? -10 : 0} fontSize="40">{RESTS[value] || RESTS[4]}</text>
      ) : (
        <>
          {ledger && <path d="M-12 0H12" stroke={color} strokeWidth="1.35" />}
          {accidental != null && <text className="music-glyph" x="-19" fontSize="40">{ACCIDENTALS[accidental]}</text>}
          <text className="music-glyph" x={value >= 16 ? -8 : -6} fontSize="40">{head}</text>
          {value < 16 && !beamed && <>
            <path d={`M${stemX} 0V${stemY}`} stroke={color} strokeWidth="1.45" />
            {flagCount > 0 && <text className="music-glyph" x={stemX} y={stemY} fontSize="40">{flag}</text>}
          </>}
        </>
      )}
      {dotted && <circle cx={12} cy={-2.5} r={1.65} />}
    </g>
  );
}
