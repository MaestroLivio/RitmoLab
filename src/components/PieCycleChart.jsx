import React from 'react';

/**
 * PieCycleChart.jsx - Animated Metric Solfeggio Pie Chart
 * Follows the authentic Italian Solfeggio conducting gesture order:
 * 1. Basso ⬇️ (Down)
 * 2. Sinistra ⬅️ (Left)
 * 3. Destra ➡️ (Right)
 * 4. Alto ⬆️ (Up / in levare)
 * 
 * Supports dynamic note duration filling:
 * - Intero 4/4 (16/16): Fills all 4 quarters in a single block!
 * - Metà 2/4 (8/16): Fills 2 quarters together in block (e.g. Basso + Sinistra)!
 * - Quarto 1/4 (4/16): Fills individual quarter slices.
 * - Ottavo 1/8 (2/16): Fills the exact half of the corresponding slice (suddivisione).
 */

const PALETTE = [
  { color: '#38BDF8', activeColor: '#0284C7', label: '1° Tempo: In Basso ⬇️' },
  { color: '#34D399', activeColor: '#059669', label: '2° Tempo: A Sinistra ⬅️' },
  { color: '#FBBF24', activeColor: '#D97706', label: '3° Tempo: A Destra ➡️' },
  { color: '#FB7185', activeColor: '#E11D48', label: '4° Tempo: In Alto ⬆️' },
  { color: '#A78BFA', activeColor: '#7C3AED', label: '5° Tempo' },
  { color: '#F472B6', activeColor: '#DB2777', label: '6° Tempo' },
];

export default function PieCycleChart({
  currentBeat = 1,
  beatProgress = 0,
  currentStep = 0,
  notes = [],
  timeSignature = '4/4',
}) {
  // Determine sixteenths in measure
  const sixteenthsPerBar = timeSignature === '2/4' ? 8 : timeSignature === '3/4' ? 12 : timeSignature === '6/8' ? 12 : 16;
  const stepInMeasure = currentStep % sixteenthsPerBar;

  // Find sounding note at currentStep
  const soundingNote = notes?.find(n => {
    const dur = n.duration || 4;
    return currentStep >= n.step && currentStep < n.step + dur;
  });

  const activeDuration = soundingNote ? (soundingNote.duration || 4) : 4;
  const isWholeNote = soundingNote && activeDuration >= 16;
  const isHalfNote = soundingNote && activeDuration >= 8 && activeDuration < 16;
  const isEighthNote = soundingNote && activeDuration === 2;
  const isSixteenthNote = soundingNote && activeDuration === 1;

  // Slices configuration based on solfeggio conducting gesture
  const getSolfeggioConfig = () => {
    switch (timeSignature) {
      case '2/4':
        return [
          { beat: 1, name: 'Basso', startAngle: 90, endAngle: 270, desc: '1° Tempo (In Basso ⬇️)', ...PALETTE[0] },
          { beat: 2, name: 'Alto', startAngle: 270, endAngle: 450, desc: '2° Tempo (In Alto ⬆️)', ...PALETTE[1] },
        ];
      case '3/4':
        return [
          { beat: 1, name: 'Basso', startAngle: 120, endAngle: 240, desc: '1° Tempo (In Basso ⬇️)', ...PALETTE[0] },
          { beat: 2, name: 'Destra', startAngle: 0, endAngle: 120, desc: '2° Tempo (A Destra ➡️)', ...PALETTE[2] },
          { beat: 3, name: 'Alto', startAngle: 240, endAngle: 360, desc: '3° Tempo (In Alto ⬆️)', ...PALETTE[3] },
        ];
      case '6/8':
        return [
          { beat: 1, name: 'Basso 1', startAngle: 150, endAngle: 210, desc: '1° Ottavo (Basso)', ...PALETTE[0] },
          { beat: 2, name: 'Basso 2', startAngle: 210, endAngle: 270, desc: '2° Ottavo', ...PALETTE[1] },
          { beat: 3, name: 'Sinistra', startAngle: 270, endAngle: 330, desc: '3° Ottavo (Sinistra)', ...PALETTE[2] },
          { beat: 4, name: 'Destra', startAngle: 330, endAngle: 390, desc: '4° Ottavo (Destra)', ...PALETTE[3] },
          { beat: 5, name: 'Alto 1', startAngle: 30, endAngle: 90, desc: '5° Ottavo', ...PALETTE[4] },
          { beat: 6, name: 'Alto 2', startAngle: 90, endAngle: 150, desc: '6° Ottavo (In Levare)', ...PALETTE[5] },
        ];
      case '4/4':
      default:
        // Classical Solfeggio Conducting in 4/4:
        // 1. In Basso (Down): 135° to 225°
        // 2. A Sinistra (Left): 225° to 315°
        // 3. A Destra (Right): 45° to 135°
        // 4. In Alto (Up): 315° to 405° (centered at 0° North)
        return [
          { beat: 1, name: 'Basso', startAngle: 135, endAngle: 225, desc: '1° Quarto: In Basso ⬇️', ...PALETTE[0] },
          { beat: 2, name: 'Sinistra', startAngle: 225, endAngle: 315, desc: '2° Quarto: A Sinistra ⬅️', ...PALETTE[1] },
          { beat: 3, name: 'Destra', startAngle: 45, endAngle: 135, desc: '3° Quarto: A Destra ➡️', ...PALETTE[2] },
          { beat: 4, name: 'Alto', startAngle: 315, endAngle: 405, desc: '4° Quarto: In Alto ⬆️', ...PALETTE[3] },
        ];
    }
  };

  const slices = getSolfeggioConfig();
  const numSlices = slices.length;
  const safeBeat = Math.max(1, Math.min(numSlices, currentBeat));
  const activeSlice = slices[safeBeat - 1] || slices[0];

  // Helper to make SVG arc path with compass orientation (0° = North/Top, 90° = East/Right, 180° = South/Bottom, 270° = West/Left)
  const makeArc = (startDeg, endDeg, inset = 0) => {
    const radius = 42 - inset;
    const center = 50;

    const startRad = (startDeg * Math.PI) / 180.0;
    const endRad = (endDeg * Math.PI) / 180.0;

    // x = 50 + R * sin(angle), y = 50 - R * cos(angle)
    const x1 = center + radius * Math.sin(startRad);
    const y1 = center - radius * Math.cos(startRad);
    const x2 = center + radius * Math.sin(endRad);
    const y2 = center - radius * Math.cos(endRad);

    const sweep = endDeg - startDeg;
    const largeArcFlag = sweep > 180 ? 1 : 0;

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  // Determine which beats are active in a block
  const isBeatActive = (beatNum) => {
    if (isWholeNote) {
      // Intero 4/4: fills entire pie in block!
      return true;
    }

    if (isHalfNote) {
      // Metà 2/4: fills beats 1 & 2 or beats 3 & 4 in block!
      const noteStartInBar = soundingNote.step % sixteenthsPerBar;
      if (noteStartInBar < 8) {
        return beatNum === 1 || beatNum === 2;
      } else {
        return beatNum === 3 || beatNum === 4;
      }
    }

    return beatNum === safeBeat;
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white/95 backdrop-blur rounded-2xl shadow-playful-sm border border-amber-200 select-none">
      <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span>Solfeggio Metrico</span>
        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[10px] font-black">
          {safeBeat}/{numSlices}
        </span>
      </div>

      <div className="relative w-28 h-28 my-1">
        <svg viewBox="0 0 100 100" className="w-full h-full transform transition-transform duration-100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="46" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />

          {/* Slices according to Solfeggio Gesture */}
          {slices.map((slice) => {
            const active = isBeatActive(slice.beat);
            const isCurrent = slice.beat === safeBeat;

            // Handle eighth notes (subdivisions) inside active quarter
            if (active && isEighthNote && isCurrent) {
              const midAngle = (slice.startAngle + slice.endAngle) / 2;
              const isSecondEighth = (stepInMeasure % 4) >= 2;

              return (
                <g key={`slice-${slice.beat}`}>
                  {/* First eighth */}
                  <path
                    d={makeArc(slice.startAngle + 1, midAngle - 0.5)}
                    fill={!isSecondEighth ? slice.activeColor : slice.color}
                    className="opacity-95 transition-all duration-75"
                  />
                  {/* Second eighth */}
                  <path
                    d={makeArc(midAngle + 0.5, slice.endAngle - 1)}
                    fill={isSecondEighth ? slice.activeColor : '#E2E8F0'}
                    className="opacity-95 transition-all duration-75"
                  />
                </g>
              );
            }

            // Normal or Block Filling (Whole/Half/Quarter)
            const fill = active
              ? slice.activeColor
              : slice.beat < safeBeat
              ? slice.color
              : '#E2E8F0';

            const opacity = active ? 'opacity-100' : slice.beat < safeBeat ? 'opacity-70' : 'opacity-35';

            return (
              <g key={`slice-${slice.beat}`} className="transition-all duration-150">
                <path
                  d={makeArc(slice.startAngle + 1.2, slice.endAngle - 1.2)}
                  fill={fill}
                  className={`${opacity} transition-all`}
                />
              </g>
            );
          })}

          {/* Center inner circle */}
          <circle cx="50" cy="50" r="17" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
          <text
            x="50"
            y="54"
            textAnchor="middle"
            className="text-[12px] font-black fill-slate-800 select-none"
          >
            {timeSignature}
          </text>
        </svg>

        {/* Pulsing indicator on current active gesture */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            boxShadow: `0 0 12px ${activeSlice.activeColor}70`,
          }}
        />
      </div>

      {/* Dynamic Duration Block Badge */}
      <div className="mt-1 text-center w-full px-1">
        {isWholeNote ? (
          <div className="text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-lg animate-pulse">
            𝅝 Intero 4/4 in blocco (4 tempi)
          </div>
        ) : isHalfNote ? (
          <div className="text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-200 px-2 py-0.5 rounded-lg animate-pulse">
            𝅗𝅥 Metà 2/4 in blocco ({soundingNote.step % 16 < 8 ? 'Basso + Sinistra' : 'Destra + Alto'})
          </div>
        ) : isEighthNote ? (
          <div className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg">
            ♪ Ottavo 1/8 (Suddivisione {(stepInMeasure % 4) >= 2 ? '2/2' : '1/2'})
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-700">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeSlice.activeColor }}
            />
            <span className="truncate">{activeSlice.desc}</span>
          </div>
        )}
      </div>

      {/* Gesture Flow Guide */}
      <div className="mt-1 text-[9px] font-semibold text-slate-500 text-center">
        1. Basso ⬇️ ➔ 2. Sinistra ⬅️ ➔ 3. Destra ➡️ ➔ 4. Alto ⬆️
      </div>
    </div>
  );
}
