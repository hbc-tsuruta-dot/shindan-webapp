// ================================================================
// 仮データ注入スクリプト（50件）
// seed.html から開くか、ブラウザコンソールで直接実行
// ================================================================
(function(){
  const W_AXES=['誠実','受容','責任感','協調','報連相','安全','規範','感情安定','組織協調','流出防止','重要工程責任'];
  const M_AXES=['誠実','受容','責任感','協調','報連相','安全','規範','感情安定','統率力','組織協調','流出防止','生産性','環境整備','チームワーク','育成力','判断力','公平性'];
  const W_FLAGS=['独断','逸脱','隠蔽','安全軽視','怨恨','衝動','他責','仮面度','自己中心','過信','重要工程軽視'];
  const M_FLAGS=['独断','隠蔽','安全軽視','怨恨','衝動','他責','仮面度','自己中心','過信','パワハラ','手柄横取り','責任転嫁','保身','優柔不断','非協調'];
  const FLAG_MAX={独断:10,逸脱:10,隠蔽:10,安全軽視:8,怨恨:8,衝動:8,他責:10,仮面度:12,
    自己中心:10,過信:10,重要工程軽視:6,パワハラ:12,手柄横取り:8,責任転嫁:10,保身:12,優柔不断:10,非協調:8};

  // 固定シード乱数（xorshift32）
  let _s=123456789;
  function rng(){_s^=_s<<13;_s^=_s>>17;_s^=_s<<5;return(_s>>>0)/4294967295;}
  function ri(a,b){return a+Math.floor(rng()*(b-a+1));}

  // グレード別パラメータ：[軸スコア基準, 振れ幅, フラグ基準, フラグ振れ幅]
  const GRADE={
    A:{ab:83,as:8, fb:0,fs:0},
    B:{ab:68,as:9, fb:1,fs:1},
    C:{ab:54,as:8, fb:2,fs:2},
    D:{ab:40,as:9, fb:4,fs:2}
  };

  const WPAT={
    C:['安全軽視型','他責転嫁型','独断専行型','孤立型'],
    D:['情報隠蔽型','安全軽視型','重要工程不適','衝動行動型','怨恨蓄積型','逸脱行動型']
  };
  const MPAT={
    C:['保身・事なかれ型','チームワーク不足','優柔不断型'],
    D:['ワンマン型（裸の王様）','パワハラ型','責任転嫁型','仮面リーダー型']
  };

  function makeRecord([name,dept,type,grade,mesid,date],i){
    const g=GRADE[grade];
    const axes=type==='worker'?W_AXES:M_AXES;
    const fl=type==='worker'?W_FLAGS:M_FLAGS;

    const axisScores={};
    axes.forEach(a=>axisScores[a]=Math.max(0,Math.min(100,ri(g.ab-g.as,g.ab+g.as))));

    const flags={},flagPct={};
    fl.forEach(f=>{
      const cap=FLAG_MAX[f]||6;
      const val=Math.max(0,Math.min(cap,ri(Math.max(0,g.fb-g.fs),Math.min(cap,g.fb+g.fs))));
      flags[f]=val; flagPct[f]=parseFloat((val/cap).toFixed(2));
    });

    const riskScore=parseFloat(Object.values(flagPct).reduce((a,b)=>a+b,0).toFixed(2));
    const totalFlags=Object.values(flags).reduce((a,b)=>a+b,0);
    const masking=Math.round((flagPct['仮面度']||0)*100);

    const pool=(type==='worker'?WPAT:MPAT)[grade]||[];
    const cnt=grade==='D'?ri(2,3):grade==='C'?ri(1,2):0;
    const riskPatterns=[...pool].sort(()=>rng()-0.5).slice(0,cnt);

    const suit={worker:{A:'◎ 適任',B:'○ 条件付き',C:'△ 要観察',D:'✕ 非適任'},
                manager:{A:'◎ 適任',B:'○ 候補',C:'△ 要育成',D:'✕ 要警戒'}};
    const verd={A:'A（優秀）',B:'B（良好）',C:'C（要注意）',D:'D（要面談）'};

    return {
      id:'R'+(1714000000000+i*90000000),
      name,dept,type,mesid,date,
      duration:ri(420,840),
      axisScores,flags,flagPct,
      totalFlags,riskScore,masking,riskPatterns,
      suitability:suit[type][grade],
      verdict:verd[grade],
      demo:true
    };
  }

  const PEOPLE=[
    // Workers A (10)
    ['田中 浩二',       '製造ライン',       'worker','A','0001','2026-04-07'],
    ['鈴木 健太',       '製造ライン',       'worker','A','0002','2026-04-09'],
    ['Nguyễn Văn An',  '製造ライン',       'worker','A','0003','2026-04-11'],
    ['佐藤 誠',         '物流業務',         'worker','A','0004','2026-04-14'],
    ['Trần Thị Bình',  '物流業務',         'worker','A','0005','2026-04-16'],
    ['山田 正',         '製造ライン',       'worker','A','0006','2026-04-18'],
    ['Lê Minh Cường',  '製造ライン',       'worker','A','0007','2026-04-21'],
    ['中村 拓也',       '製造ライン',       'worker','A','0008','2026-04-23'],
    ['Phạm Văn Dũng',  '物流業務',         'worker','A','0009','2026-04-25'],
    ['小林 裕也',       '製造ライン',       'worker','A','0010','2026-04-28'],
    // Workers B (14)
    ['加藤 洋',         '製造ライン',       'worker','B','0011','2026-04-30'],
    ['Hoàng Thị Em',   '物流業務',         'worker','B','0012','2026-05-02'],
    ['吉田 達也',       '製造ライン',       'worker','B','0013','2026-05-05'],
    ['Vũ Văn Phong',   '製造ライン',       'worker','B','0014','2026-05-07'],
    ['山本 純',         '物流業務',         'worker','B','0015','2026-05-09'],
    ['Đặng Minh Giang','製造ライン',       'worker','B','0016','2026-05-12'],
    ['渡辺 靖',         '製造ライン',       'worker','B','0017','2026-05-14'],
    ['Bùi Thị Hoa',    '物流業務',         'worker','B','0018','2026-05-16'],
    ['伊藤 健',         '製造ライン',       'worker','B','0019','2026-05-19'],
    ['Đỗ Văn Inh',     '製造ライン',       'worker','B','0020','2026-05-21'],
    ['高橋 明',         '物流業務',         'worker','B','0021','2026-05-23'],
    ['Nguyễn Thị Kim', '製造ライン',       'worker','B','0022','2026-05-26'],
    ['斎藤 博',         '製造ライン',       'worker','B','0023','2026-05-28'],
    ['Lê Văn Long',    '物流業務',         'worker','B','0024','2026-05-30'],
    // Workers C (9)
    ['松本 剛',         '製造ライン',       'worker','C','0025','2026-06-02'],
    ['Phạm Thị Mai',   '物流業務',         'worker','C','0026','2026-06-03'],
    ['井上 昇',         '製造ライン',       'worker','C','0027','2026-06-04'],
    ['Trần Văn Nam',   '製造ライン',       'worker','C','0028','2026-06-05'],
    ['木村 智',         '物流業務',         'worker','C','0029','2026-06-06'],
    ['Nguyễn Thị Oanh','製造ライン',      'worker','C','0030','2026-06-07'],
    ['林 秀樹',         '製造ライン',       'worker','C','0031','2026-06-08'],
    ['Hoàng Văn Phú',  '物流業務',         'worker','C','0032','2026-06-09'],
    ['清水 浩',         '製造ライン',       'worker','C','0033','2026-06-10'],
    // Workers D (4)
    ['山崎 隆',         '製造ライン',       'worker','D','0034','2026-06-10'],
    ['Vũ Thị Quỳnh',   '物流業務',         'worker','D','0035','2026-06-11'],
    ['中島 直',         '製造ライン',       'worker','D','0036','2026-06-11'],
    ['Đặng Văn Rồng',  '製造ライン',       'worker','D','0037','2026-06-12'],
    // Managers A (3)
    ['橋本 孝雄',       '管理者・リーダー', 'manager','A','0038','2026-04-10'],
    ['藤田 裕子',       '管理者・リーダー', 'manager','A','0039','2026-04-24'],
    ['Nguyễn Văn Vinh','管理者・リーダー', 'manager','A','0040','2026-05-06'],
    // Managers B (4)
    ['西村 主任',       '管理者・リーダー', 'manager','B','0041','2026-05-08'],
    ['石川 健一',       '管理者・リーダー', 'manager','B','0042','2026-05-13'],
    ['Trần Minh Xuân', '管理者・リーダー', 'manager','B','0043','2026-05-20'],
    ['松田 雄介',       '管理者・リーダー', 'manager','B','0044','2026-05-27'],
    // Managers C (3)
    ['小川 康弘',       '管理者・リーダー', 'manager','C','0045','2026-06-03'],
    ['Lê Thị Yến',     '管理者・リーダー', 'manager','C','0046','2026-06-06'],
    ['村上 進',         '管理者・リーダー', 'manager','C','0047','2026-06-09'],
    // Managers D (3)
    ['Phạm Văn Zung',  '管理者・リーダー', 'manager','D','0048','2026-06-10'],
    ['長谷川 博',       '管理者・リーダー', 'manager','D','0049','2026-06-11'],
    ['坂田 哲也',       '管理者・リーダー', 'manager','D','0050','2026-06-12'],
  ];
  // 合計: 10+14+9+4+3+4+3+3 = 50件

  const records=PEOPLE.map((p,i)=>makeRecord(p,i));
  localStorage.setItem('shindan_results',JSON.stringify(records));

  // 社員名簿（shindan_employees）も同時に登録
  const empList=PEOPLE
    .filter(p=>p[4]!=='なし')
    .map(p=>({id:p[4], name:p[0]}));
  localStorage.setItem('shindan_employees',JSON.stringify(empList));

  return records.length;
})();
