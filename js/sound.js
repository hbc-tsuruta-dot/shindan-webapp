// 効果音モジュール（Web Audio API）
let _actx, _master;
function _ac(){
  if(!_actx){
    _actx   = new (window.AudioContext || window.webkitAudioContext)();
    _master = _actx.createGain(); _master.gain.value = .82; _master.connect(_actx.destination);
  }
  if(_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function _bell(freq, start, dur, vol, type='sine'){
  const a=_ac(), t=a.currentTime+start;
  const o=a.createOscillator(), g=a.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(vol,t+.008);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(_master);
  o.start(t); o.stop(t+dur+.02);
}

function _click(freq, start, dur, vol){
  const a=_ac(), t=a.currentTime+start;
  const o=a.createOscillator(), g=a.createGain(), f=a.createBiquadFilter();
  o.type='square'; o.frequency.value=freq;
  f.type='bandpass'; f.frequency.value=freq; f.Q.value=2;
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(f); f.connect(g); g.connect(_master);
  o.start(t); o.stop(t+dur+.01);
}

function _noise(start, dur, vol){
  const a=_ac(), t=a.currentTime+start;
  const buf=a.createBuffer(1,a.sampleRate*dur,a.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
  const src=a.createBufferSource(), g=a.createGain(), f=a.createBiquadFilter();
  f.type='lowpass'; f.frequency.value=300;
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.buffer=buf; src.connect(f); f.connect(g); g.connect(_master);
  src.start(t); src.stop(t+dur+.01);
}

const Sound = {

  // ABCD選択：ぴこっぴこう（電子ダブルブリップ）
  select(){
    try{
      _bell(2637, 0,    .045, .20, 'triangle');
      _bell(2093, .062, .060, .16, 'triangle');
    }catch(e){}
  },

  // 次へ：ぴろりろりん（3音上昇チャイム）
  next(){
    try{
      _bell(880,  0,    .10, .17, 'triangle');
      _bell(1175, .08,  .10, .17, 'triangle');
      _bell(1760, .16,  .28, .19, 'triangle');
    }catch(e){}
  },

  // 戻る：ピーン（高音ピン）
  back(){
    try{
      _bell(2637, 0,    .38, .15, 'sine');
      _bell(2093, .008, .07, .07, 'triangle');
    }catch(e){}
  },

  // 中断：ブブベッ（低音ブザー）
  abort(){
    try{
      _bell(80,   0,    .12, .38, 'sawtooth');
      _bell(65,   .10,  .12, .32, 'sawtooth');
      _bell(98,   .20,  .08, .26, 'sawtooth');
      _noise(.22, .07, .22);
    }catch(e){}
  },

  // 言語/種別切り替え：ピロリン（明るい2音上昇）
  toggle(){
    try{
      _bell(1319, 0,   .09, .19, 'triangle');
      _bell(2093, .07, .18, .22, 'triangle');
    }catch(e){}
  },

  // テスト開始：ピロリドリー（4音楽しいファンファーレ）
  start(){
    try{
      _bell(659,  0,    .10, .17, 'triangle');
      _bell(880,  .08,  .10, .18, 'triangle');
      _bell(1319, .16,  .10, .18, 'triangle');
      _bell(2093, .24,  .50, .22, 'triangle');
    }catch(e){}
  },

  // 送信完了：5音成功チャイム
  submit(){
    try{
      _bell(659,  0,    .12, .18);
      _bell(880,  .10,  .14, .18);
      _bell(1175, .21,  .15, .18);
      _bell(1568, .33,  .18, .17);
      _bell(2093, .46,  .65, .16);
    }catch(e){}
  },
};

// ── BGM プレイリスト（魔王魂 フリーBGM） ──
const _bgmTracks = [
  { file:'sounds/maou_bgm_healing17.mp3',  label:'ヒーリング17' },
  { file:'sounds/maou_bgm_healing16.mp3',  label:'ヒーリング16' },
  { file:'sounds/maou_bgm_healing10.mp3',  label:'ヒーリング10' },
  { file:'sounds/maou_bgm_acoustic54.mp3', label:'アコースティック' },
  { file:'sounds/dova_morning.mp3',         label:'Morning' },
  { file:'sounds/dova_pastel.mp3',          label:'パステルハウス' },
  { file:'sounds/dova_noraneko.mp3',        label:'野良猫は宇宙を目指した' },
];
let _bgmAudio = null;
let _bgmIndex = -1;
let _bgmVolume = 0.005;
let _bgmFading = false;
let _bgmPreloadAudio = null;
let _bgmPreloadIdx = -1;
const _BGM_FADE_OUT = 2.5; // 曲終了前フェードアウト開始 (秒)
const _BGM_FADE_STEP = 50;  // フェード更新間隔 (ms)

function _bgmNextRandom(){
  if(_bgmTracks.length <= 1) return 0;
  var next;
  do { next = Math.floor(Math.random() * _bgmTracks.length); }
  while(next === _bgmIndex);
  return next;
}

function _bgmFadeIn(audio, targetVol){
  audio.volume = 0;
  var steps = Math.round(1500 / _BGM_FADE_STEP);
  var step = 0;
  var iv = setInterval(function(){
    step++;
    audio.volume = Math.min(targetVol, targetVol * (step / steps));
    if(step >= steps){ audio.volume = targetVol; clearInterval(iv); }
  }, _BGM_FADE_STEP);
}

function _bgmPlay(idx){
  _bgmFading = false;
  _bgmIndex = idx;
  var audio;
  var alreadyPlaying = false;
  if(_bgmPreloadAudio && _bgmPreloadIdx === idx){
    audio = _bgmPreloadAudio;
    _bgmPreloadAudio = null;
    _bgmPreloadIdx = -1;
    alreadyPlaying = true;
  } else {
    if(_bgmAudio){ _bgmAudio.pause(); _bgmAudio = null; }
    audio = new Audio(_bgmTracks[idx].file);
    audio.loop = false;
    audio.volume = 0;
  }
  _bgmAudio = audio;

  audio.addEventListener('timeupdate', function(){
    if(_bgmFading) return;
    var rem = audio.duration - audio.currentTime;
    if(!isNaN(rem) && rem > 0 && rem <= _BGM_FADE_OUT){
      _bgmFading = true;
      var startVol = audio.volume;
      var steps = Math.round((rem * 1000) / _BGM_FADE_STEP);
      if(steps < 1) steps = 1;
      var step = 0;
      var iv = setInterval(function(){
        step++;
        audio.volume = Math.max(0, startVol * (1 - step / steps));
        if(step >= steps){ clearInterval(iv); }
      }, _BGM_FADE_STEP);
    }
  });

  audio.addEventListener('ended', function(){
    _bgmAudio = null;
    var next = _bgmNextRandom();
    _bgmIndex = next;
    var nextAudio = new Audio(_bgmTracks[next].file);
    nextAudio.loop = false;
    _bgmAudio = nextAudio;
    _bgmFading = false;
    _bgmPlay(next);
    var btn = typeof document !== 'undefined' && document.getElementById('bgm-btn');
    if(btn) btn.title = _bgmTracks[next].label;
  });

  if(alreadyPlaying){
    _bgmFadeIn(audio, _bgmVolume);
  } else {
    audio.play().then(function(){ _bgmFadeIn(audio, _bgmVolume); }).catch(function(){});
  }
  localStorage.setItem('bgm_index', idx);
}

function _bgmStop(){
  _bgmFading = false;
  if(_bgmAudio){ _bgmAudio.pause(); _bgmAudio = null; }
  _bgmIndex = -1;
  localStorage.removeItem('bgm_index');
}

function _bgmStart(idx, vol){
  if(vol !== undefined) _bgmVolume = vol;
  if(isNaN(idx) || idx < 0 || idx >= _bgmTracks.length) idx = Math.floor(Math.random() * _bgmTracks.length);
  _bgmPlay(idx);
}

function _bgmSetVolume(vol){
  _bgmVolume = vol;
  if(_bgmAudio) _bgmAudio.volume = vol;
}

function _bgmResume(){
  var saved = localStorage.getItem('bgm_index');
  if(saved !== null) _bgmPlay(parseInt(saved, 10));
}

Sound.bgmPreload = function(idx){
  if(isNaN(idx)||idx<0||idx>=_bgmTracks.length) idx=Math.floor(Math.random()*_bgmTracks.length);
  if(_bgmPreloadAudio){ _bgmPreloadAudio.pause(); _bgmPreloadAudio = null; }
  _bgmPreloadIdx = idx;
  var audio = new Audio(_bgmTracks[idx].file);
  audio.loop = false;
  audio.volume = 0;
  _bgmPreloadAudio = audio;
  audio.play().catch(function(){});
};
Sound.bgmStart     = _bgmStart;
Sound.bgmStop      = _bgmStop;
Sound.bgmResume    = _bgmResume;
Sound.bgmSetVolume = _bgmSetVolume;
Sound.bgmIsOn      = () => _bgmIndex >= 0;
Sound.bgmLabel     = () => _bgmIndex >= 0 ? _bgmTracks[_bgmIndex].label : null;

if (typeof module !== 'undefined') { module.exports = { Sound }; }
