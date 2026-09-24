/* ====== 這裡改成你部署好的 Google Apps Script「Web 應用程式」網址 ====== */
/* 長得像 https://script.google.com/macros/s/AKfycb.../exec */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby9P5SrlAacsL1Bs3h4SXmJnGpDP9g41UzuDDcOsa257-AsNXwpRp6yySGXDi8V6Hg/exec";
/* ======================================================================= */

const HOUSES = {
  "馭風書院": {
    category: "美式餐點",
    recommendations: ["漢堡", "熱狗", "烤雞翅", "玉米麵包", "凱薩沙拉", "蘋果派", "烤肋排", "起司通心粉", "洋蔥圈", "布朗尼"]
  },
  "矽晶書院": {
    category: "中式餐點",
    recommendations: ["滷肉飯", "蔥油餅", "水餃", "糖醋排骨", "炒麵", "小籠包", "宮保雞丁", "蒸餃", "麻婆豆腐", "春捲"]
  },
  "靛織書院": {
    category: "義式餐點",
    recommendations: ["瑪格麗特披薩", "蛤蜊義大利麵", "提拉米蘇", "千層麵", "青醬義大利麵", "卡布里沙拉", "燉飯", "帕尼尼三明治", "義式烤蔬菜", "奶油培根義大利麵"]
  },
  "曦華書院": {
    category: "台式餐點",
    recommendations: ["滷味", "珍珠奶茶", "鹹酥雞", "蚵仔煎", "大腸包小腸", "蔥抓餅", "肉圓", "筒仔米糕", "鳳梨酥", "涼拌小黃瓜"]
  }
<<<<<<< HEAD
};

function getDeviceId() {
  let id = localStorage.getItem("party_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("party_device_id", id);
=======
  // 要加「第四關」的話，照上面的格式在陣列最後面再加一個 { label, courses } 物件，
  // 其他程式碼不用改，會自動接關。
];

// 這一份是第三關「原本、固定」的課程清單快照，用來在重設/重新計算非同步課程時，
// 還原成沒有非同步課程的乾淨狀態，不用手動維護。
const LEVEL3_STATIC_COURSES = COURSE_LEVELS[2].courses.slice();

// 非同步線上課程設定：國文/數學/英文只要在第一關選了任何一個 A/B/C 班，
// 社會只要在第二關選了公民或歷史（其中一項），物理/化學只要在第三關選了該科，
// 第三關就會自動出現對應這科的「非同步」卡片，讓玩家自己拖去空堂排入。
// count：這科的非同步課要排幾節。
const ASYNC_COURSE_DEFS = {
  chinese:   { name: '國文（非同步）', color: '#C1543C', count: 1 },
  math:      { name: '數學（非同步）', color: '#3B6EA5', count: 1 },
  english:   { name: '英文（非同步）', color: '#4C8C5B', count: 1 },
  social:    { name: '社會（非同步）', color: '#6B5B95', count: 1 },
  physics:   { name: '物理（非同步）', color: '#345E9E', count: 2 },
  chemistry: { name: '化學（非同步）', color: '#C97B3D', count: 2 },
};

// 內建、已經固定好、不能被拖走的課程
// day: 1=星期一 ... 5=星期五   period: 1~8 節
const LOCKED_COURSES = [
  { day: 2, period: 3, name: 'Tri-PBL', color: '#8A93A6' },
  { day: 2, period: 4, name: 'Tri-PBL', color: '#8A93A6' },
  { day: 3, period: 6, name: '設計思考', color: '#8A93A6' },
  { day: 3, period: 7, name: '設計思考', color: '#8A93A6' },
  { day: 2, period: 6, name: '生涯探索', color: '#8A93A6' },
  { day: 4, period: 5, name: '社會情緒學', color: '#8A93A6' },
  { day: 2, period: 7, name: '書院時間', color: '#8A93A6' },
  { day: 2, period: 8, name: '書院時間', color: '#8A93A6' },
];

const DAY_NAMES = ['星期一','星期二','星期三','星期四','星期五'];
const PERIOD_COUNT = 8;

// 按「重新歸零」的時候，會隨機挑一句顯示出來（可以自己增減／改文字）
const RANDOM_INTERESTS = [
  '喜歡寫程式',
  '喜歡跳舞',
  '喜歡做理化實驗',
  '喜歡畫畫',
  '喜歡拉小提琴',
];

/* =========================================================================
   以下為邏輯區，一般不需要修改
   ========================================================================= */

let currentLevelIndex = 0;
let poolItems = [];       // poolItems[levelIndex] = 該關還沒被排進課表的課程卡片陣列
let dragState = null;     // { payload:{uid,id,name,color,levelIndex}, sourceCell: HTMLElement|null, fromPool:boolean }
let uidCounter = 0;

const grid = document.getElementById('scheduleGrid');
const pool = document.getElementById('coursePool');
const ghost = document.getElementById('ghost');
const toast = document.getElementById('toast');
const levelProgress = document.getElementById('levelProgress');
const levelLabel = document.getElementById('levelLabel');

function buildPoolItems(){
  poolItems = COURSE_LEVELS.map((level, levelIndex) =>
    level.courses.flatMap(course =>
      Array.from({ length: course.count || 1 }, () => ({
        uid: 'item-' + (uidCounter++),
        id: course.id,
        name: course.name,
        color: course.color,
        levelIndex
      }))
    )
  );
}

function lockedAt(day, period){
  return LOCKED_COURSES.find(c => c.day === day && c.period === period);
}

function buildGrid(){
  grid.innerHTML = '';

  // 左上角空格
  const corner = document.createElement('div');
  corner.className = 'corner-cell';
  grid.appendChild(corner);

  // 星期標題列
  DAY_NAMES.forEach(name => {
    const h = document.createElement('div');
    h.className = 'head-cell';
    h.textContent = name;
    grid.appendChild(h);
  });

  // 每一節
  for(let p = 1; p <= PERIOD_COUNT; p++){
    const periodCell = document.createElement('div');
    periodCell.className = 'period-cell';
    periodCell.innerHTML = `第${p}節`;
    grid.appendChild(periodCell);

    for(let d = 1; d <= 5; d++){
      const cell = document.createElement('div');
      cell.className = 'schedule-cell';
      cell.dataset.day = d;
      cell.dataset.period = p;

      const locked = lockedAt(d, p);
      if(locked){
        renderChipInCell(cell, locked, true);
      }

      grid.appendChild(cell);
    }
>>>>>>> parent of f9eebfb (fix small bugs)
  }
  return id;
}
<<<<<<< HEAD
const deviceId = getDeviceId();

function getPartyCode() { return localStorage.getItem("party_code") || ""; }
function setPartyCode(code) { localStorage.setItem("party_code", code); }

function getSavedStudentId() { return localStorage.getItem("party_student_id") || ""; }
function saveStudentId(id) { localStorage.setItem("party_student_id", id); }

let selectedHouse = localStorage.getItem("party_selected_house") || null;
let currentItems = [];

// ---------- 書院選擇 ----------
const houseGrid = document.getElementById("houseGrid");
Object.keys(HOUSES).forEach((house) => {
  const btn = document.createElement("div");
  btn.className = "house-btn";
  btn.dataset.house = house;
  btn.innerHTML = `${house}<small>${HOUSES[house].category}</small>`;
  btn.addEventListener("click", () => selectHouse(house));
  houseGrid.appendChild(btn);
=======

function renderChipInCell(cell, payload, locked){
  cell.dataset.occupied = 'true';
  cell.dataset.locked = locked ? 'true' : 'false';
  cell.dataset.courseId = payload.id || payload.name;
  cell._payload = payload; // 存整包資料，之後要放回左邊清單會用到

  const chip = document.createElement('div');
  chip.className = 'placed-chip' + (locked ? ' locked' : '');
  chip.style.background = payload.color;
  chip.textContent = payload.name;

  if(locked){
    const lock = document.createElement('span');
    lock.className = 'lock-icon';
    lock.textContent = '🔒';
    chip.appendChild(lock);
  } else {
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.title = '移除這一節，退回左邊清單';
    removeBtn.addEventListener('pointerdown', e => e.stopPropagation());
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      clearCell(cell, true);
    });
    chip.appendChild(removeBtn);

    // 選修課程（有固定節次）只能用 × 移除；社團、非同步課程維持拖曳搬動
    const course = findCourseDef(payload.id, payload.levelIndex);
    const flexible = !(course && course.allowedSlots);
    if(flexible){
      chip.classList.add('draggable');
      chip.addEventListener('pointerdown', e => {
        startDrag(e, payload, cell, false);
      });
    }
  }

  cell.innerHTML = '';
  cell.appendChild(chip);
}

// returnToPool: 從課表上移除時，要不要把這張卡片還給左邊的清單
function clearCell(cell, returnToPool){
  if(cell.dataset.locked === 'true') return;

  if(returnToPool && cell._payload){
    giveBackToPool(cell._payload);
  }

  cell.innerHTML = '';
  cell.dataset.occupied = 'false';
  delete cell.dataset.courseId;
  cell._payload = null;
}

// 把課程還回它原本那一關的清單，如果玩家已經過關了，就退回那一關重新顯示
function giveBackToPool(payload){
  const lvl = payload.levelIndex;
  poolItems[lvl].push({ uid: payload.uid, id: payload.id, name: payload.name, color: payload.color, levelIndex: lvl });
  if(lvl !== currentLevelIndex){
    currentLevelIndex = lvl;
  }
  renderProgress();
  renderPool();
}

/* ---------------- 左側課程清單 ---------------- */

function renderPool(){
  refreshLevel3Courses();

  pool.innerHTML = '';
  const level = COURSE_LEVELS[currentLevelIndex];
  levelLabel.textContent = level ? level.label : '全部完成';
  if(!level) return;

  const remainingItems = poolItems[currentLevelIndex] || [];
  let anyVisible = false;

  level.courses.forEach(course => {
    const itemsOfCourse = remainingItems.filter(it => it.id === course.id);
    if(itemsOfCourse.length === 0) return; // 這門課的卡片都排完了，不用再顯示
    anyVisible = true;
    pool.appendChild(buildStackEl(course, itemsOfCourse, getLockReason(course, currentLevelIndex)));
  });

  if(!anyVisible){
    const done = document.createElement('div');
    done.className = 'pool-empty';
    done.textContent = '這一關的課程卡片都排完了。';
    pool.appendChild(done);
  }
}

// 算出某門課目前被排掉幾節
function placedCountOf(course, levelIndex){
  const remaining = (poolItems[levelIndex] || []).filter(it => it.id === course.id).length;
  return course.count - remaining;
}

// 這門課如果被鎖住，回傳要顯示的鎖定原因；沒被鎖就回傳 null
function getLockReason(course, levelIndex){
  const level = COURSE_LEVELS[levelIndex];
  if(!level) return null;

  // 規則一：同一個 group（同科目）只能三選一
  if(course.group){
    const sameGroupChosen = level.courses.some(other =>
      other.id !== course.id && other.group === course.group && placedCountOf(other, levelIndex) > 0
    );
    if(sameGroupChosen) return '🔒 已選同科其他班';
  }

  // 規則二：同一個字母（A/B/C）跨科不能重複用
  if(course.letter){
    const sameLetterChosen = level.courses.some(other =>
      other.id !== course.id && other.group !== course.group && other.letter === course.letter
      && placedCountOf(other, levelIndex) > 0
    );
    if(sameLetterChosen) return '🔒 這個字母已被別科用掉';
  }

  return null;
}

// 把同一門課的所有剩餘卡片畫成一疊：
// 選修課程（有固定節次）點一下就把剩下的堂數一次排好；
// 社團、非同步課程維持拖曳，一次拖一張，疊會跟著變薄。
function buildStackEl(course, itemsOfCourse, lockReason){
  const locked = !!lockReason;
  const wrap = document.createElement('div');
  wrap.className = 'stack' + (locked ? ' stack-locked' : '');

  const shadowCount = Math.min(itemsOfCourse.length - 1, 2);
  for(let i = shadowCount; i >= 1; i--){
    const shadow = document.createElement('div');
    shadow.className = 'stack-shadow';
    shadow.style.background = course.color;
    shadow.style.transform = `translateY(${i * 4}px)`;
    wrap.appendChild(shadow);
  }

  const top = document.createElement('div');
  top.className = 'chip stack-top';
  top.style.background = course.color;

  const nameEl = document.createElement('div');
  nameEl.textContent = course.name;
  top.appendChild(nameEl);

  if(course.allowedSlots){
    const slotEl = document.createElement('div');
    slotEl.className = 'chip-slot';
    slotEl.textContent = formatSlots(course.allowedSlots);
    top.appendChild(slotEl);
  } else if(course.id && course.id.startsWith('async-')){
    const slotEl = document.createElement('div');
    slotEl.className = 'chip-slot';
    slotEl.textContent = '非同步・需自行找空堂排入';
    top.appendChild(slotEl);
  }

  if(itemsOfCourse.length > 1){
    const badge = document.createElement('div');
    badge.className = 'stack-count';
    badge.textContent = '×' + itemsOfCourse.length;
    top.appendChild(badge);
  }

  if(locked){
    const lockNote = document.createElement('div');
    lockNote.className = 'chip-slot';
    lockNote.textContent = lockReason;
    top.appendChild(lockNote);
  } else if(course.allowedSlots){
    // 選修課程：點一下直接把這門課剩下的堂數全部排進去
    top.classList.add('chip-clickable');
    top.addEventListener('click', () => placeAllAutomatically(course, itemsOfCourse));
  } else {
    // 社團、非同步課程：維持拖曳，一次拖一張
    top.classList.add('chip-draggable');
    top.addEventListener('pointerdown', e => startDrag(e, itemsOfCourse[0], null, true));
  }

  wrap.appendChild(top);
  return wrap;
}

// 把 allowedSlots 轉成看得懂的文字，例如「一 第1節、三 第1節、五 第1節」
const DAY_SHORT = ['一','二','三','四','五'];
function formatSlots(slots){
  return slots.map(s => DAY_SHORT[s.day - 1] + ' 第' + s.period + '節').join('、');
}

// 只讀的進度條：目前第幾關、共幾關，不能用點的切換；旁邊的「下一關」按鈕由玩家自己按
function renderProgress(){
  levelProgress.innerHTML = '';
  COURSE_LEVELS.forEach((level, i) => {
    if(i > 0){
      const arrow = document.createElement('span');
      arrow.className = 'level-arrow';
      arrow.textContent = '→';
      levelProgress.appendChild(arrow);
    }
    const step = document.createElement('span');
    step.className = 'level-step' + (i === currentLevelIndex ? ' current' : i < currentLevelIndex ? ' done' : '');
    step.textContent = level.label;
    levelProgress.appendChild(step);
  });

  const incomplete = getIncompleteCourses(currentLevelIndex);

  if(currentLevelIndex < COURSE_LEVELS.length - 1){
    const btn = document.createElement('button');
    btn.className = 'next-btn';
    btn.textContent = '下一關 →';
    btn.disabled = incomplete.length > 0;
    btn.title = incomplete.length > 0
      ? '「' + incomplete.join('、') + '」選了但還沒排完，排完（或整堂都不排）才能過關'
      : '';
    btn.addEventListener('click', () => {
      if(getIncompleteCourses(currentLevelIndex).length > 0) return;
      showToast('🎉 ' + COURSE_LEVELS[currentLevelIndex].label + ' 完成！進入 ' + COURSE_LEVELS[currentLevelIndex + 1].label);
      currentLevelIndex++;
      renderProgress();
      renderPool();
    });
    levelProgress.appendChild(btn);
  } else if(incomplete.length === 0){
    const doneTag = document.createElement('span');
    doneTag.className = 'level-step done';
    doneTag.textContent = '✓ 已完成';
    levelProgress.appendChild(doneTag);
  }
}

// 找出「有排但沒排完」的課（可以整堂不選，但選了就要排完每一節）。
// 非同步課程（id 開頭是 async-）是系統依你選的科目自動加的，只要出現在這一關，
// 就一定要排進課表才算過關，不能只留在清單裡不排。
function getIncompleteCourses(levelIndex){
  const level = COURSE_LEVELS[levelIndex];
  if(!level) return [];
  const remaining = poolItems[levelIndex] || [];
  return level.courses
    .filter(course => {
      const remainCount = remaining.filter(it => it.id === course.id).length;
      if(course.id && course.id.startsWith('async-')){
        return remainCount > 0;
      }
      const placed = course.count - remainCount;
      return placed > 0 && remainCount > 0;
    })
    .map(course => course.name);
}

function findCourseDef(id, levelIndex){
  const level = COURSE_LEVELS[levelIndex];
  return level ? level.courses.find(c => c.id === id) : null;
}

/* ---------------- 非同步課程：依第一、二關的選課結果動態決定 ---------------- */

// 算出目前已經選定的科目：國文/數學/英文（第一關，只要選了 A/B/C 其中一班），
// 社會（第二關，只要選了公民或歷史其中一項）。
function computeChosenSubjects(){
  const chosen = new Set();

  const level1 = COURSE_LEVELS[0];
  const groups = {};
  level1.courses.forEach(c => {
    if(!c.group) return;
    (groups[c.group] = groups[c.group] || []).push(c);
  });
  Object.keys(groups).forEach(g => {
    const anyPlaced = groups[g].some(c => placedCountOf(c, 0) > 0);
    if(anyPlaced) chosen.add(g); // 'chinese' / 'math' / 'english'
  });

  const level2 = COURSE_LEVELS[1];
  const anySocialPlaced = level2.courses.some(c => placedCountOf(c, 1) > 0);
  if(anySocialPlaced) chosen.add('social');

  // 第三關本身選修的物理／化學，選了也各自帶出非同步課程
  const physicsCourse = LEVEL3_STATIC_COURSES.find(c => c.id === 'physics');
  const chemistryCourse = LEVEL3_STATIC_COURSES.find(c => c.id === 'chemistry');
  if(physicsCourse && placedCountOf(physicsCourse, 2) > 0) chosen.add('physics');
  if(chemistryCourse && placedCountOf(chemistryCourse, 2) > 0) chosen.add('chemistry');

  return chosen;
}

function isCoursePlacedOnGrid(id, levelIndex){
  return Array.from(document.querySelectorAll('.schedule-cell')).some(cell =>
    cell._payload && cell._payload.id === id && cell._payload.levelIndex === levelIndex
  );
}

function clearGridCoursesById(id, levelIndex){
  document.querySelectorAll('.schedule-cell').forEach(cell => {
    if(cell._payload && cell._payload.id === id && cell._payload.levelIndex === levelIndex){
      clearCell(cell, false); // 課程本身已經被取消了，不用再退回清單
    }
  });
}

// 依目前選課狀況，同步第三關的課程定義與左側清單：
// 新選定的科目自動加入一張非同步卡片；如果玩家回頭改掉原本的選課，
// 已經不再需要的非同步課程就會被移除（含已排在課表上的）。
function refreshLevel3Courses(){
  const chosen = computeChosenSubjects();
  const desired = Array.from(chosen).map(subj => ({
    id: 'async-' + subj,
    name: ASYNC_COURSE_DEFS[subj].name,
    color: ASYNC_COURSE_DEFS[subj].color,
    count: ASYNC_COURSE_DEFS[subj].count
  }));
  const desiredIds = new Set(desired.map(c => c.id));

  const existingAsyncIds = new Set(
    COURSE_LEVELS[2].courses.filter(c => c.id.startsWith('async-')).map(c => c.id)
  );

  COURSE_LEVELS[2].courses = [...LEVEL3_STATIC_COURSES, ...desired];

  desired.forEach(course => {
    const inPool = (poolItems[2] || []).some(it => it.id === course.id);
    const onGrid = isCoursePlacedOnGrid(course.id, 2);
    if(!inPool && !onGrid){
      poolItems[2].push({ uid: 'item-' + (uidCounter++), id: course.id, name: course.name, color: course.color, levelIndex: 2 });
    }
  });

  existingAsyncIds.forEach(id => {
    if(!desiredIds.has(id)){
      poolItems[2] = (poolItems[2] || []).filter(it => it.id !== id);
      clearGridCoursesById(id, 2);
    }
  });
}

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1600);
}

/* ---------------- 點選排課（選修課程用，一次排好全部堂數） ---------------- */

// 點一下選修課程（有固定節次的課），把它剩下的所有堂數一次排進固定的格子裡，
// 不用點好幾下。
function placeAllAutomatically(course, itemsOfCourse){
  const cells = Array.from(document.querySelectorAll('.schedule-cell'));
  const remainingItems = itemsOfCourse.slice();
  let placedAny = false;

  for(const slot of course.allowedSlots){
    if(remainingItems.length === 0) break;
    const cell = cells.find(c => +c.dataset.day === slot.day && +c.dataset.period === slot.period);
    if(cell && cell.dataset.occupied !== 'true' && cell.dataset.locked !== 'true'){
      const payload = remainingItems.shift();
      renderChipInCell(cell, payload, false);

      const items = poolItems[payload.levelIndex];
      const idx = items.findIndex(it => it.uid === payload.uid);
      if(idx > -1) items.splice(idx, 1);
      placedAny = true;
    }
  }

  if(remainingItems.length > 0){
    showToast('⚠️ 固定節次已經有格子被占用，沒辦法全部排進去');
  }

  if(placedAny){
    renderPool();
    renderProgress();
  }
}

/* ---------------- 拖曳邏輯（社團、非同步課程用，滑鼠 / 觸控通用） ---------------- */

function startDrag(e, payload, sourceCell, fromPool){
  e.preventDefault();
  ghost.hidden = false;
  ghost.style.background = payload.color;
  ghost.textContent = payload.name;
  moveGhost(e.clientX, e.clientY);

  dragState = { payload, sourceCell, fromPool };
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
}

function moveGhost(x, y){
  ghost.style.left = x + 'px';
  ghost.style.top = y + 'px';
}

function cellAt(x, y){
  const el = document.elementFromPoint(x, y);
  return el ? el.closest('.schedule-cell') : null;
}

function onDragMove(e){
  moveGhost(e.clientX, e.clientY);
  document.querySelectorAll('.schedule-cell.hover').forEach(c => c.classList.remove('hover'));
  const cell = cellAt(e.clientX, e.clientY);
  if(cell && cell.dataset.locked !== 'true' && cell.dataset.occupied !== 'true'){
    cell.classList.add('hover');
  }
}

function onDragEnd(e){
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  ghost.hidden = true;
  document.querySelectorAll('.schedule-cell.hover').forEach(c => c.classList.remove('hover'));

  const cell = cellAt(e.clientX, e.clientY);

  if(cell){
    if(cell === dragState.sourceCell){
      // 放回原本的格子，不做事
    } else if(cell.dataset.locked === 'true' || cell.dataset.occupied === 'true'){
      cell.classList.add('reject');
      setTimeout(() => cell.classList.remove('reject'), 300);
    } else {
      renderChipInCell(cell, dragState.payload, false);

      if(dragState.sourceCell){
        // 從課表上的另一格搬過來，原本的格子清空，不用碰左邊清單
        clearCell(dragState.sourceCell, false);
      } else if(dragState.fromPool){
        // 從左邊清單拖來的：把這張卡片從清單移除，不會留著
        const items = poolItems[dragState.payload.levelIndex];
        const idx = items.findIndex(it => it.uid === dragState.payload.uid);
        if(idx > -1) items.splice(idx, 1);
        renderPool();
        renderProgress();
      }
    }
  }

  dragState = null;
}

/* ---------------- 重新歸零 ---------------- */

document.getElementById('resetBtn').addEventListener('click', () => {
  if(!confirm('確定要清空整張課表、回到第一關嗎？')) return;
  document.querySelectorAll('.schedule-cell').forEach(cell => {
    if(cell.dataset.locked !== 'true') clearCell(cell, false);
  });
  currentLevelIndex = 0;
  COURSE_LEVELS[2].courses = LEVEL3_STATIC_COURSES.slice();
  buildPoolItems();
  renderProgress();
  renderPool();

  const pick = RANDOM_INTERESTS[Math.floor(Math.random() * RANDOM_INTERESTS.length)];
  alert('模擬新的一位同學：' + pick);
>>>>>>> parent of f9eebfb (fix small bugs)
});

function selectHouse(house) {
  selectedHouse = house;
  localStorage.setItem("party_selected_house", house);
  document.querySelectorAll(".house-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.house === house);
  });
  document.getElementById("formCard").style.display = "block";
  document.getElementById("categoryHint").textContent =
    `你的書院是「${house}」，主題是「${HOUSES[house].category}」。下面是推薦項目，也可以自己輸入：`;
  document.getElementById("studentIdInput").value = getSavedStudentId();
  renderChips(house);
}
if (selectedHouse && HOUSES[selectedHouse]) selectHouse(selectedHouse);

function renderChips(house) {
  const chipList = document.getElementById("chipList");
  chipList.innerHTML = "";
  HOUSES[house].recommendations.forEach((name) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = name;
    chip.addEventListener("click", () => {
      document.getElementById("dishInput").value = name;
    });
    chipList.appendChild(chip);
  });
}

// ---------- 呼叫 Google Apps Script ----------
// 注意：Content-Type 一定要用 text/plain，否則瀏覽器會送出 CORS 預檢請求，
// 而 Apps Script 的 Web App 不處理預檢，會導致失敗。
function callScript(action, payload) {
  return fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, code: getPartyCode(), ...payload }),
  }).then((res) => res.json());
}

// ---------- 送出新餐點 ----------
document.getElementById("submitBtn").addEventListener("click", async () => {
  const studentId = document.getElementById("studentIdInput").value.trim();
  const dish = document.getElementById("dishInput").value.trim();
  const msgEl = document.getElementById("formMsg");
  msgEl.textContent = "";
  msgEl.className = "msg";

  if (!selectedHouse) { msgEl.textContent = "請先選擇書院"; msgEl.className = "msg error"; return; }
  if (!studentId) { msgEl.textContent = "請輸入孩子的學號"; msgEl.className = "msg error"; return; }
  if (!dish) { msgEl.textContent = "請輸入餐點名稱"; msgEl.className = "msg error"; return; }

  const dup = currentItems.some((it) => String(it.dish || "").trim().toLowerCase() === dish.toLowerCase());
  if (dup) { msgEl.textContent = "這道菜已經有人填寫了，換一個吧！"; msgEl.className = "msg error"; return; }

  await ensurePartyCode(async () => {
    document.getElementById("submitBtn").disabled = true;
    try {
      const data = await callScript("add", { house: selectedHouse, dish, studentId, deviceId });
      if (data.item) {
        saveStudentId(studentId);
        document.getElementById("dishInput").value = "";
        msgEl.textContent = "填寫成功！";
        msgEl.className = "msg ok";
        await loadItems();
      } else {
        msgEl.textContent = data.error || "送出失敗，請再試一次";
        msgEl.className = "msg error";
      }
    } catch (e) {
      msgEl.textContent = "網路連線異常，請稍後再試";
      msgEl.className = "msg error";
    } finally {
      document.getElementById("submitBtn").disabled = false;
    }
  });
});

// ---------- 通關密語 ----------
function ensurePartyCode(callback) {
  return new Promise((resolve) => {
    const existing = getPartyCode();
    if (existing) { callback().then(resolve); return; }
    const dialog = document.getElementById("codeDialog");
    dialog.showModal();
    const onConfirm = () => {
      const code = document.getElementById("codeInput").value.trim();
      if (code) setPartyCode(code);
      dialog.close();
      cleanup();
      callback().then(resolve);
    };
    const onCancel = () => { dialog.close(); cleanup(); resolve(); };
    function cleanup() {
      document.getElementById("codeConfirm").removeEventListener("click", onConfirm);
      document.getElementById("codeCancel").removeEventListener("click", onCancel);
    }
    document.getElementById("codeConfirm").addEventListener("click", onConfirm);
    document.getElementById("codeCancel").addEventListener("click", onCancel);
  });
}

// ---------- 載入 & 顯示清單 ----------
async function loadItems() {
  const listArea = document.getElementById("listArea");
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    currentItems = data.items || [];
    renderList();
  } catch (e) {
    listArea.innerHTML = '<div class="empty">目前無法載入資料，請稍後再試（也可能是 SCRIPT_URL 尚未設定）</div>';
  }
}

function renderList() {
  const listArea = document.getElementById("listArea");
  if (currentItems.length === 0) {
    listArea.innerHTML = '<div class="empty">目前還沒有人填寫，當第一個吧！</div>';
    return;
  }
  listArea.innerHTML = "";
  const order = ["馭風書院", "矽晶書院", "靛織書院", "曦華書院"];
  const sorted = [...currentItems].sort((a, b) => order.indexOf(a.house) - order.indexOf(b.house));
  sorted.forEach((it) => {
    const row = document.createElement("div");
    row.className = "list-item";
    const isMine = it.deviceId === deviceId;
    row.innerHTML = `
      <div>
        <span class="house-tag tag-${it.house}">${it.house}</span>
        <span class="dish">${escapeHtml(String(it.dish ?? ""))}</span>
      </div>
      <div class="item-actions">
        ${isMine ? `<button class="edit" data-id="${it.id}">編輯</button><button class="delete" data-id="${it.id}">刪除</button>` : ""}
      </div>
    `;
    listArea.appendChild(row);
  });

  listArea.querySelectorAll(".edit").forEach((btn) => btn.addEventListener("click", () => openEdit(btn.dataset.id)));
  listArea.querySelectorAll(".delete").forEach((btn) => btn.addEventListener("click", () => deleteItem(btn.dataset.id)));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- 編輯 ----------
let editingId = null;
function openEdit(id) {
  const item = currentItems.find((it) => it.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById("editInput").value = item.dish;
  document.getElementById("editMsg").textContent = "";
  document.getElementById("editDialog").showModal();
}
document.getElementById("editCancel").addEventListener("click", () => {
  document.getElementById("editDialog").close();
});
document.getElementById("editConfirm").addEventListener("click", async () => {
  const newDish = document.getElementById("editInput").value.trim();
  const msgEl = document.getElementById("editMsg");
  if (!newDish) { msgEl.textContent = "請輸入餐點名稱"; return; }
  const dup = currentItems.some((it) => it.id !== editingId && String(it.dish || "").trim().toLowerCase() === newDish.toLowerCase());
  if (dup) { msgEl.textContent = "這道菜已經有人填寫了"; return; }
  try {
    const data = await callScript("edit", { id: editingId, dish: newDish, deviceId });
    if (data.ok) {
      document.getElementById("editDialog").close();
      await loadItems();
    } else {
      msgEl.textContent = data.error || "編輯失敗";
    }
  } catch (e) {
    msgEl.textContent = "網路連線異常";
  }
});

// ---------- 刪除 ----------
async function deleteItem(id) {
  if (!confirm("確定要刪除這筆餐點嗎？")) return;
  try {
    const data = await callScript("delete", { id, deviceId });
    if (data.ok) {
      await loadItems();
    } else {
      alert(data.error || "刪除失敗");
    }
  } catch (e) {
    alert("網路連線異常");
  }
}

// ---------- 重新整理 & 自動輪詢 ----------
document.getElementById("refreshBtn").addEventListener("click", loadItems);
loadItems();
setInterval(loadItems, 8000);