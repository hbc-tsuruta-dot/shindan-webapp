// ============================================================
// 採点エンジン（作業者／管理者 デュアル対応）
//   軸スコア＝能力の高さ（0〜100に正規化）
//   フラグ  ＝危険信号の数と強さ（加算・上限あり→割合で判定）
//   1回答に複数フラグ＋混合valence。強度1〜3。
// ============================================================

// ---- 軸セット ----
const AXES_WORKER  = ['誠実','受容','責任感','協調','報連相','安全','規範','感情安定','組織協調','流出防止','重要工程責任'];
const AXES_MANAGER = ['誠実','受容','責任感','協調','報連相','安全','規範','感情安定','統率力','組織協調','流出防止','生産性','環境整備','チームワーク','育成力','判断力','公平性'];

// ---- フラグセット ----
const FLAGS_WORKER  = ['独断','逸脱','隠蔽','安全軽視','怨恨','衝動','他責','仮面度','自己中心','過信','重要工程軽視'];
const FLAGS_MANAGER = ['独断','隠蔽','安全軽視','怨恨','衝動','他責','仮面度','自己中心','過信','パワハラ','手柄横取り','責任転嫁','保身','優柔不断','非協調'];

// ---- フラグ上限（この値で割って0〜1の充填率にする）----
const FLAG_MAX = {
  独断:10, 逸脱:10, 隠蔽:10, 安全軽視:8, 怨恨:8, 衝動:8, 他責:10, 仮面度:12, 自己中心:10, 過信:10, 重要工程軽視:6,
  パワハラ:12, 手柄横取り:8, 責任転嫁:10, 保身:12, 優柔不断:10, 非協調:8,
};

function getAxes(type){ return type === 'manager' ? AXES_MANAGER : AXES_WORKER; }
function getFlags(type){ return type === 'manager' ? FLAGS_MANAGER : FLAGS_WORKER; }

// ============================================================
function calculateScores(answers, questions, type){
  type = (type === 'manager') ? 'manager' : 'worker';
  const AXES  = getAxes(type);
  const FLAGS = getFlags(type);

  const rawAxis = {}, axisCnt = {}, rawFlags = {};
  AXES.forEach(a => { rawAxis[a] = 0; axisCnt[a] = 0; });
  FLAGS.forEach(f => rawFlags[f] = 0);

  Object.entries(answers).forEach(([qIdx, label]) => {
    if (label === 'timeout') {
      if (rawAxis['判断力']  !== undefined) rawAxis['判断力']  -= 3;
      if (rawFlags['優柔不断'] !== undefined) rawFlags['優柔不断'] += 3;
      if (rawFlags['逸脱']    !== undefined) rawFlags['逸脱']    += 1;
      return;
    }
    const q = questions[parseInt(qIdx)];
    if (!q) return;
    const opt = q.options.find(o => o.label === label);
    if (!opt) return;
    if (opt.scores) Object.entries(opt.scores).forEach(([ax, v]) => {
      if (rawAxis[ax] !== undefined) { rawAxis[ax] += v; axisCnt[ax]++; }
    });
    if (opt.flags) Object.entries(opt.flags).forEach(([fl, v]) => {
      if (rawFlags[fl] !== undefined) rawFlags[fl] += v;
    });
  });

  // 軸：-3〜+3/問 を 0〜100 に正規化（未出題の軸は中立50）
  const axisScores = {};
  AXES.forEach(a => {
    const maxPossible = (axisCnt[a] || 1) * 3;
    const n = Math.round((rawAxis[a] + maxPossible) / (2 * maxPossible) * 100);
    axisScores[a] = Math.max(0, Math.min(100, n));
  });

  // フラグ：上限でクランプ＋充填率(0〜1)
  const flags = {}, flagPct = {};
  FLAGS.forEach(f => {
    const cap = FLAG_MAX[f] || 6;
    flags[f]   = Math.max(0, Math.min(cap, rawFlags[f]));
    flagPct[f] = Math.min(1, rawFlags[f] / cap);
  });

  const totalFlags = Object.values(flags).reduce((s,v) => s+v, 0);
  const riskScore  = Object.values(flagPct).reduce((s,v) => s+v, 0); // 0〜フラグ数
  const masking    = Math.round((flagPct['仮面度'] || 0) * 100);

  const riskPatterns = (type === 'manager')
    ? detectPatternsManager(axisScores, flagPct)
    : detectPatternsWorker(axisScores, flagPct);

  const suitability = (type === 'manager')
    ? calcAptitudeManager(axisScores, flagPct, riskPatterns)
    : calcSuitabilityWorker(axisScores);

  const verdict = calcVerdict(type, axisScores, riskScore, riskPatterns);

  return { type, axisScores, flags, flagPct, totalFlags, riskScore, masking, riskPatterns, suitability, verdict };
}

// ---- 作業者：リスクパターン ----
function detectPatternsWorker(s, fp){
  const p = [];
  if (fp['独断']>=0.4 && s['規範']<60)                 p.push('独断専行型');
  if (fp['安全軽視']>=0.3 || s['安全']<55)             p.push('安全軽視型');
  if (fp['隠蔽']>=0.35 && s['誠実']<70)                p.push('情報隠蔽型');
  if (fp['逸脱']>=0.35 && s['規範']<60)                p.push('逸脱行動型');
  if (fp['怨恨']>=0.35 && s['感情安定']<60)            p.push('怨恨蓄積型');
  if (fp['衝動']>=0.35 && s['感情安定']<60)            p.push('衝動行動型');
  if (fp['他責']>=0.35 && s['責任感']<60)              p.push('他責転嫁型');
  if (fp['仮面度']>=0.4 && s['誠実']<70)               p.push('仮面優等生型');
  if (fp['自己中心']>=0.4)                             p.push('自己中心型');
  if (fp['過信']>=0.4)                                 p.push('過信・慢心型');
  if (s['協調']<55 && s['組織協調']<55)                p.push('孤立型');
  if (fp['重要工程軽視']>=0.4 || s['重要工程責任']<55) p.push('重要工程不適');
  if (fp['仮面度']>=0.4 && fp['逸脱']>=0.25)           p.push('表面的服従型');
  return p;
}

// ---- 管理者：リスクパターン ----
function detectPatternsManager(s, fp){
  const p = [];
  // ワンマン型（裸の王様）：高能力 × 低チームワーク × 過信
  if ((s['判断力']>=70 || s['生産性']>=70 || s['統率力']>=70) && s['チームワーク']<50 && (fp['独断']>=0.3 || fp['自己中心']>=0.3 || fp['過信']>=0.3))
                                                       p.push('ワンマン型（裸の王様）');
  if (fp['過信']>=0.4)                                 p.push('過信・慢心型');
  if (fp['パワハラ']>=0.3)                             p.push('パワハラ型');
  if (fp['手柄横取り']>=0.35)                          p.push('手柄横取り型');
  if (fp['責任転嫁']>=0.35 && s['責任感']<65)          p.push('責任転嫁型');
  if (fp['保身']>=0.35)                                p.push('保身・事なかれ型');
  if (fp['優柔不断']>=0.4 && s['判断力']<55)           p.push('優柔不断型');
  if (s['チームワーク']<50)                            p.push('チームワーク不足');
  if (s['生産性']>=70 && s['環境整備']<50)             p.push('生産性偏重型');
  if (s['環境整備']>=70 && s['生産性']<50)             p.push('人情偏重型');
  if (fp['仮面度']>=0.4 && s['誠実']<70)               p.push('仮面リーダー型');
  if (fp['非協調']>=0.35)                              p.push('非協調型');
  return p;
}

// ---- 作業者：重要工程適任者 ----
function calcSuitabilityWorker(s){
  if (s['安全']<55 || s['流出防止']<55) return '✕ 非適任';
  const cond = [ s['流出防止']>=70, s['安全']>=65, s['誠実']>=65, s['規範']>=65, s['感情安定']>=60, s['重要工程責任']>=65 ];
  const passed = cond.filter(Boolean).length;
  if (passed >= 6) return '◎ 適任';
  if (passed >= 4) return '○ 条件付き';
  return '△ 要観察';
}

// ---- 管理者：管理者適性（チームワークがゲート）----
function calcAptitudeManager(s, fp, patterns){
  if (s['チームワーク'] < 45) return '✕ 不適（協調性）';
  if (patterns.includes('ワンマン型（裸の王様）') || patterns.includes('パワハラ型')) return '✕ 要警戒';
  const cond = [ s['責任感']>=65, s['チームワーク']>=60, s['公平性']>=60, s['判断力']>=58, s['生産性']>=55, s['環境整備']>=55, s['育成力']>=55 ];
  const passed = cond.filter(Boolean).length;
  if (passed >= 7) return '◎ 適任';
  if (passed >= 5) return '○ 候補';
  return '△ 要育成';
}

// ---- 総合判定（A〜D）----
function calcVerdict(type, s, riskScore, patterns){
  const vals = Object.values(s);
  const avg = Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
  const HIGH = (type === 'manager')
    ? ['ワンマン型（裸の王様）','パワハラ型','保身・事なかれ型','責任転嫁型']
    : ['安全軽視型','情報隠蔽型','重要工程不適','衝動行動型','怨恨蓄積型'];
  const hasHighRisk = patterns.some(p => HIGH.includes(p));

  if (hasHighRisk || riskScore >= 3.0 || avg < 45) return 'D（要面談）';
  if (riskScore >= 1.8 || avg < 58)                return 'C（要注意）';
  if (avg >= 72 && riskScore <= 1.0)               return 'A（優秀）';
  return 'B（良好）';
}

if (typeof module !== 'undefined') {
  module.exports = { calculateScores, getAxes, getFlags, AXES_WORKER, AXES_MANAGER, FLAGS_WORKER, FLAGS_MANAGER, FLAG_MAX };
}
