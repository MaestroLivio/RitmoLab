const pitches = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DO_HIGH'];
const midi = [60, 62, 64, 65, 67, 69, 71, 72];
const harmony = { C: [60, 64, 67], F: [60, 65, 69], G7: [62, 65, 67, 71], G: [62, 67, 71], Dm: [62, 65, 69] };

// pitch degree (0 = rest), duration in sixteenths, syllable. Bars are separated by |.
function song(title, origin, video, timeSignature, score, chordChanges) {
  let step = 0;
  const notes = score.trim().split(/\s+/).filter(token => token !== '|').map((token, index) => {
    const [degree, length, lyric] = token.split(':');
    const duration = Number(length);
    const pitch = pitches[Number(degree) - 1];
    const note = {
      id: `melody-${index}`, step, duration, pitch, rowId: pitch || 'SI',
      midi: midi[Number(degree) - 1], isRest: !pitch, lyric,
      velocity: step % 4 === 0 ? 82 : 73,
    };
    step += duration;
    return note;
  });
  return {
    title, origin, timeSignature, notes, totalSteps: step, key: 'C',
    youtubeUrl: `https://www.youtube.com/watch?v=${video}`,
    chords: chordChanges.map(([step, symbol]) => ({ step, symbol, midi: harmony[symbol] })),
  };
}

export const REPERTOIRE = {
  twinkle: song('Twinkle, Twinkle, Little Star', 'Melodia francese · Testo inglese', 'yCjJyiqpAuU', '4/4', `
    1:4:Twin- 1:4:kle 5:4:twin- 5:4:kle | 6:4:lit- 6:4:tle 5:8:star |
    4:4:How 4:4:I 3:4:won- 3:4:der | 2:4:what 2:4:you 1:8:are |
    5:4:Up 5:4:a- 4:4:bove 4:4:the | 3:4:world 3:4:so 2:8:high |
    5:4:Like 5:4:a 4:4:dia- 4:4:mond | 3:4:in 3:4:the 2:8:sky |
    1:4:Twin- 1:4:kle 5:4:twin- 5:4:kle | 6:4:lit- 6:4:tle 5:8:star |
    4:4:How 4:4:I 3:4:won- 3:4:der | 2:4:what 2:4:you 1:8:are
  `, [[0, 'C'], [16, 'F'], [24, 'C'], [32, 'F'], [40, 'C'], [48, 'G7'], [56, 'C'],
    [72, 'F'], [80, 'C'], [88, 'G7'], [96, 'C'], [104, 'F'], [112, 'C'], [120, 'G7'],
    [128, 'C'], [144, 'F'], [152, 'C'], [160, 'F'], [168, 'C'], [176, 'G7'], [184, 'C']]),
  rain: song('Rain, Rain, Go Away', 'Filastrocca inglese · Variante Sol–Mi', 'O1cLd7EGAR0', '4/4', `
    5:4:Rain 3:4:rain 5:2:go 5:2:a- 3:4:way |
    5:4:Come 5:2:a- 3:2:gain 5:2:an- 5:2:o- 3:2:ther 3:2:day
  `, [[0, 'C']]),
  hot: song('Hot Cross Buns', 'Filastrocca inglese · Variante a tre note', 're3gXNTtwig', '4/4', `
    3:4:Hot 2:4:cross 1:8:buns | 3:4:Hot 2:4:cross 1:8:buns |
    1:2:One 1:2:a 1:2:pen- 1:2:ny 2:2:two 2:2:a 2:2:pen- 2:2:ny |
    3:4:Hot 2:4:cross 1:8:buns
  `, [[0, 'C'], [4, 'G7'], [8, 'C'], [20, 'G7'], [24, 'C'], [40, 'G7'], [48, 'C'], [52, 'G7'], [56, 'C']]),
  fra: song('Fra Martino', 'Canone francese · Testo italiano', 'hS60KkwSTxw', '4/4', `
    1:4:Fra 2:4:Mar- 3:4:ti- 1:4:no | 1:4:Fra 2:4:Mar- 3:4:ti- 1:4:no |
    3:4:Cam- 4:4:pa- 5:4:na- 5:4:ro | 3:4:Cam- 4:4:pa- 5:4:na- 5:4:ro |
    5:2:Dor- 6:2:_ 5:2:mi 4:2:_ 3:4:tu 1:4:_ |
    5:2:Dor- 6:2:_ 5:2:mi 4:2:_ 3:4:tu 1:4:_ |
    1:4:Din 5:4:don 1:8:dan | 1:4:Din 5:4:don 1:8:dan
  `, [[0, 'C']]),
  row: song('Row, Row, Row Your Boat', 'Canone anglofono · 6/8', '7otAJa3jui8', '6/8', `
    1:6:Row 1:6:row | 1:4:row 2:2:your 3:6:boat |
    3:4:Gent- 2:2:ly 3:4:down 4:2:the | 5:12:stream |
    8:2:Mer- 8:2:ri- 8:2:ly 5:2:mer- 5:2:ri- 5:2:ly |
    3:2:mer- 3:2:ri- 3:2:ly 1:2:mer- 1:2:ri- 1:2:ly |
    5:4:Life 4:2:is 3:4:but 2:2:a | 1:12:dream
  `, [[0, 'C'], [42, 'G7'], [48, 'C'], [72, 'G7'], [78, 'C'], [82, 'G7'], [84, 'C']]),
  cai: song('Cai, cai, balão', 'Canto brasiliano · Portoghese', 'dt-pWoAeIb4', '2/4', `
    0:6 5:2:Cai | 5:3:cai 4:1:ba- 3:2:lão 5:2:Cai |
    5:3:cai 4:1:ba- 3:2:lão 5:2:A- | 6:2:qui 5:2:na 4:2:mi- 3:2:nha |
    2:4:mão 0:2 2:1:Não 3:1:cai | 4:2:não 2:1:não 3:1:cai 4:2:não 2:1:não 3:1:cai |
    4:4:não 5:2:Cai 6:2:na | 5:2:ru- 4:2:a 3:2:do 2:2:sa- | 1:4:bão 0:4
  `, [[0, 'C'], [28, 'G7'], [52, 'F'], [60, 'G7'], [64, 'C']]),
  bahia: song('Na Bahia tem', 'Canto brasiliano · Portoghese', 'KsE8odQS_w4', '2/4', `
    1:2:Na 1:2:Ba- 3:2:hi- 3:2:a | 5:8:tem |
    4:4:tem 3:4:tem | 2:8:tem |
    6:2:Na 6:2:Ba- 7:2:hi- 6:2:a | 5:1:tem 5:2:ô 3:1:bai- 1:2:a- 1:2:na |
    3:2:co- 3:2:co 2:2:de 2:2:vin- | 1:8:tém
  `, [[0, 'C'], [24, 'G7'], [32, 'F'], [38, 'G7'], [40, 'C'], [52, 'G7'], [56, 'C']]),
  epo: song('Epo i tai tai e', 'Canto māori · Riduzione didattica', 'KfzfUOo1m2M', '4/4', `
    1:2:E- 1:4:po 1:2:i 1:4:tai 2:4:tai | 3:12:e 2:4:O |
    1:2:e- 1:4:po 2:2:i 1:4:tai 1:4:tai | 1:16:e |
    1:2:E- 1:4:po 1:2:i 1:4:tai 2:4:tai |
    3:2:e- 3:4:po 2:2:i 3:2:tu- 2:2:ki 1:2:tu- 3:2:ki |
    2:2:E- 2:4:po 1:2:i 2:2:tu- 1:2:ki 1:2:tu- 2:2:ki | 1:16:e
  `, [[0, 'C'], [32, 'F'], [48, 'C'], [96, 'Dm'], [104, 'G7'], [112, 'C']]),
  hei: song('Hei tama tū tama', 'Gioco cantato māori · Riduzione didattica', 'JUffkW0w__g', '4/4', `
    0:4 3:4:Ka 2:4:ta- 3:4:hi | 1:4:Hei 1:3:ta- 1:1:ma 1:4:tū 1:2:ta- 1:2:ma |
    1:4:_ 3:4:Ka 2:4:ru- 3:4:a | 1:4:Hei 1:3:ta- 1:1:ma 1:4:tū 1:2:ta- 1:2:ma |
    1:4:_ 3:4:Ka 2:4:to- 3:4:ru | 1:4:Hei 1:3:ta- 1:1:ma 1:4:tū 1:2:ta- 1:2:ma |
    1:4:Hei 1:3:ta- 1:1:ma 1:4:tū 1:3:ta- 1:1:ma | 1:4:Hei 1:3:ta- 1:1:ma 1:4:tū 1:2:ta- 1:2:ma | 1:16:_
  `, [[0, 'C']]),
  peixe: song('Peixe Vivo', 'Cantiga popolare brasiliana · Portoghese', 'a6rT0x4ZSj4', '2/4', `
    0:4 3:2:Co- 5:2:mo | 5:2:po- 4:2:de 4:2:o 6:2:pei- | 6:2:xe 5:2:vi- 3:2:vo 5:2:vi- |
    5:2:ver 4:2:fo- 2:2:ra 4:2:da | 4:2:á- 3:2:gua 3:2:fri- 5:2:a |
    5:2:Co- 4:2:mo 4:2:po- 6:2:de | 6:2:o 5:2:pei- 3:2:xe 5:2:vi- |
    5:2:vo 4:2:vi- 2:2:ver 3:2:fo- | 1:4:ra 0:2 1:1:da 1:1:á- |
    6:3:gua 7:1:fri- 8:3:a 7:1:_ | 6:2:_ 5:2:_ 0:2 1:1:Co- 1:1:mo |
    6:3:po- 7:1:de- 8:3:rei 7:1:_ | 6:2:vi- 5:2:ver 3:2:_ 5:2:_ |
    5:2:Co- 4:2:mo 4:2:po- 6:2:de- | 6:2:rei 5:2:vi- 3:2:ver 5:2:_ |
    5:2:Sem 4:2:a 2:2:tu- 4:2:a | 4:2:sem 3:2:a 3:2:tu- 5:2:a |
    5:2:sem 4:2:a 4:2:tu- 6:2:a | 6:2:com- 5:2:pa- 3:2:nhi- 5:2:a |
    5:2:_ 4:2:_ 2:2:_ 3:2:_ | 1:4:_ 0:2 1:1:Sem 1:1:a |
    6:3:tu- 7:1:a 8:3:_ 7:1:_ | 6:2:_ 5:2:_ 0:2 1:1:sem 1:1:a |
    6:3:tu- 7:1:a 8:3:_ 7:1:_ | 6:2:sem 5:2:a 3:2:tu- 5:2:a |
    5:2:com- 4:2:pa- 4:2:nhi- 6:2:a | 6:2:_ 5:2:_ 3:2:_ 5:2:_ |
    5:2:_ 4:2:_ 2:2:_ 4:2:_ | 4:2:_ 3:2:_ 3:2:_ 5:2:_ |
    5:2:_ 4:2:_ 4:2:_ 6:2:_ | 6:2:_ 5:2:_ 3:2:_ 5:2:_ |
    5:2:_ 4:2:_ 2:2:_ 3:2:_ | 1:8:_
  `, [[0, 'C'], [8, 'F'], [16, 'C'], [24, 'G7'], [32, 'F'], [36, 'C'], [40, 'F'],
    [48, 'C'], [56, 'G7'], [64, 'C'], [72, 'F'], [82, 'C'], [88, 'F'], [98, 'C'],
    [104, 'F'], [112, 'C'], [120, 'G7'], [128, 'F'], [132, 'C'], [136, 'F'], [144, 'C'],
    [152, 'G7'], [160, 'C'], [168, 'F'], [178, 'C'], [184, 'F'], [194, 'C'], [200, 'F'],
    [208, 'C'], [216, 'G7'], [224, 'F'], [228, 'C'], [232, 'F'], [240, 'C'], [248, 'G7'], [256, 'C']]),
};
