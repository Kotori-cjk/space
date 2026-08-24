/* ===== 14-Day Plan Data ===== */
const PLAN = [
  {
    day:1, title:'排序与分治开场', goal:'把"模板"和"统计贡献"分清楚',
    problems:[
      {id:'P1177',name:'【模板】排序',desc:'先用 sort 过一遍，再手写快排/归并至少一种',mustReview:false},
      {id:'P1908',name:'逆序对',desc:'重点体会"答案在 merge 时产生"',mustReview:true}
    ],
    reflections:['快排和归并，你更顺手哪个？','逆序对里 res += mid - i + 1 为什么成立？']
  },
  {
    day:2, title:'二分与边界感', goal:'不再把二分写成玄学',
    problems:[
      {id:'P2249',name:'查找',desc:'练左边界、右边界',mustReview:true}
    ],
    reflections:['我找的是"值"还是"分界线"？','为什么 l=mid 时要上取中？']
  },
  {
    day:3, title:'高精度', goal:'训练"把手算竖式翻译成代码"',
    problems:[
      {id:'P1601',name:'A+B Problem（高精）',desc:'高精度加法',mustReview:false},
      {id:'P2142',name:'高精度减法',desc:'高精度减法',mustReview:false},
      {id:'P1303',name:'A*B Problem',desc:'高精度乘法（余力补充）',mustReview:false,optional:true}
    ],
    reflections:['低位在前存储为什么方便？','减法里借位变量到底表示什么？']
  },
  {
    day:4, title:'前缀和 / 差分', goal:'区分"频繁查询"和"频繁修改"',
    problems:[
      {id:'P3397',name:'地毯',desc:'二维差分标准题',mustReview:true}
    ],
    reflections:['前缀和与差分分别适合哪类题？','二维差分为什么是"加减减加"？']
  },
  {
    day:5, title:'单调栈 / 滑动窗口', goal:'开始培养"维护结构"的手感',
    problems:[
      {id:'P5788',name:'【模板】单调栈',desc:'右边第一个更大元素',mustReview:false},
      {id:'P1886',name:'滑动窗口 / 单调队列',desc:'最经典窗口最值',mustReview:true}
    ],
    reflections:['队列里为什么存"下标"而不是"值"？','被弹掉的元素为什么永远不可能再成为答案？']
  },
  {
    day:6, title:'KMP 与 Trie', goal:'进入"字符串结构化处理"',
    problems:[
      {id:'P3375',name:'【模板】KMP',desc:'KMP 模板',mustReview:true},
      {id:'P2580',name:'于是他错误的点名开始了',desc:'Trie 入门',mustReview:false}
    ],
    reflections:['next 数组的含义是什么？','Trie 的每个节点到底在表示什么？']
  },
  {
    day:7, title:'并查集 + 基础图搜索', goal:'进入图论，先拿最稳的两把刀',
    problems:[
      {id:'P3367',name:'【模板】并查集',desc:'并查集模板',mustReview:false},
      {id:'P1746',name:'离开中山路',desc:'网格 BFS',mustReview:false}
    ],
    reflections:['并查集的 find 为什么要路径压缩？','BFS 为什么天然适合无权最短路？']
  },
  {
    day:8, title:'DFS / 回溯', goal:'练"搜索树"和剪枝意识',
    problems:[
      {id:'P1219',name:'八皇后 / N皇后',desc:'回溯专题核心题',mustReview:false}
    ],
    reflections:['这一题的状态有哪些？','哪些判断是在"进入递归前"做的？']
  },
  {
    day:9, title:'拓扑排序 + 最短路', goal:'建立图论的"模型识别"能力',
    problems:[
      {id:'P1113',name:'杂务',desc:'拓扑排序 + DP',mustReview:false},
      {id:'P4779',name:'单源最短路径（标准版）',desc:'堆优化 Dijkstra',mustReview:true}
    ],
    reflections:['拓扑排序里入度数组在维护什么？','Dijkstra 为什么不能处理负边？']
  },
  {
    day:10, title:'快速幂 + 线性筛', goal:'数论先抓最高频、最常考的两类',
    problems:[
      {id:'P1226',name:'【模板】快速幂',desc:'快速幂模板',mustReview:false},
      {id:'P3383',name:'线性筛素数',desc:'线性筛模板',mustReview:false}
    ],
    reflections:['快速幂为什么能把指数复杂度降下来？','线性筛为什么每个合数只会被"最小质因子"筛掉一次？']
  },
  {
    day:11, title:'扩欧 / 同余 + 01背包', goal:'从数论切到 DP，开始练"状态定义"',
    problems:[
      {id:'P1082',name:'【模板】同余方程',desc:'扩展欧几里得',mustReview:false},
      {id:'P1048',name:'采药',desc:'01 背包标准入门',mustReview:true}
    ],
    reflections:['扩欧求出来的 x, y 满足什么式子？','01 背包里 f[j] 的定义是什么？']
  },
  {
    day:12, title:'完全背包 + 线性DP', goal:'分清"倒序枚举"和"正序枚举"',
    problems:[
      {id:'P1616',name:'疯狂的采药',desc:'完全背包',mustReview:false},
      {id:'P1216',name:'数字三角形',desc:'线性 DP 经典题',mustReview:false}
    ],
    reflections:['为什么完全背包内层循环要正序？','数字三角形的边界怎么处理最稳？']
  },
  {
    day:13, title:'最大子段和 + 贪心开场', goal:'感受"DP"和"贪心"是两种不同的世界观',
    problems:[
      {id:'P1115',name:'最大子段和',desc:'经典 DP',mustReview:false},
      {id:'P1090',name:'合并果子',desc:'堆贪心 / Huffman 原型',mustReview:true}
    ],
    reflections:['最大子段和里"以 i 结尾"的含义是什么？','合并果子为什么每次合并最小两堆是最优的？']
  },
  {
    day:14, title:'区间贪心收束', goal:'给这两周画上"考试可用"的句号',
    problems:[
      {id:'P1803',name:'凌乱的 yyy / 线段覆盖',desc:'最大不相交区间',mustReview:false},
      {id:'P2240',name:'部分背包问题',desc:'单位价值排序的贪心',mustReview:false}
    ],
    reflections:['区间类题什么时候按右端点排序？','部分背包为什么能贪，01 背包为什么不能？']
  }
];

const REVIEW_TOTAL = PLAN.flatMap(d => d.problems).filter(p => p.mustReview).length;
const BAILIAN_SECTIONS = [
  {title:'结构体排序 / STL / 容器', desc:'目标：前中段快速拿分，10 到 15 分钟写出稳定代码。', problems:[['4016','班级排名'],['4043','GPA排名系统'],['4044','小白鼠再排队'],['4085','数组去重排序'],['3729','用set实现字符串的排序和查找'],['4090','超级备忘录'],['4093','倒排索引查询'],['4078','实现堆结构']]},
  {title:'二分', desc:'目标：边界不慌，check 清晰，更新方向稳定。', problems:[['1064','网线主管'],['4037','聪明的质监员'],['4134','查找最接近的元素'],['4135','月度开销'],['4142','二分法求函数的零点'],['3372','Telephone Wire']]},
  {title:'搜索：BFS / DFS / 状态搜索', desc:'目标：稳住判重、层数、边界和多组数据清空。', problems:[['3726','仙岛求药'],['3752','走迷宫'],['4001','抓住那头牛'],['4105','拯救公主'],['4115','鸣人和佐助'],['4116','拯救行动'],['4127','迷宫问题'],['4129','变换的迷宫'],['3859','Lake Counting'],['4123','马走日']]},
  {title:'递归 / 回溯 / 剪枝', desc:'目标：训练搜索树意识、撤销时机和剪枝质量。', problems:[['4070','全排列'],['4147','汉诺塔问题'],['1190','生日蛋糕'],['1321','棋盘问题'],['1084','正方形破坏者']]},
  {title:'DP', desc:'目标：状态定义清楚，边界和转移顺序稳定。', problems:[['1088','滑雪'],['1159','Palindrome'],['3262','新数字三角形'],['1185','炮兵阵地'],['1661','帮助 Jimmy'],['4118','开餐馆'],['4131','Charm Bracelet'],['4122','切割回文'],['4121','股票买卖']]},
  {title:'贪心', desc:'目标：先排序、再扫描、局部决策，建立最常用的贪心直觉。', problems:[['1017','装箱问题'],['1065','Wooden Sticks'],['1083','Moving Tables'],['4034','选择客栈'],['4144','畜栏保留问题'],['4151','电影节'],['4137','最小新整数'],['1328','Radar Installation']]},
  {title:'单调栈 / 单调结构', desc:'目标：把“下标、弹栈条件、答案结算”练成固定动作。', problems:[['2559','Largest Rectangle in a Histogram'],['4074','积水量'],['2019','Cornfields'],['2766','最大子矩阵']]},
  {title:'二阶段 · 贪心', desc:'继续补“排序后扫描”“区间选择”“局部决策”这类机考高频题。', phase:'二阶段', prefix:'B2', problems:[['1094','Sorting It All Out'],['2299','Ultra-QuickSort'],['2993','区间'],['2996','选课'],['3181','Pizza schedule']]},
  {title:'二阶段 · DP', desc:'强调线性 DP、背包、序列型 DP，补足机考后段的状态定义能力。', phase:'二阶段', prefix:'B2', problems:[['1163','The Triangle'],['1170','Shopping Offers'],['2726','采药'],['2727','还是采药问题'],['2755','神奇的口袋'],['2760','数字三角形'],['2773','采药'],['4149','课程大作业']]},
  {title:'二阶段 · 搜索：BFS / DFS / 状态搜索', desc:'第二批更偏迷宫、图搜索和“模型识别”，适合混合训练。', phase:'二阶段', prefix:'B2', problems:[['1103','Maze'],['1522','N-Credible Mazes'],['1858','Interesting Maze Game'],['2157','Maze'],['2644','Maze'],['2790','迷宫'],['3435','Borg Maze'],['4063','DFS spanning tree']]},
  {title:'二阶段 · 二分', desc:'继续打边界感和判定函数，避免二分在考场里变成情绪崩点。', phase:'二阶段', prefix:'B2', problems:[['1757','Binary Search'],['2774','木材加工'],['2388','寻找中位数'],['4145','放弃考试']]},
  {title:'二阶段 · 结构体排序 / STL', desc:'更适合作为第二轮补池：多关键字排序、队列和基础结构维护。', phase:'二阶段', prefix:'B2', problems:[['2752','字符串数组排序问题'],['2915','字符串排序'],['2998','日志排序'],['3245','空调排名'],['3672','比赛排名'],['3702','距离排序'],['4084','拓扑排序'],['3861','Queue']]},
  {title:'二阶段 · 单调栈 / 单调结构', desc:'补强“下标、弹栈、窗口、候选维护”的稳定性。', phase:'二阶段', prefix:'B2', problems:[['4077','出栈序列统计'],['2469',"Stack 'em Up"],['2259','Team Queue'],['2482','Stars in Your Window']]},
  {title:'二阶段 · 字符串 / 实现补强', desc:'这组更偏机考真题味道，适合拿来练读题、实现和调试节奏。', phase:'二阶段', prefix:'B2', problems:[['1200','Crazy Search'],['1501','Word-Search Wonder'],['1674','Sorting by Swapping'],['2050','Searching the Web'],['2406','字符串乘方'],['2743','字符串判等'],['4007','计算字符串距离'],['4042','Rabin-Karp字符串匹配'],['4073','最长公共字符串后缀']]}
].map(section => ({
  ...section,
  phase: section.phase || '一阶段',
  problems: section.problems.map(([id, name]) => ({ id: `${section.prefix || 'B'}${id}`, rawId: id, name, phase: section.phase || '一阶段', url: `http://bailian.openjudge.cn/practice/${id}/` }))
}));
const BAILIAN_TOTAL = BAILIAN_SECTIONS.reduce((sum, section) => sum + section.problems.length, 0);
const STORAGE_KEY = 'kotori-luogu-v1';
const EMOJIS = ['✿','❀','🌸','⭐','💫','🎀','🦋','🌙'];

/* ===== State ===== */
let state = {
  currentDay: 1,
  currentTab: 'plan',
  progress: {},
  notes: {},
  wrongNotes: {},
  journals: {},
  customProblems: {},
  starred: {},
  starNotes: {},
  thinkNotes: [],
  bailianProgress: {},
  bailianWrongNotes: {},
  bailianReflections: {},
  bailianStarred: {},
  collapsedCards: {},
  openSections: {},
  settings: {
    obsidianVault: 'Obsidian Vault',
    obsidianFolder: '',
    githubRepo: '',
    musicIds: [],
    backgrounds: [],
    currentBg: -1
  }
};

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) { console.warn('Save failed', e); }
}
function load() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
      const parsed = JSON.parse(d);
      state = {...state, ...parsed, settings: {...state.settings, ...(parsed.settings||{})}};
      if (!state.customProblems) state.customProblems = {};
      if (!state.starred) state.starred = {};
      if (!state.starNotes) state.starNotes = {};
      if (!state.thinkNotes) state.thinkNotes = [];
      if (!state.bailianProgress) state.bailianProgress = {};
      if (!state.bailianWrongNotes) state.bailianWrongNotes = {};
      if (!state.bailianReflections) state.bailianReflections = {};
      if (!state.bailianStarred) state.bailianStarred = {};
      if (!state.collapsedCards) state.collapsedCards = {};
      if (!state.openSections) state.openSections = {};
    }
  } catch(e) { console.warn('Load failed', e); }
}

/* ===== Dynamic problem list (built-in + custom) ===== */
function getAllProblems() {
  const builtIn = PLAN.flatMap(d => d.problems.map(p => ({...p, day: d.day})));
  const custom = [];
  for (const [day, probs] of Object.entries(state.customProblems)) {
    probs.forEach(p => custom.push({...p, day: +day, isCustom: true}));
  }
  return [...builtIn, ...custom];
}
function getTotal() { return getAllProblems().length; }

/* ===== Particles ===== */
function initParticles() {
  const c = document.getElementById('particles');
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.textContent = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
    p.style.left = Math.random()*100 + '%';
    p.style.animationDelay = Math.random()*6 + 's';
    p.style.animationDuration = (5 + Math.random()*4) + 's';
    c.appendChild(p);
  }
}

/* ===== Markdown & Image Helpers ===== */
function renderMarkdown(text) {
  if (!text) return '';
  if (typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true, gfm: true });
    return marked.parse(text);
  }
  return escHtml(text).replace(/\n/g, '<br>');
}

function compressImage(file, maxWidth, quality) {
  maxWidth = maxWidth || 800;
  quality = quality || 0.7;
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function insertImageAtCursor(ta, dataUrl) {
  const pos = ta.selectionStart || ta.value.length;
  const before = ta.value.substring(0, pos);
  const after = ta.value.substring(ta.selectionEnd || pos);
  ta.value = before + (before.endsWith('\n')||!before ? '' : '\n') + `![image](${dataUrl})\n` + after;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ===== Progress Helpers ===== */
function getStatus(pid) { return (state.progress[pid] || {}).status || 'not_started'; }
function setStatus(pid, s) {
  if (!state.progress[pid]) state.progress[pid] = {};
  state.progress[pid].status = s;
  save(); renderAll();
}

function getCompleted() { return getAllProblems().filter(p => getStatus(p.id)==='completed').length; }
function getWrong() { return getAllProblems().filter(p => getStatus(p.id)==='wrong').length; }
function getReviewed() { return getAllProblems().filter(p => p.mustReview && getStatus(p.id)==='completed').length; }

function getDayStatus(day) {
  const builtIn = PLAN[day-1].problems;
  const custom = state.customProblems[day] || [];
  const all = [...builtIn, ...custom];
  if (!all.length) return 'pending';
  const statuses = all.map(p => getStatus(p.id));
  if (statuses.every(s => s==='completed')) return 'done';
  if (statuses.some(s => s!=='not_started')) return 'partial';
  return 'pending';
}

function toggleStar(pid) {
  state.starred[pid] = !state.starred[pid];
  if (!state.starred[pid]) delete state.starred[pid];
  save(); renderAll();
}

function getBailianStatus(pid) { return (state.bailianProgress[pid] || {}).status || 'not_started'; }
function setBailianStatus(pid, s) {
  if (!state.bailianProgress[pid]) state.bailianProgress[pid] = {};
  state.bailianProgress[pid].status = s;
  save(); renderBailian();
}
function toggleBailianStar(pid) {
  state.bailianStarred[pid] = !state.bailianStarred[pid];
  if (!state.bailianStarred[pid]) delete state.bailianStarred[pid];
  save(); renderBailian();
}

function isSectionOpen(id) {
  return !!(state.openSections && state.openSections[id]);
}

function setSectionOpen(id, isOpen) {
  if (!state.openSections) state.openSections = {};
  state.openSections[id] = isOpen;
  if (!isOpen) delete state.openSections[id];
  save();
}

function isCardCollapsed(key) {
  return !!(state.collapsedCards && state.collapsedCards[key]);
}

function toggleCardCollapsed(key, renderFn) {
  if (!state.collapsedCards) state.collapsedCards = {};
  state.collapsedCards[key] = !state.collapsedCards[key];
  if (!state.collapsedCards[key]) delete state.collapsedCards[key];
  save();
  renderFn();
}

/* ===== Render ===== */
function renderAll() {
  syncActiveTab();
  renderProgress();
  renderDayNav();
  renderTabContent();
}

function syncActiveTab() {
  const activeTab = document.querySelector(`.tab[data-tab="${state.currentTab}"]`) || document.querySelector('.tab[data-tab="plan"]');
  const activeContent = document.getElementById('tab-' + (activeTab?.dataset.tab || 'plan'));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === activeTab));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.toggle('active', t === activeContent));
}

function renderProgress() {
  const done = getCompleted();
  const total = getTotal();
  const pct = total ? Math.round(done/total*100) : 0;
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (pct/100) * circumference;

  document.getElementById('progress-ring').style.strokeDashoffset = offset;
  document.getElementById('progress-percent').textContent = pct + '%';
  document.getElementById('progress-count').textContent = done + '/' + total;
  document.getElementById('stat-completed').textContent = '✅ ' + done + ' 完成';
  document.getElementById('stat-wrong').textContent = '❌ ' + getWrong() + ' 错题';
  document.getElementById('stat-review').textContent = '⭐ ' + getReviewed() + '/' + REVIEW_TOTAL + ' 二刷';
}

function renderDayNav() {
  const nav = document.getElementById('day-nav');
  nav.innerHTML = PLAN.map(d => {
    const ds = getDayStatus(d.day);
    const icon = ds==='done' ? '✅' : ds==='partial' ? '🔶' : '';
    const active = d.day===state.currentDay ? ' active' : '';
    return `<button class="day-btn${active}" data-day="${d.day}">
      <span class="day-num">Day ${d.day}</span>
      <span class="day-label">${d.title.substring(0,5)}</span>
      <span class="day-status">${icon}</span>
    </button>`;
  }).join('');
}

function renderTabContent() {
  if (state.currentTab==='plan') renderPlan();
  else if (state.currentTab==='wrong') renderWrongNotebook();
  else if (state.currentTab==='journal') renderJournal();
  else if (state.currentTab==='star') renderStarred();
  else if (state.currentTab==='think') renderThinkSpace();
  else if (state.currentTab==='bailian') renderBailian();
}

/* ===== Plan Tab ===== */
function renderPlan() {
  const d = PLAN[state.currentDay-1];
  const dayNum = state.currentDay;

  let html = `<div class="day-header">
    <h2>Day ${d.day}：${d.title}</h2>
    <p class="day-goal">目标：${d.goal}</p>
  </div>`;

  d.problems.forEach(p => { html += renderProblemCard(p, dayNum, false); });

  const customs = state.customProblems[dayNum] || [];
  customs.forEach(p => { html += renderProblemCard(p, dayNum, true); });

  html += `<div class="add-problem-section">
    <h4>➕ 添加额外题目</h4>
    <div class="add-problem-row">
      <input type="text" id="add-pid" placeholder="题号 (如 P1234)">
      <input type="text" id="add-pname" placeholder="题目名称 (选填)">
      <button class="btn btn-orange btn-sm" id="add-problem-btn">添加</button>
    </div>
  </div>`;

  if (d.reflections.length) {
    html += `<div class="reflections"><h3>🤔 做完后思考</h3>`;
    d.reflections.forEach(r => {
      html += `<div class="reflection-item"><span class="icon">💡</span><span>${r}</span></div>`;
    });
    html += `</div>`;
  }

  document.getElementById('tab-plan').innerHTML = html;
}

function renderProblemCard(p, dayNum, isCustom) {
  const luoguUrl = id => `https://www.luogu.com.cn/problem/${id}`;
  const s = getStatus(p.id);
  const note = state.notes[p.id] || '';
  const wn = state.wrongNotes[p.id] || {};
  const isStarred = !!state.starred[p.id];
  const noteOpen = isSectionOpen(`note-${p.id}`);
  const wrongOpen = isSectionOpen(`wrong-${p.id}`);
  const badges = [];
  if (p.mustReview) badges.push('<span class="badge badge-review">⭐ 需二刷</span>');
  if (p.optional) badges.push('<span class="badge badge-optional">选做</span>');
  if (isCustom) badges.push('<span class="badge badge-custom">自定义</span>');

  const deleteBtn = isCustom
    ? `<button class="custom-problem-delete" data-del-pid="${p.id}" data-del-day="${dayNum}" title="删除此题">✕</button>`
    : '';

  return `<div class="problem-card status-${s}" data-pid="${p.id}">
    <div class="problem-top">
      <div class="problem-info">
        <span class="problem-id"><a href="${luoguUrl(p.id)}" target="_blank">${p.id}</a></span>
        <span class="problem-name">${escHtml(p.name || '')}</span>
        ${badges.join(' ')}
        ${deleteBtn}
      </div>
      <div class="status-selector">
        ${statusBtn(p.id,'not_started','⬜ 未开始',s)}
        ${statusBtn(p.id,'in_progress','🔄 进行中',s)}
        ${statusBtn(p.id,'completed','✅ 完成',s)}
        ${statusBtn(p.id,'wrong','❌ 做错',s)}
      </div>
    </div>
    ${p.desc ? `<div class="problem-desc">${escHtml(p.desc)}</div>` : ''}
    <div class="problem-actions">
      <button class="star-toggle${isStarred?' starred':''}" data-star="${p.id}">${isStarred?'⭐ 重点':'☆ 标记重点'}</button>
      <button class="expand-toggle${noteOpen?' open':''}" data-target="note-${p.id}">📝 笔记${note?' (有内容)':''}</button>
      <button class="expand-toggle${wrongOpen?' open':''}" data-target="wrong-${p.id}">📕 错题记录</button>
    </div>
    <div class="expandable${noteOpen?' open':''}" id="note-${p.id}">
      <div class="note-area">
        ${note ? `<div class="note-collapsed-preview" data-note-expand="${p.id}">${renderMarkdown(note)}</div>` : ''}
        <div class="note-edit-area" id="note-edit-${p.id}" style="${note?'display:none':''}">
          <div class="note-toolbar">
            <button class="note-tool-btn" data-note-preview="${p.id}">👁 预览</button>
            <label class="note-tool-btn">📷 贴图<input type="file" accept="image/*" data-note-img="${p.id}"></label>
          </div>
          <textarea placeholder="支持 Markdown 语法，可直接粘贴图片..." data-note="${p.id}">${escHtml(note)}</textarea>
          <div class="note-preview" id="note-preview-${p.id}" style="display:none"></div>
        </div>
      </div>
    </div>
    <div class="expandable${wrongOpen?' open':''}" id="wrong-${p.id}">
      <div class="wrong-area">
        <label>错误原因</label>
        <textarea placeholder="第一次做错在哪里？" data-wrong-error="${p.id}">${escHtml(wn.error||'')}</textarea>
        <label>正确思路</label>
        <textarea placeholder="正解的核心是什么？" data-wrong-correct="${p.id}">${escHtml(wn.correct||'')}</textarea>
        <label>关键词 / 题型标签</label>
        <textarea placeholder="下次看到什么关键词要想到它？" data-wrong-keywords="${p.id}" style="min-height:40px">${escHtml(wn.keywords||'')}</textarea>
      </div>
    </div>
  </div>`;
}

function statusBtn(pid, val, label, current) {
  const cls = current===val ? ` active-${val}` : '';
  return `<button class="status-btn${cls}" data-pid="${pid}" data-status="${val}">${label}</button>`;
}

/* ===== Wrong Notebook Tab ===== */
function renderWrongNotebook() {
  const wrongs = getAllProblems().filter(p => getStatus(p.id)==='wrong');
  const bailianWrongs = BAILIAN_SECTIONS.flatMap(section => (
    section.problems
      .filter(p => getBailianStatus(p.id)==='wrong')
      .map(p => ({...p, sectionTitle: section.title}))
  ));
  const el = document.getElementById('tab-wrong');

  if (!wrongs.length && !bailianWrongs.length) {
    el.innerHTML = `<div class="wrong-notebook-empty">
      <div class="big-icon">📖</div>
      <p>暂无错题记录~</p>
      <p style="font-size:13px;margin-top:4px;">把做错的题标记为 ❌，它就会出现在这里</p>
    </div>`;
    return;
  }

  let html = `<div class="day-header" style="border-left-color:var(--danger)">
    <h2>📕 错题本</h2>
    <p class="day-goal">共 ${wrongs.length} 道错题，加油复盘！</p>
  </div>`;

  html += `<div class="wrong-source-summary">
    <span>洛谷错题：${wrongs.length}</span>
    <span>百炼错题：${bailianWrongs.length}</span>
  </div>`;

  wrongs.forEach(p => {
    const wn = state.wrongNotes[p.id] || {};
    const cardKey = `wrong-${p.id}`;
    const collapsed = isCardCollapsed(cardKey);
    html += `<div class="wrong-entry collapsible-card${collapsed ? ' collapsed' : ''}">
      <div class="wrong-entry-header">
        <span class="wrong-entry-id"><a href="https://www.luogu.com.cn/problem/${p.id}" target="_blank">${p.id} ${escHtml(p.name||'')}</a></span>
        <div class="card-header-actions">
          <span class="wrong-entry-day">Day ${p.day}${p.isCustom?' (自定义)':''}</span>
          <button class="card-fold-btn" data-fold-card="${cardKey}" data-fold-render="wrong">${collapsed ? '展开' : '折叠'}</button>
        </div>
      </div>
      <div class="collapsible-card-body">
      ${wrongDetail('错误原因', wn.error)}
      ${wrongDetail('正确思路', wn.correct)}
      ${wrongDetail('关键词', wn.keywords)}
      <button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="setStatus('${p.id}','completed')">✅ 已复盘，标记完成</button>
      </div>
    </div>`;
  });

  bailianWrongs.forEach(p => {
    const wn = state.bailianWrongNotes[p.id] || {};
    const reflection = state.bailianReflections[p.id] || '';
    const cardKey = `wrong-bailian-${p.id}`;
    const collapsed = isCardCollapsed(cardKey);
    html += `<div class="wrong-entry bailian-wrong-entry collapsible-card${collapsed ? ' collapsed' : ''}">
      <div class="wrong-entry-header">
        <span class="wrong-entry-id"><a href="${p.url}" target="_blank">百炼 ${p.rawId} ${escHtml(p.name||'')}</a></span>
        <div class="card-header-actions">
          <span class="wrong-entry-day">${escHtml(p.sectionTitle)}</span>
          <button class="card-fold-btn" data-fold-card="${cardKey}" data-fold-render="wrong">${collapsed ? '展开' : '折叠'}</button>
        </div>
      </div>
      <div class="collapsible-card-body">
      ${wrongDetail('错误原因', wn.error)}
      ${wrongDetail('正确思路', wn.correct)}
      ${wrongDetail('关键词', wn.keywords)}
      ${wrongDetail('反思总结', reflection)}
      <button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="setBailianStatus('${p.id}','completed')">✅ 已复盘，标记完成</button>
      </div>
    </div>`;
  });

  el.innerHTML = html;
}

function wrongDetail(label, content) {
  if (!content) return '';
  return `<div class="wrong-detail">
    <div class="wrong-detail-label">${label}</div>
    <div class="wrong-detail-content">${escHtml(content)}</div>
  </div>`;
}

/* ===== Star / 思维新方法 Tab ===== */
function renderStarred() {
  const el = document.getElementById('tab-star');
  const starred = getAllProblems().filter(p => state.starred[p.id]);

  if (!starred.length) {
    el.innerHTML = `<div class="star-empty">
      <div class="big-icon">💡</div>
      <p>还没有标记重点题目~</p>
      <p style="font-size:13px;margin-top:4px;">在每日计划中点击 ☆ 标记重点题目，它就会出现在这里</p>
    </div>`;
    return;
  }

  let html = `<div class="day-header" style="border-left-color:var(--warm)">
    <h2>💡 思维新方法</h2>
    <p class="day-goal">共 ${starred.length} 道重点题目，记录它们带给你的新思路</p>
  </div>`;

  starred.forEach(p => {
    const sn = state.starNotes[p.id] || '';
    const note = state.notes[p.id] || '';
    const cardKey = `star-${p.id}`;
    const collapsed = isCardCollapsed(cardKey);

    html += `<div class="star-entry collapsible-card${collapsed ? ' collapsed' : ''}">
      <div class="star-entry-header">
        <span class="star-entry-id"><a href="https://www.luogu.com.cn/problem/${p.id}" target="_blank">${p.id} ${escHtml(p.name||'')}</a></span>
        <div class="card-header-actions">
          <span class="star-entry-day">Day ${p.day}</span>
          <button class="card-fold-btn" data-fold-card="${cardKey}" data-fold-render="star">${collapsed ? '展开' : '折叠'}</button>
        </div>
      </div>
      <div class="collapsible-card-body">
      <div class="star-note-section">
        <h4>💡 新方法 / 新思路</h4>
        <div class="note-toolbar">
          <button class="note-tool-btn" data-star-preview="${p.id}">👁 预览</button>
          <label class="note-tool-btn">📷 贴图<input type="file" accept="image/*" data-star-img="${p.id}"></label>
        </div>
        <textarea class="star-note-textarea" placeholder="记录这道题带给你的新思维、新方法..." data-star-note="${p.id}">${escHtml(sn)}</textarea>
        <div class="note-preview" id="star-preview-${p.id}" style="display:none"></div>
      </div>
      ${note ? `<div class="star-regular-note">
        <h4>📝 题目笔记</h4>
        <div class="note-preview">${renderMarkdown(note)}</div>
      </div>` : ''}
      </div>
    </div>`;
  });

  el.innerHTML = html;
}

/* ===== Think Space Tab ===== */
function renderThinkSpace() {
  const el = document.getElementById('tab-think');
  const entries = state.thinkNotes || [];

  // Ensure each entry has a stable id (migrate old entries)
  let needSave = false;
  entries.forEach(e => { if (!e.id) { e.id = 'th_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); needSave = true; } });
  if (needSave) save();

  let html = `<div class="think-input-area">
    <h4>🧠 记录通用思考 / 易错点</h4>
    <input type="text" id="think-title-input" class="think-title-input" placeholder="标题（如：二分边界易错、DP 状态设计通则）...">
    <div class="note-toolbar">
      <button class="note-tool-btn" id="think-preview-btn">👁 预览</button>
      <label class="note-tool-btn">📷 贴图<input type="file" accept="image/*" id="think-img-input"></label>
    </div>
    <textarea id="think-textarea" class="star-note-textarea" placeholder="支持 Markdown，记录具有一般性的思考、易错之处..."></textarea>
    <div class="note-preview" id="think-preview" style="display:none"></div>
    <div style="margin-top:8px">
      <button class="btn btn-primary btn-sm" id="think-submit-btn">发布</button>
      <button class="btn btn-secondary btn-sm hidden" id="think-cancel-edit-btn">取消编辑</button>
    </div>
  </div>`;

  // Catalog
  if (entries.length) {
    html += `<div class="catalog-card">
      <div class="catalog-header" id="think-catalog-toggle">
        <h4>📑 思考目录 (${entries.length})</h4>
        <span class="catalog-caret">▼</span>
      </div>
      <div class="catalog-body" id="think-catalog-body">
        <input type="text" class="catalog-search" id="think-catalog-search" placeholder="搜索标题...">`;
    entries.slice().reverse().forEach(e => {
      const t = e.title || e.content?.substring(0,20) || '无标题';
      html += `<a class="catalog-entry" data-think-scroll="${e.id}">→ ${escHtml(t)}</a>`;
    });
    html += `</div></div>`;
  }

  if (!entries.length) {
    html += `<div class="wrong-notebook-empty"><div class="big-icon">🧠</div><p>还没有记录~</p>
      <p style="font-size:13px;margin-top:4px;">记录跨题目的通用思考和易错点</p></div>`;
  }

  entries.slice().reverse().forEach((e, ri) => {
    const idx = entries.length - 1 - ri;
    const cardKey = `think-${e.id}`;
    const collapsed = isCardCollapsed(cardKey);
    html += `<div class="think-entry collapsible-card${collapsed ? ' collapsed' : ''}" id="think-anchor-${e.id}">
      <div class="think-entry-head">
        <div>
          ${e.title ? `<div class="think-entry-title">${escHtml(e.title)}</div>` : ''}
          <div class="think-entry-time">${e.time || ''}${e.updatedAt ? ` · 更新于 ${e.updatedAt}` : ''}</div>
        </div>
        <div class="card-header-actions">
          <button class="card-fold-btn" data-think-edit="${idx}">编辑</button>
          <button class="card-fold-btn" data-fold-card="${cardKey}" data-fold-render="think">${collapsed ? '展开' : '折叠'}</button>
        </div>
      </div>
      <div class="collapsible-card-body">
      <div class="think-entry-body">${renderMarkdown(e.content)}</div>
      </div>
      <button class="think-entry-delete" data-think-del="${idx}">✕</button>
    </div>`;
  });

  el.innerHTML = html;
}

/* ===== Journal Tab ===== */
function renderJournal() {
  const el = document.getElementById('tab-journal');
  let html = '';

  for (let i = 1; i <= 14; i++) {
    const entries = state.journals[i] || [];
    const isActive = i === state.currentDay;
    html += `<div class="journal-day${isActive?' active-day':''}">
      <div class="journal-day-title">💭 Day ${i}：${PLAN[i-1].title}</div>
      <div class="journal-entries">`;

    if (entries.length) {
      entries.forEach((e, idx) => {
        const cardKey = `journal-${i}-${idx}`;
        const collapsed = isCardCollapsed(cardKey);
        html += `<div class="journal-entry collapsible-card${collapsed ? ' collapsed' : ''}">
          <div class="journal-entry-head">
            <div class="journal-entry-date">${e.date}${e.updatedAt ? ` · 更新于 ${e.updatedAt}` : ''}</div>
          <div class="card-header-actions">
            <button class="card-fold-btn" data-journal-edit="${i}:${idx}">编辑</button>
            <button class="card-fold-btn" data-fold-card="${cardKey}" data-fold-render="journal">${collapsed ? '展开' : '折叠'}</button>
          </div>
          </div>
          <div class="collapsible-card-body">
          <div class="journal-entry-content">${renderMarkdown(e.content)}</div>
          </div>
          <button class="journal-entry-delete" data-day="${i}" data-idx="${idx}" title="删除">✕</button>
        </div>`;
      });
    }

    html += `</div>
      <div class="journal-input-wrap">
        <div class="note-toolbar">
          <label class="note-tool-btn">📷 贴图<input type="file" accept="image/*" data-journal-img="${i}"></label>
        </div>
        <div class="journal-input-row">
          <textarea placeholder="记录今天的感想、心情、收获…支持 Markdown 和粘贴图片" data-journal-ta="${i}" id="journal-input-${i}"></textarea>
          <button class="btn btn-primary btn-sm" data-journal-add="${i}">发送</button>
          <button class="btn btn-secondary btn-sm hidden" data-journal-cancel="${i}">取消编辑</button>
        </div>
      </div>
    </div>`;
  }

  el.innerHTML = html;
}

/* ===== Bailian Tab ===== */
function renderBailian() {
  const el = document.getElementById('tab-bailian');
  const done = BAILIAN_SECTIONS.flatMap(s => s.problems).filter(p => getBailianStatus(p.id)==='completed').length;
  const wrong = BAILIAN_SECTIONS.flatMap(s => s.problems).filter(p => getBailianStatus(p.id)==='wrong').length;
  const starred = Object.keys(state.bailianStarred || {}).length;

  let html = `<div class="bailian-board">
    <div class="bailian-embed-head">
      <div>
        <h2>🔥 百炼成钢</h2>
        <p>百炼机考训练题单。每题都支持完成状态、重点标记、错题记录和反思总结。</p>
      </div>
      <div class="bailian-header-actions">
        <a class="btn btn-secondary btn-sm" href="bailian_hub.html" target="_blank" rel="noreferrer">????</a>
        <a class="btn btn-secondary btn-sm" href="bailian_dp_greedy_notes.html" target="_blank" rel="noreferrer">DP / ????</a>
        <a class="btn btn-secondary btn-sm" href="zhuanshuer_2024_links.html" target="_blank" rel="noreferrer">2024 ??</a>
        <a class="btn btn-secondary btn-sm" href="zhuanshuer_2025_links.html" target="_blank" rel="noreferrer">2025 ??</a>
        <a class="btn btn-secondary btn-sm" href="bailian_training_set.html" target="_blank" rel="noreferrer">?????</a>
        <a class="btn btn-secondary btn-sm" href="bailian_training_set_round2.html" target="_blank" rel="noreferrer">?????</a>
      </div>
    </div>
    <div class="bailian-stats">
      <span>✅ ${done}/${BAILIAN_TOTAL} 完成</span>
      <span>❌ ${wrong} 错题</span>
      <span>⭐ ${starred} 重点</span>
    </div>
    <nav class="bailian-catalog" aria-label="百炼专题目录">
      <div class="bailian-catalog-title">专题目录</div>
      <div class="bailian-catalog-list">
        ${BAILIAN_SECTIONS.map((section, index) => `
          <button class="bailian-catalog-item" data-bailian-section-scroll="${index}" type="button">
            <span>${index + 1}. ${escHtml(section.title)}</span>
            <small>${section.problems.length} 题</small>
          </button>
        `).join('')}
      </div>
    </nav>`;

  BAILIAN_SECTIONS.forEach((section, index) => {
    html += `<section class="bailian-section" id="bailian-section-${index}">
      <div class="bailian-section-head">
        <h3>${escHtml(section.title)}</h3>
        <p>${escHtml(section.desc)}</p>
      </div>
      <div class="bailian-problem-list">
        ${section.problems.map(renderBailianProblem).join('')}
      </div>
    </section>`;
  });

  el.innerHTML = html + '</div>';
}

function renderBailianProblem(p) {
  const s = getBailianStatus(p.id);
  const wn = state.bailianWrongNotes[p.id] || {};
  const reflection = state.bailianReflections[p.id] || '';
  const isStarred = !!state.bailianStarred[p.id];
  const wrongOpen = isSectionOpen(`bailian-wrong-${p.id}`);
  const reflectionOpen = isSectionOpen(`bailian-reflection-${p.id}`);
  return `<article class="problem-card bailian-problem status-${s}" data-bailian-pid="${p.id}">
    <div class="problem-top">
      <div class="problem-info">
        <span class="problem-id"><a href="${p.url}" target="_blank">${p.rawId}</a></span>
        <span class="problem-name">${escHtml(p.name)}</span>
        <span class="badge badge-custom">${escHtml(p.phase)}</span>
      </div>
      <div class="status-selector">
        ${bailianStatusBtn(p.id,'not_started','⬜ 未做',s)}
        ${bailianStatusBtn(p.id,'wrong','❌ 做错',s)}
        ${bailianStatusBtn(p.id,'completed','✅ 完成',s)}
      </div>
    </div>
    <div class="problem-actions">
      <button class="star-toggle${isStarred?' starred':''}" data-bailian-star="${p.id}">${isStarred?'⭐ 重点':'☆ 标记重点'}</button>
      <button class="expand-toggle${wrongOpen?' open':''}" data-target="bailian-wrong-${p.id}">📕 错题记录</button>
      <button class="expand-toggle${reflectionOpen?' open':''}" data-target="bailian-reflection-${p.id}">📝 反思总结${reflection?' (有内容)':''}</button>
    </div>
    <div class="expandable${wrongOpen?' open':''}" id="bailian-wrong-${p.id}">
      <div class="wrong-area">
        <label>错误原因</label>
        <textarea placeholder="这题卡在哪里？是读题、边界、模型还是实现？" data-bailian-wrong-error="${p.id}">${escHtml(wn.error||'')}</textarea>
        <label>正确思路</label>
        <textarea placeholder="正确做法的关键步骤是什么？" data-bailian-wrong-correct="${p.id}">${escHtml(wn.correct||'')}</textarea>
        <label>关键词 / 题型标签</label>
        <textarea placeholder="下次看到什么信号要想到这题？" data-bailian-wrong-keywords="${p.id}" style="min-height:40px">${escHtml(wn.keywords||'')}</textarea>
      </div>
    </div>
    <div class="expandable${reflectionOpen?' open':''}" id="bailian-reflection-${p.id}">
      <div class="note-area">
        <div class="note-toolbar">
          <button class="note-tool-btn" data-bailian-preview="${p.id}">👁 预览</button>
        </div>
        <textarea placeholder="记录这道百炼题的反思、模板、易错点和下次复习提醒。支持 Markdown。" data-bailian-reflection="${p.id}">${escHtml(reflection)}</textarea>
        <div class="note-preview" id="bailian-preview-${p.id}" style="display:none"></div>
      </div>
    </div>
  </article>`;
}

function bailianStatusBtn(pid, val, label, current) {
  const cls = current===val ? ` active-${val}` : '';
  return `<button class="status-btn${cls}" data-bailian-pid="${pid}" data-bailian-status="${val}">${label}</button>`;
}

/* ===== Music ===== */
function renderMusic() {
  const c = document.getElementById('music-container');
  const ids = state.settings.musicIds;
  if (!ids.length) {
    c.innerHTML = '<p class="empty-hint">在设置中添加网易云音乐~</p>';
    return;
  }
  c.innerHTML = ids.map(id =>
    `<iframe frameborder="no" border="0" marginwidth="0" marginheight="0"
      width="100%" height="86"
      src="https://music.163.com/outchain/player?type=2&id=${id}&auto=0&height=66"
      style="margin-bottom:6px;border-radius:8px"></iframe>`
  ).join('');
}

function renderMusicManageList() {
  const el = document.getElementById('music-manage-list');
  const ids = state.settings.musicIds;
  if (!ids.length) { el.innerHTML = '<p class="empty-hint">暂未添加音乐</p>'; return; }
  el.innerHTML = ids.map((id, i) =>
    `<div class="music-manage-item">
      <span>🎵 歌曲 ID: ${id}</span>
      <button data-music-del="${i}" title="删除">✕</button>
    </div>`
  ).join('');
}

/* ===== Background ===== */
function applyBackground() {
  const bg = document.getElementById('bg-layer');
  const idx = state.settings.currentBg;
  const bgs = state.settings.backgrounds;
  if (idx >= 0 && bgs[idx]) {
    bg.style.backgroundImage = `url(${bgs[idx]})`;
    bg.classList.add('has-bg');
  } else {
    bg.style.backgroundImage = '';
    bg.classList.remove('has-bg');
  }
}

function renderBgPreviews() {
  const el = document.getElementById('bg-preview-list');
  const bgs = state.settings.backgrounds;
  el.innerHTML = bgs.map((url, i) =>
    `<div class="bg-preview-item${state.settings.currentBg===i?' active':''}" data-bg-select="${i}">
      <img src="${url}" alt="bg ${i+1}">
      <button class="bg-preview-delete" data-bg-del="${i}">✕</button>
    </div>`
  ).join('');
}

/* ===== Settings ===== */
function openSettings() {
  document.getElementById('set-obsidian-vault').value = state.settings.obsidianVault;
  document.getElementById('set-obsidian-folder').value = state.settings.obsidianFolder;
  document.getElementById('set-github-repo').value = state.settings.githubRepo;
  renderBgPreviews();
  renderMusicManageList();
  document.getElementById('settings-modal').classList.add('open');
}
function closeSettings() {
  state.settings.obsidianVault = document.getElementById('set-obsidian-vault').value.trim() || 'Obsidian Vault';
  state.settings.obsidianFolder = document.getElementById('set-obsidian-folder').value.trim();
  state.settings.githubRepo = document.getElementById('set-github-repo').value.trim();
  save();
  updateHeaderLinks();
  document.getElementById('settings-modal').classList.remove('open');
}

function updateHeaderLinks() {
  const vault = encodeURIComponent(state.settings.obsidianVault);
  const folder = state.settings.obsidianFolder;
  const obsLink = document.getElementById('obsidian-link');
  obsLink.href = `obsidian://open?vault=${vault}${folder ? '&file='+encodeURIComponent(folder) : ''}`;

  const ghLink = document.getElementById('github-link');
  ghLink.href = state.settings.githubRepo || '#';
}

function parseMusicId(input) {
  input = input.trim();
  if (/^\d+$/.test(input)) return input;
  const m = input.match(/[?&]id=(\d+)/);
  if (m) return m[1];
  const m2 = input.match(/song\/(\d+)/);
  if (m2) return m2[1];
  return null;
}

/* ===== Custom Problems ===== */
function addCustomProblem(dayNum, pid, pname) {
  pid = pid.trim().toUpperCase();
  if (!pid) return;
  if (!state.customProblems[dayNum]) state.customProblems[dayNum] = [];
  const allIds = [...PLAN[dayNum-1].problems.map(p=>p.id), ...state.customProblems[dayNum].map(p=>p.id)];
  if (allIds.includes(pid)) { alert('该题目已存在于当天列表中'); return; }
  state.customProblems[dayNum].push({ id: pid, name: pname.trim() || '', desc: '' });
  save(); renderAll();
}

function deleteCustomProblem(dayNum, pid) {
  if (!state.customProblems[dayNum]) return;
  state.customProblems[dayNum] = state.customProblems[dayNum].filter(p => p.id !== pid);
  if (!state.customProblems[dayNum].length) delete state.customProblems[dayNum];
  delete state.progress[pid];
  delete state.notes[pid];
  delete state.wrongNotes[pid];
  delete state.starred[pid];
  delete state.starNotes[pid];
  save(); renderAll();
}

/* ===== Data Export/Import ===== */
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kotori-luogu-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      state = {...state, ...d, settings:{...state.settings,...(d.settings||{})}};
      if (!state.customProblems) state.customProblems = {};
      if (!state.starred) state.starred = {};
      if (!state.starNotes) state.starNotes = {};
      if (!state.thinkNotes) state.thinkNotes = [];
      if (!state.bailianProgress) state.bailianProgress = {};
      if (!state.bailianWrongNotes) state.bailianWrongNotes = {};
      if (!state.bailianReflections) state.bailianReflections = {};
      if (!state.bailianStarred) state.bailianStarred = {};
      if (!state.openSections) state.openSections = {};
      save();
      applyBackground();
      renderMusic();
      updateHeaderLinks();
      renderAll();
      alert('导入成功！');
    } catch(err) { alert('导入失败：文件格式不正确'); }
  };
  reader.readAsText(file);
}

/* ===== Utils ===== */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function now() {
  return new Date().toLocaleString('zh-CN', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}

let saveTimer = null;
function debounceSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 500);
}

/* ===== Note preview toggle helper ===== */
function toggleNotePreview(previewBtn, taSelector, previewId) {
  const ta = document.querySelector(taSelector);
  const preview = document.getElementById(previewId);
  if (!ta || !preview) return;
  if (preview.style.display === 'none') {
    preview.innerHTML = renderMarkdown(ta.value);
    preview.style.display = 'block';
    ta.style.display = 'none';
    previewBtn.textContent = '✏️ 编辑';
  } else {
    preview.style.display = 'none';
    ta.style.display = '';
    previewBtn.textContent = '👁 预览';
  }
}

/* ===== Event Setup ===== */
function setupEvents() {
  // Day navigation
  document.getElementById('day-nav').addEventListener('click', e => {
    const btn = e.target.closest('.day-btn');
    if (!btn) return;
    state.currentDay = +btn.dataset.day;
    save(); renderAll();
  });

  // Tabs
  document.querySelector('.tabs').addEventListener('click', e => {
    if (!e.target.classList.contains('tab')) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    const tab = e.target.dataset.tab;
    document.getElementById('tab-'+tab).classList.add('active');
    state.currentTab = tab;
    renderTabContent();
  });

  document.getElementById('main-content').addEventListener('click', e => {
    const foldBtn = e.target.closest('[data-fold-card]');
    if (!foldBtn) return;
    const renderMap = {
      wrong: renderWrongNotebook,
      star: renderStarred,
      think: renderThinkSpace,
      journal: renderJournal,
      bailian: renderBailian
    };
    toggleCardCollapsed(foldBtn.dataset.foldCard, renderMap[foldBtn.dataset.foldRender] || renderTabContent);
  });

  // ---- Plan tab: clicks ----
  document.getElementById('tab-plan').addEventListener('click', e => {
    const statusBtnEl = e.target.closest('.status-btn');
    if (statusBtnEl) { setStatus(statusBtnEl.dataset.pid, statusBtnEl.dataset.status); return; }

    const starBtn = e.target.closest('.star-toggle');
    if (starBtn) { toggleStar(starBtn.dataset.star); return; }

    const notePreviewBtn = e.target.closest('[data-note-preview]');
    if (notePreviewBtn) {
      const pid = notePreviewBtn.dataset.notePreview;
      toggleNotePreview(notePreviewBtn, `textarea[data-note="${pid}"]`, 'note-preview-'+pid);
      return;
    }

    // Click collapsed note preview to expand into editor
    const collapsed = e.target.closest('[data-note-expand]');
    if (collapsed) {
      const pid = collapsed.dataset.noteExpand;
      const editArea = document.getElementById('note-edit-' + pid);
      if (editArea) {
        collapsed.style.display = 'none';
        editArea.style.display = '';
        setSectionOpen('note-' + pid, true);
        const ta = editArea.querySelector('textarea');
        if (ta) ta.focus();
      }
      return;
    }

    const toggle = e.target.closest('.expand-toggle');
    if (toggle) {
      toggle.classList.toggle('open');
      const target = document.getElementById(toggle.dataset.target);
      if (target) {
        const isOpen = target.classList.toggle('open');
        setSectionOpen(target.id, isOpen);
      }
      return;
    }

    if (e.target.id === 'add-problem-btn' || e.target.closest('#add-problem-btn')) {
      const pid = document.getElementById('add-pid').value;
      const pname = document.getElementById('add-pname').value;
      addCustomProblem(state.currentDay, pid, pname);
      return;
    }

    const delBtn = e.target.closest('.custom-problem-delete');
    if (delBtn) {
      const pid = delBtn.dataset.delPid;
      const day = +delBtn.dataset.delDay;
      if (confirm(`确定删除题目 ${pid} 吗？`)) {
        deleteCustomProblem(day, pid);
      }
    }
  });

  // ---- Plan tab: text input (notes / wrong notes) ----
  document.getElementById('tab-plan').addEventListener('input', e => {
    const ta = e.target;
    if (ta.dataset.note) {
      state.notes[ta.dataset.note] = ta.value;
      debounceSave();
    }
    if (ta.dataset.wrongError) {
      if (!state.wrongNotes[ta.dataset.wrongError]) state.wrongNotes[ta.dataset.wrongError] = {};
      state.wrongNotes[ta.dataset.wrongError].error = ta.value;
      debounceSave();
    }
    if (ta.dataset.wrongCorrect) {
      if (!state.wrongNotes[ta.dataset.wrongCorrect]) state.wrongNotes[ta.dataset.wrongCorrect] = {};
      state.wrongNotes[ta.dataset.wrongCorrect].correct = ta.value;
      debounceSave();
    }
    if (ta.dataset.wrongKeywords) {
      if (!state.wrongNotes[ta.dataset.wrongKeywords]) state.wrongNotes[ta.dataset.wrongKeywords] = {};
      state.wrongNotes[ta.dataset.wrongKeywords].keywords = ta.value;
      debounceSave();
    }
  });

  // ---- Plan tab: Enter in add-problem input ----
  document.getElementById('tab-plan').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.target.id === 'add-pid' || e.target.id === 'add-pname')) {
      e.preventDefault();
      const pid = document.getElementById('add-pid').value;
      const pname = document.getElementById('add-pname').value;
      addCustomProblem(state.currentDay, pid, pname);
    }
  });

  // ---- Plan tab: image upload via file picker ----
  document.getElementById('tab-plan').addEventListener('change', e => {
    const imgInput = e.target.closest('[data-note-img]');
    if (imgInput && imgInput.files[0]) {
      const pid = imgInput.dataset.noteImg;
      compressImage(imgInput.files[0]).then(dataUrl => {
        const ta = document.querySelector(`textarea[data-note="${pid}"]`);
        if (ta) {
          insertImageAtCursor(ta, dataUrl);
          state.notes[pid] = ta.value;
          debounceSave();
        }
        imgInput.value = '';
      });
    }
  });

  // ---- Plan tab: image paste in note textareas ----
  document.getElementById('tab-plan').addEventListener('paste', async e => {
    const ta = e.target;
    if (!ta.matches || !ta.matches('textarea[data-note]')) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        const dataUrl = await compressImage(file);
        insertImageAtCursor(ta, dataUrl);
        state.notes[ta.dataset.note] = ta.value;
        debounceSave();
        break;
      }
    }
  });

  // ---- Bailian tab: clicks ----
  document.getElementById('tab-bailian').addEventListener('click', e => {
    const sectionLink = e.target.closest('[data-bailian-section-scroll]');
    if (sectionLink) {
      const target = document.getElementById('bailian-section-' + sectionLink.dataset.bailianSectionScroll);
      if (target) {
        target.scrollIntoView({behavior:'smooth', block:'start'});
        target.classList.remove('note-highlight');
        void target.offsetWidth;
        target.classList.add('note-highlight');
        setTimeout(() => target.classList.remove('note-highlight'), 1700);
      }
      return;
    }
    const statusBtnEl = e.target.closest('[data-bailian-status]');
    if (statusBtnEl) {
      setBailianStatus(statusBtnEl.dataset.bailianPid, statusBtnEl.dataset.bailianStatus);
      return;
    }
    const starBtn = e.target.closest('[data-bailian-star]');
    if (starBtn) {
      toggleBailianStar(starBtn.dataset.bailianStar);
      return;
    }
    const previewBtn = e.target.closest('[data-bailian-preview]');
    if (previewBtn) {
      const pid = previewBtn.dataset.bailianPreview;
      toggleNotePreview(previewBtn, `textarea[data-bailian-reflection="${pid}"]`, 'bailian-preview-'+pid);
      return;
    }
    const toggle = e.target.closest('.expand-toggle');
    if (toggle) {
      toggle.classList.toggle('open');
      const target = document.getElementById(toggle.dataset.target);
      if (target) {
        const isOpen = target.classList.toggle('open');
        setSectionOpen(target.id, isOpen);
      }
    }
  });

  // ---- Bailian tab: text input ----
  document.getElementById('tab-bailian').addEventListener('input', e => {
    const ta = e.target;
    if (ta.dataset.bailianReflection) {
      state.bailianReflections[ta.dataset.bailianReflection] = ta.value;
      debounceSave();
    }
    if (ta.dataset.bailianWrongError) {
      if (!state.bailianWrongNotes[ta.dataset.bailianWrongError]) state.bailianWrongNotes[ta.dataset.bailianWrongError] = {};
      state.bailianWrongNotes[ta.dataset.bailianWrongError].error = ta.value;
      debounceSave();
    }
    if (ta.dataset.bailianWrongCorrect) {
      if (!state.bailianWrongNotes[ta.dataset.bailianWrongCorrect]) state.bailianWrongNotes[ta.dataset.bailianWrongCorrect] = {};
      state.bailianWrongNotes[ta.dataset.bailianWrongCorrect].correct = ta.value;
      debounceSave();
    }
    if (ta.dataset.bailianWrongKeywords) {
      if (!state.bailianWrongNotes[ta.dataset.bailianWrongKeywords]) state.bailianWrongNotes[ta.dataset.bailianWrongKeywords] = {};
      state.bailianWrongNotes[ta.dataset.bailianWrongKeywords].keywords = ta.value;
      debounceSave();
    }
  });

  // ---- Star tab: text input ----
  document.getElementById('tab-star').addEventListener('input', e => {
    if (e.target.dataset.starNote) {
      state.starNotes[e.target.dataset.starNote] = e.target.value;
      debounceSave();
    }
  });

  // ---- Star tab: clicks (preview toggle) ----
  document.getElementById('tab-star').addEventListener('click', e => {
    const previewBtn = e.target.closest('[data-star-preview]');
    if (previewBtn) {
      const pid = previewBtn.dataset.starPreview;
      toggleNotePreview(previewBtn, `textarea[data-star-note="${pid}"]`, 'star-preview-'+pid);
    }
  });

  // ---- Star tab: image upload ----
  document.getElementById('tab-star').addEventListener('change', e => {
    const imgInput = e.target.closest('[data-star-img]');
    if (imgInput && imgInput.files[0]) {
      const pid = imgInput.dataset.starImg;
      compressImage(imgInput.files[0]).then(dataUrl => {
        const ta = document.querySelector(`textarea[data-star-note="${pid}"]`);
        if (ta) {
          insertImageAtCursor(ta, dataUrl);
          state.starNotes[pid] = ta.value;
          debounceSave();
        }
        imgInput.value = '';
      });
    }
  });

  // ---- Star tab: image paste ----
  document.getElementById('tab-star').addEventListener('paste', async e => {
    const ta = e.target;
    if (!ta.matches || !ta.matches('textarea[data-star-note]')) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        const dataUrl = await compressImage(file);
        insertImageAtCursor(ta, dataUrl);
        state.starNotes[ta.dataset.starNote] = ta.value;
        debounceSave();
        break;
      }
    }
  });

  // ---- Journal: add & delete ----
  document.getElementById('tab-journal').addEventListener('click', e => {
    const addBtn = e.target.closest('[data-journal-add]');
    if (addBtn) {
      const day = +addBtn.dataset.journalAdd;
      const input = document.getElementById('journal-input-'+day);
      const content = input.value.trim();
      if (!content) return;
      if (!state.journals[day]) state.journals[day] = [];
      const editingIdx = input.dataset.editingJournalIdx;
      if (editingIdx !== undefined) {
        const entry = state.journals[day][+editingIdx];
        if (entry) {
          entry.content = content;
          entry.updatedAt = now();
        }
      } else {
        state.journals[day].push({date: now(), content});
      }
      save();
      renderJournal();
      return;
    }
    const editBtn = e.target.closest('[data-journal-edit]');
    if (editBtn) {
      const [dayText, idxText] = editBtn.dataset.journalEdit.split(':');
      const day = +dayText;
      const idx = +idxText;
      const entry = state.journals[day]?.[idx];
      const input = document.getElementById('journal-input-'+day);
      const addButton = document.querySelector(`[data-journal-add="${day}"]`);
      const cancelButton = document.querySelector(`[data-journal-cancel="${day}"]`);
      if (!entry || !input) return;
      input.value = entry.content || '';
      input.dataset.editingJournalIdx = String(idx);
      if (addButton) addButton.textContent = '更新';
      if (cancelButton) cancelButton.classList.remove('hidden');
      input.scrollIntoView({behavior:'smooth', block:'center'});
      input.focus();
      return;
    }
    const cancelBtn = e.target.closest('[data-journal-cancel]');
    if (cancelBtn) {
      const day = +cancelBtn.dataset.journalCancel;
      const input = document.getElementById('journal-input-'+day);
      const addButton = document.querySelector(`[data-journal-add="${day}"]`);
      if (input) {
        input.value = '';
        delete input.dataset.editingJournalIdx;
      }
      if (addButton) addButton.textContent = '发送';
      cancelBtn.classList.add('hidden');
      return;
    }
    const delBtn = e.target.closest('.journal-entry-delete');
    if (delBtn) {
      const day = +delBtn.dataset.day;
      const idx = +delBtn.dataset.idx;
      if (state.journals[day]) {
        state.journals[day].splice(idx, 1);
        save();
        renderJournal();
      }
    }
  });

  // Journal: image upload
  document.getElementById('tab-journal').addEventListener('change', e => {
    const imgInput = e.target.closest('[data-journal-img]');
    if (imgInput && imgInput.files[0]) {
      const day = imgInput.dataset.journalImg;
      compressImage(imgInput.files[0]).then(dataUrl => {
        const ta = document.getElementById('journal-input-'+day);
        if (ta) insertImageAtCursor(ta, dataUrl);
        imgInput.value = '';
      });
    }
  });

  // Journal: image paste
  document.getElementById('tab-journal').addEventListener('paste', async e => {
    const ta = e.target;
    if (!ta.matches || !ta.matches('textarea[data-journal-ta]')) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const dataUrl = await compressImage(items[i].getAsFile());
        insertImageAtCursor(ta, dataUrl);
        break;
      }
    }
  });

  // ---- Settings ----
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeSettings());
  });
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', () => closeSettings());
  });

  // Background upload
  document.getElementById('bg-upload').addEventListener('change', e => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        state.settings.backgrounds.push(ev.target.result);
        if (state.settings.currentBg < 0) state.settings.currentBg = 0;
        save(); applyBackground(); renderBgPreviews();
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });

  // Background select & delete
  document.getElementById('bg-preview-list').addEventListener('click', e => {
    const sel = e.target.closest('[data-bg-select]');
    if (sel && !e.target.closest('.bg-preview-delete')) {
      state.settings.currentBg = +sel.dataset.bgSelect;
      save(); applyBackground(); renderBgPreviews();
      return;
    }
    const del = e.target.closest('[data-bg-del]');
    if (del) {
      const idx = +del.dataset.bgDel;
      state.settings.backgrounds.splice(idx, 1);
      if (state.settings.currentBg >= state.settings.backgrounds.length) {
        state.settings.currentBg = state.settings.backgrounds.length - 1;
      }
      save(); applyBackground(); renderBgPreviews();
    }
  });

  document.getElementById('bg-reset-btn').addEventListener('click', () => {
    state.settings.currentBg = -1;
    save(); applyBackground(); renderBgPreviews();
  });

  // Music add & delete
  document.getElementById('music-add-btn').addEventListener('click', () => {
    const input = document.getElementById('music-input');
    const id = parseMusicId(input.value);
    if (!id) { alert('请输入有效的网易云音乐链接或歌曲ID'); return; }
    state.settings.musicIds.push(id);
    save(); renderMusic(); renderMusicManageList();
    input.value = '';
  });
  document.getElementById('music-manage-list').addEventListener('click', e => {
    const del = e.target.closest('[data-music-del]');
    if (del) {
      state.settings.musicIds.splice(+del.dataset.musicDel, 1);
      save(); renderMusic(); renderMusicManageList();
    }
  });

  // Export / Import
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-file').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // ---- Think space tab ----
  document.getElementById('tab-think').addEventListener('click', e => {
    // Catalog scroll
    const scrollEntry = e.target.closest('[data-think-scroll]');
    if (scrollEntry) {
      const target = document.getElementById('think-anchor-' + scrollEntry.dataset.thinkScroll);
      if (target) {
        target.scrollIntoView({behavior:'smooth', block:'start'});
        target.classList.remove('note-highlight');
        void target.offsetWidth;
        target.classList.add('note-highlight');
        setTimeout(() => target.classList.remove('note-highlight'), 1700);
      }
      return;
    }
    // Catalog toggle
    if (e.target.closest('#think-catalog-toggle')) {
      const body = document.getElementById('think-catalog-body');
      const caret = document.querySelector('#think-catalog-toggle .catalog-caret');
      const collapsed = body.classList.toggle('collapsed');
      if (caret) caret.textContent = collapsed ? '▶' : '▼';
      return;
    }
    if (e.target.id === 'think-submit-btn') {
      const titleInput = document.getElementById('think-title-input');
      const ta = document.getElementById('think-textarea');
      const title = titleInput ? titleInput.value.trim() : '';
      const content = ta ? ta.value.trim() : '';
      if (!title && !content) return;
      if (!state.thinkNotes) state.thinkNotes = [];
      const editingIdx = titleInput?.dataset.editingThinkIdx;
      if (editingIdx !== undefined) {
        const entry = state.thinkNotes[+editingIdx];
        if (entry) {
          entry.title = title;
          entry.content = content;
          entry.updatedAt = now();
        }
      } else {
        state.thinkNotes.push({ id: 'th_'+Date.now()+'_'+Math.random().toString(36).slice(2,6), title, content, time: now() });
      }
      save(); renderThinkSpace();
      return;
    }
    if (e.target.id === 'think-cancel-edit-btn') {
      const titleInput = document.getElementById('think-title-input');
      const ta = document.getElementById('think-textarea');
      if (titleInput) {
        titleInput.value = '';
        delete titleInput.dataset.editingThinkIdx;
      }
      if (ta) ta.value = '';
      const pv = document.getElementById('think-preview');
      if (pv) { pv.style.display = 'none'; pv.innerHTML = ''; }
      const submit = document.getElementById('think-submit-btn');
      if (submit) submit.textContent = '发布';
      e.target.classList.add('hidden');
      return;
    }
    if (e.target.id === 'think-preview-btn') {
      const ta = document.getElementById('think-textarea');
      const pv = document.getElementById('think-preview');
      if (pv.style.display === 'none') {
        pv.innerHTML = renderMarkdown(ta.value); pv.style.display = 'block'; ta.style.display = 'none';
        e.target.textContent = '✏️ 编辑';
      } else {
        pv.style.display = 'none'; ta.style.display = ''; e.target.textContent = '👁 预览';
      }
      return;
    }
    const del = e.target.closest('[data-think-del]');
    if (del) {
      const idx = +del.dataset.thinkDel;
      state.thinkNotes.splice(idx, 1);
      save(); renderThinkSpace();
      return;
    }
    const edit = e.target.closest('[data-think-edit]');
    if (edit) {
      const idx = +edit.dataset.thinkEdit;
      const entry = state.thinkNotes[idx];
      if (!entry) return;
      const titleInput = document.getElementById('think-title-input');
      const ta = document.getElementById('think-textarea');
      const submit = document.getElementById('think-submit-btn');
      const cancel = document.getElementById('think-cancel-edit-btn');
      const pv = document.getElementById('think-preview');
      if (titleInput) {
        titleInput.value = entry.title || '';
        titleInput.dataset.editingThinkIdx = String(idx);
      }
      if (ta) {
        ta.value = entry.content || '';
        ta.style.display = '';
      }
      if (pv) { pv.style.display = 'none'; pv.innerHTML = ''; }
      if (submit) submit.textContent = '更新';
      if (cancel) cancel.classList.remove('hidden');
      document.querySelector('.think-input-area')?.scrollIntoView({behavior:'smooth', block:'start'});
      if (titleInput) titleInput.focus();
    }
  });
  document.getElementById('tab-think').addEventListener('change', e => {
    if (e.target.id === 'think-img-input' && e.target.files[0]) {
      compressImage(e.target.files[0]).then(dataUrl => {
        const ta = document.getElementById('think-textarea');
        if (ta) insertImageAtCursor(ta, dataUrl);
        e.target.value = '';
      });
    }
  });
  // Catalog search filter
  document.getElementById('tab-think').addEventListener('input', e => {
    if (e.target.id === 'think-catalog-search') {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#think-catalog-body .catalog-entry').forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }
  });
  document.getElementById('tab-think').addEventListener('paste', async e => {
    if (!e.target.matches || !e.target.matches('#think-textarea')) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const dataUrl = await compressImage(items[i].getAsFile());
        insertImageAtCursor(e.target, dataUrl);
        break;
      }
    }
  });

  // ---- Background viewing mode ----
  document.getElementById('bg-view-btn').addEventListener('click', () => {
    if (state.settings.currentBg < 0) { alert('请先在设置中上传背景图片'); return; }
    document.body.classList.add('bg-viewing');
  });
  document.getElementById('bg-view-exit').addEventListener('click', () => {
    document.body.classList.remove('bg-viewing');
  });

  // Keyboard: Esc to close modal or exit bg view
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.body.classList.contains('bg-viewing')) { document.body.classList.remove('bg-viewing'); }
      else { closeSettings(); }
    }
  });
}

/* ===== Init ===== */
function init() {
  load();
  initParticles();
  updateHeaderLinks();
  applyBackground();
  renderMusic();
  setupEvents();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
