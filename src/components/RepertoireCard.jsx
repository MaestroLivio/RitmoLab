import { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../engine/AudioEngine';
import { getMeter } from '../engine/Transport';
import { ScoreNotes, ScoreStaff } from './ScoreEngraving';
import { PENTAGRAM_ROWS } from './StaffRenderer';

export function LessonAnnotations({ chords = [], lyrics = [], dynamics = [], start = 0, steps, stepWidth, indent = 0, text = false }) {
  const end = start + steps;
  const carried = chords.findLast(event => event.step < start);
  const ariaLabel = 'Accordi, dinamica e testo';
  const place = step => ({ left: indent + (step - start + 0.5) * stepWidth });
  return (
    <div className="lesson-score-annotations" aria-label={ariaLabel}>
      {!text && <div className="lesson-annotation-row">
        {carried && !chords.some(event => event.step === start) &&
          <b style={place(start)}>{carried.symbol}</b>}
        {chords.filter(event => event.step >= start && event.step < end)
          .map(event => <b key={event.step} style={place(event.step)}>{event.symbol}</b>)}
      </div>}
      {!text && dynamics.length > 0 && <div className="lesson-annotation-row lesson-dynamic-row">
        {dynamics.filter(event => event.step >= start && event.step < end)
          .map(event => <b key={event.step} style={place(event.step)} title={event.label}>{event.mark}</b>)}
      </div>}
      {text && <div className="lesson-annotation-row lesson-lyric-row">
        {lyrics.filter(event => event.lyric && event.lyric !== '_' && event.step >= start && event.step < end)
          .map(event => <span key={event.id} style={place(event.step)}>{event.lyric}</span>)}
      </div>}
    </div>
  );
}

export default function RepertoireCard({ level, showScore = true, modelPlaying = false, onListeningChange }) {
  const [notation, setNotation] = useState('conventional');
  const [bar, setBar] = useState(0);
  const [listening, setListening] = useState(false);
  const [related, setRelated] = useState(false);
  const ownedPlayback = useRef(false);
  const score = related ? level.relatedSong : level.song;
  useEffect(() => () => {
    if (ownedPlayback.current) audioEngine.stopPlayback();
  }, []);
  if (!score) return null;
  const { barSteps } = getMeter(score.timeSignature);
  const bars = Math.ceil(score.totalSteps / barSteps);
  const steps = Math.min(barSteps, score.totalSteps - bar * barSteps);
  const start = bar * barSteps;
  const stepWidth = 20;
  const indent = 65;
  const rowHeight = 12;
  const width = indent + steps * stepWidth;
  const listen = () => {
    if (listening) {
      audioEngine.stopPlayback();
      ownedPlayback.current = false;
      setListening(false);
      onListeningChange?.(false);
      return;
    }
    ownedPlayback.current = true;
    setListening(true);
    onListeningChange?.(true);
    audioEngine.startScorePlayback({
      ...score, bpm: level.bpm, tracks: [{ notes: score.notes }], backing: 'melody',
    }, ({ step }) => setBar(Math.min(bars - 1, Math.floor(step / barSteps))), () => {
      ownedPlayback.current = false;
      setListening(false);
      onListeningChange?.(false);
    });
  };
  return (
    <section className="repertoire-card" aria-label="Brano di repertorio">
      <div className="repertoire-heading">
        <div>
          <div className="repertoire-kicker">Repertorio · Do maggiore · {score.timeSignature}</div>
          <strong>{score.title}</strong>
          <p>{score.origin}</p>
        </div>
        <div className="repertoire-actions">
          {showScore && <button type="button" disabled={modelPlaying} onClick={listen}>
            {listening ? 'Ferma il brano' : 'Ascolta il brano'}
          </button>}
          <a href={score.youtubeUrl} target="_blank" rel="noreferrer">Esecuzione su YouTube</a>
        </div>
      </div>
      {showScore && level.relatedSong && <label className="repertoire-actions">Confronta i canoni
        <select value={related ? 'related' : 'main'} disabled={listening} onChange={event => {
          setRelated(event.target.value === 'related');
          setBar(0);
        }}>
          <option value="main">{level.song.title}</option>
          <option value="related">{level.relatedSong.title}</option>
        </select>
      </label>}
      {level.dynamics?.length > 0 && <details className="lesson-dynamics">
        <summary>Dinamica · {level.dynamics.map(event => event.label).join(' → ')}</summary>
        {level.dynamics.map(event => <p key={event.step}>
          <strong>{event.label}:</strong> {event.hint}
        </p>)}
        <small>L’intensità si prova con l’insegnante. Il punteggio non la misura.</small>
      </details>}
      {showScore && <details className="repertoire-score">
        <summary>Partitura del brano</summary>
        <div className="repertoire-actions">
          <label>Notazione <select value={notation} onChange={event => setNotation(event.target.value)}>
            <option value="conventional">Pentagramma</option>
            <option value="blocks">Blocchi proporzionali</option>
          </select></label>
          <label>Battuta <select value={bar} disabled={listening} onChange={event => setBar(Number(event.target.value))}>
            {Array.from({ length: bars }, (_, index) => <option key={index} value={index}>{index + 1} di {bars}</option>)}
          </select></label>
        </div>
        <div className="repertoire-sheet" style={{ maxWidth: width }}>
          <div className="repertoire-sheet-inner" style={{ width }}>
            <LessonAnnotations chords={score.chords} start={start} steps={steps} stepWidth={stepWidth} indent={indent} />
            {notation === 'conventional' ? <div className="relative">
              <ScoreStaff rows={PENTAGRAM_ROWS} rowHeight={rowHeight} stepWidth={stepWidth}
                indent={indent} totalSteps={steps} signature={score.timeSignature} treble />
              <ScoreNotes rows={PENTAGRAM_ROWS} notes={score.notes} rowHeight={rowHeight}
                stepWidth={stepWidth} indent={indent} totalSteps={score.totalSteps} startStep={start}
                visibleSteps={steps} signature={score.timeSignature} />
            </div> : <div className="repertoire-blocks">
              {score.notes.filter(note => note.step >= start && note.step < start + steps).map(note => (
                <span key={note.id} style={{ left: indent + (note.step - start) * stepWidth,
                  width: Math.max(12, note.duration * stepWidth - 2) }}>{note.isRest ? 'Pausa' : note.pitch.replace('_HIGH', '↑')}</span>
              ))}
            </div>}
            <LessonAnnotations text lyrics={score.notes} start={start} steps={steps}
              stepWidth={stepWidth} indent={indent} />
          </div>
        </div>
      </details>}
    </section>
  );
}
