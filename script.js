/* =========================================================================
   設定區：想要新增課程或關卡，只要編輯這裡就好，不用動下面的邏輯。
   ========================================================================= */

const COURSE_LEVELS = [
  {
    label: '第一關・國數英',
    courses: [
      {
        id: 'chinese-a', name: '國文A', color: '#C1543C', count: 3, group: 'chinese', letter: 'A',
        allowedSlots: [ {day:1, period:1}, {day:1, period:2}, {day:5, period:8} ]
      },
      {
        id: 'chinese-b', name: '國文B', color: '#C1543C', count: 3, group: 'chinese', letter: 'B',
        allowedSlots: [ {day:1, period:1}, {day:1, period:2}, {day:5, period:8} ]
      },
      {
        id: 'chinese-c', name: '國文C', color: '#C1543C', count: 3, group: 'chinese', letter: 'C',
        allowedSlots: [ {day:1, period:1}, {day:1, period:2}, {day:5, period:8} ]
      },
      {
        id: 'math-a', name: '數學A', color: '#3B6EA5', count: 3, group: 'math', letter: 'A',
        allowedSlots: [ {day:1, period:5}, {day:2, period:1}, {day:2, period:2} ]
      },
      {
        id: 'math-b', name: '數學B', color: '#3B6EA5', count: 3, group: 'math', letter: 'B',
        allowedSlots: [ {day:1, period:5}, {day:2, period:1}, {day:2, period:2} ]
      },
      {
        id: 'math-c', name: '數學C', color: '#3B6EA5', count: 3, group: 'math', letter: 'C',
        allowedSlots: [ {day:1, period:5}, {day:2, period:1}, {day:2, period:2} ]
      },
      {
        id: 'english-a', name: '英文A', color: '#4C8C5B', count: 2, group: 'english', letter: 'A',
        allowedSlots: [ {day:4, period:7}, {day:5, period:7} ]
      },
      {
        id: 'english-b', name: '英文B', color: '#4C8C5B', count: 2, group: 'english', letter: 'B',
        allowedSlots: [ {day:4, period:7}, {day:5, period:7} ]
      },
      {
        id: 'english-c', name: '英文C', color: '#4C8C5B', count: 2, group: 'english', letter: 'C',
        allowedSlots: [ {day:4, period:7}, {day:5, period:7} ]
      },
    ]
  },
  {
    label: '第二關・社會科',
    courses: [
      {
        id: 'techlife', name: '公民與社會A', color: '#6B5B95', count: 1,
        allowedSlots: [ {day:4, period:2}]
      },
      { id: 'history', name: '歷史B', color:"#A6A600" , count: 2, 
        allowedSlots: [ {day:1, period:3}, {day:1, period:4}]},
    ]
  },
  {        
    label: '第三關・社團與其他',
    courses: [
      { id: 'club',     name: '社團',     color: '#B98A3E', count: 2 },
      {
        id: 'techlife2', name: '資訊科技A', color: '#984B4B', count: 2,
        allowedSlots: [ {day:5, period:1}, {day:5, period:2} ]
      },
      {
        id: 'art', name: '美術', color: '#408080', count: 2,
        allowedSlots: [ {day:5, period:5}, {day:5, period:6} ]
      },
      {
        id: 'physics', name: '物理', color: '#345E9E', count: 2,
        allowedSlots: [ {day:1, period:7}, {day:1, period:8} ]
      },
      {
        id: 'chemistry', name: '化學', color: '#C97B3D', count: 2,
        allowedSlots: [ {day:2, period:5}, {day:3, period:5} ]
      },
    ]
  }
];

const LEVEL3_STATIC_COURSES = COURSE_LEVELS[2].courses.slice();

const ASYNC_COURSE_DEFS = {
  chinese:   { name: '國文（非同步）', color: '#C1543C', count: 1 },
  math:      { name: '數學（非同步）', color: '#3B6EA5', count: 1 },
  english:   { name: '英文（非同步）', color: '#4C8C5B', count: 2 },
  civics:    { name: '公民（非同步）', color: '#6B5B95', count: 2 },
  history:   { name: '歷史（非同步）', color: '#A6A600', count: 1 },
  physics:   { name: '物理（非同步）', color: '#345E9E', count: 2 },
  chemistry: { name: '化學（非同步）', color: '#C97B3D', count: 2 },
};

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

const RANDOM_INTERESTS = [
  '喜歡寫程式',
  '喜歡跳舞',
  '喜歡打籃球',
  '喜歡畫畫',
  '喜歡拉小提琴',
];

/* =========================================================================
   以下為邏輯區，一般不需要修改
   ========================================================================= */

let currentLevelIndex = 0;
let poolItems = [];
let dragState = null;
let uidCounter = 0;
let currentStudentTag = ''; // 記錄目前模擬的學生人設，匯出圖片時可印在標題旁

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

  const corner = document.createElement('div');
  corner.className = 'corner-cell';
  grid.appendChild(corner);

  DAY_NAMES.forEach(name => {
    const h = document.createElement('div');
    h.className = 'head-cell';
    h.textContent = name;
    grid.appendChild(h);
  });

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
  }
}

function renderChipInCell(cell, payload, locked){
  cell.dataset.occupied = 'true';
  cell.dataset.locked = locked ? 'true' : 'false';
  cell.dataset.courseId = payload.id || payload.name;
  cell._payload = payload;

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
    if(itemsOfCourse.length === 0) return;
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

function placedCountOf(course, levelIndex){
  const remaining = (poolItems[levelIndex] || []).filter(it => it.id === course.id).length;
  return course.count - remaining;
}

function getLockReason(course, levelIndex){
  const level = COURSE_LEVELS[levelIndex];
  if(!level) return null;

  if(course.group){
    const sameGroupChosen = level.courses.some(other =>
      other.id !== course.id && other.group === course.group && placedCountOf(other, levelIndex) > 0
    );
    if(sameGroupChosen) return '🔒 已選同科其他班';
  }

  if(course.letter){
    const sameLetterChosen = level.courses.some(other =>
      other.id !== course.id && other.group !== course.group && other.letter === course.letter
      && placedCountOf(other, levelIndex) > 0
    );
    if(sameLetterChosen) return '🔒 這個字母已被別科用掉';
  }

  return null;
}

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
    top.classList.add('chip-clickable');
    top.addEventListener('click', () => placeAllAutomatically(course, itemsOfCourse));
  } else {
    top.classList.add('chip-draggable');
    top.addEventListener('pointerdown', e => startDrag(e, itemsOfCourse[0], null, true));
  }

  wrap.appendChild(top);
  return wrap;
}

const DAY_SHORT = ['一','二','三','四','五'];
function formatSlots(slots){
  return slots.map(s => DAY_SHORT[s.day - 1] + ' 第' + s.period + '節').join('、');
}

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

/* ---------------- 非同步課程 ---------------- */

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
    if(anyPlaced) chosen.add(g);
  });

  const level2 = COURSE_LEVELS[1];
  const civicsCourse = level2.courses.find(c => c.id === 'techlife');
  const historyCourse = level2.courses.find(c => c.id === 'history');
  if(civicsCourse && placedCountOf(civicsCourse, 1) > 0) chosen.add('civics');
  if(historyCourse && placedCountOf(historyCourse, 1) > 0) chosen.add('history');

  const physicsCourse = LEVEL3_STATIC_COURSES.find(c => c.id === 'physics');
  const chemistryCourse = LEVEL3_STATIC_COURSES.find(c => c.id === 'chemistry');
  if(physicsCourse && placedCountOf(physicsCourse, 2) > 0) chosen.add('physics');
  if(chemistryCourse && placedCountOf(chemistryCourse, 2) > 0) chosen.add('chemistry');

  return chosen;
}

function clearGridCoursesById(id, levelIndex){
  document.querySelectorAll('.schedule-cell').forEach(cell => {
    if(cell._payload && cell._payload.id === id && cell._payload.levelIndex === levelIndex){
      clearCell(cell, false);
    }
  });
}

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
    const inPoolCount = (poolItems[2] || []).filter(it => it.id === course.id).length;
    const onGridCount = Array.from(document.querySelectorAll('.schedule-cell'))
      .filter(cell => cell._payload && cell._payload.id === course.id && cell._payload.levelIndex === 2).length;
    const missing = course.count - inPoolCount - onGridCount;
    for(let i = 0; i < missing; i++){
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
  setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ---------------- 點選排課 ---------------- */

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

/* ---------------- 拖曳邏輯 ---------------- */

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
      // 不做事
    } else if(cell.dataset.locked === 'true' || cell.dataset.occupied === 'true'){
      cell.classList.add('reject');
      setTimeout(() => cell.classList.remove('reject'), 300);
    } else {
      renderChipInCell(cell, dragState.payload, false);

      if(dragState.sourceCell){
        clearCell(dragState.sourceCell, false);
      } else if(dragState.fromPool){
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

/* ---------------- 匯出課表為圖片 ---------------- */

document.getElementById('exportBtn').addEventListener('click', async () => {
  if (typeof html2canvas === 'undefined') {
    showToast('⚠️ 匯出元件尚未載入完成，請稍後再試');
    return;
  }

  const exportBtn = document.getElementById('exportBtn');
  const exportTarget = document.getElementById('exportTarget');
  const exportMeta = document.getElementById('exportMeta');

  // 填入標題副資訊（同學標籤 + 日期）
  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  exportMeta.textContent = currentStudentTag ? `同學設定：${currentStudentTag} ｜ ${dateStr}` : dateStr;

  exportBtn.disabled = true;
  exportBtn.textContent = '⏳ 產生圖片中...';

  // 切換為乾淨的匯出樣式（隱藏 X 按鈕、顯示大標題）
  exportTarget.classList.add('is-exporting');

  try {
    // 稍微等待版面重繪，並確保手機版匯出時不被橫向捲軸裁切
    await new Promise(resolve => setTimeout(resolve, 80));

    const canvas = await html2canvas(exportTarget, {
      scale: 2, // 2倍解析度，確保文字清晰銳利
      backgroundColor: '#EEF3EF',
      useCORS: true,
      windowWidth: Math.max(exportTarget.scrollWidth, 860) // 保證在手機上匯出也是完整寬版課表
    });

    const link = document.createElement('a');
    link.download = `竹北實驗高中模擬課表_${dateStr.replace(/\//g, '')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('✅ 課表圖片已下載！');
  } catch (err) {
    console.error(err);
    showToast('❌ 匯出失敗，請稍後再試');
  } finally {
    // 還原原本的操作介面
    exportTarget.classList.remove('is-exporting');
    exportBtn.disabled = false;
    exportBtn.textContent = '📸 匯出課表';
  }
});

/* ---------------- 重新歸零 ---------------- */

function assignRandomStudent() {
  currentStudentTag = RANDOM_INTERESTS[Math.floor(Math.random() * RANDOM_INTERESTS.length)];
  alert('模擬新的一位同學：' + currentStudentTag);
}

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
  assignRandomStudent();
});

/* ---------------- 初始化 ---------------- */

buildGrid();
buildPoolItems();
renderProgress();
renderPool();
assignRandomStudent();