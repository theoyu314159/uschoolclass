/* =========================================================================
   設定區：想要新增課程或關卡，只要編輯這裡就好，不用動下面的邏輯。
   ========================================================================= */

// 用「陣列」照順序放每一關的內容，玩家會照順序一關一關過。
// count：這門課一週要排幾節（=左邊會出現幾張卡）。
// allowedSlots（可省略）：如果這門課有固定節次，只能拖到列出的格子，
//   格式是 { day, period }，day 1~5 = 星期一~五，period 1~8 =第幾節。
//   不寫這個欄位的話，代表可以拖到任何空格。
const COURSE_LEVELS = [
  {
    label: '第一關・國數英',
    courses: [
      {
        id: 'chinese', name: '國文A', color: '#C1543C', count: 3,
        allowedSlots: [ {day:1, period:1}, {day:1, period:2}, {day:5, period:8} ]
      },
      { id: 'math',    name: '數學B', color: '#3B6EA5', count: 3, 
        allowedSlots: [ {day:1, period:5}, {day:2, period:1}, {day:2, period:2} ]},
      { id: 'english', name: '英文C', color: '#4C8C5B', count: 2, 
        allowedSlots: [ {day:4, period:7}, {day:5, period:7}]},
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
      // 之後要加課，複製上面一行，改 id / name / color / count（要固定節次再加 allowedSlots）
    ]
  },
  {        
    label: '第三關・社團與其他',
    courses: [
      { id: 'club',     name: '社團',     color: '#B98A3E', count: 2 },
      {
        id: 'techlife', name: '資訊科技A', color: '	#984B4B', count: 2,
        allowedSlots: [ {day:5, period:1}, {day:5, period:2} ]
      },
      {
        id: 'art', name: '美術', color: '	#408080', count: 2,
        allowedSlots: [ {day:5, period:5}, {day:5, period:6} ]
      },
      // 之後要加課，複製上面一行，改 id / name / color / count（要固定節次再加 allowedSlots）
    ]
  }
  // 要加「第三關」的話，照上面的格式在陣列最後面再加一個 { label, courses } 物件，
  // 其他程式碼不用改，會自動接關。
];

// 內建、已經固定好、不能被拖走的課程
// day: 1=星期一 ... 5=星期五   period: 1~8 節
const LOCKED_COURSES = [
  { day: 2, period: 3, name: 'Tri-PBL', color: '#8A93A6' },
  { day: 2, period: 4, name: 'Tri-PBL', color: '#8A93A6' },
  { day: 3, period: 6, name: '設計思考', color: '#8A93A6' },
  { day: 3, period: 7, name: '設計思考', color: '#8A93A6' },
  { day: 2, period: 6, name: '生涯探索', color: '#8A93A6' },
  { day: 4, period: 5, name: '社會情緒學', color: '#8A93A6' },
];

const DAY_NAMES = ['星期一','星期二','星期三','星期四','星期五'];
const PERIOD_COUNT = 8;

// 按「重新歸零」的時候，會隨機挑一句顯示出來（可以自己增減／改文字）
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
let poolItems = [];       // poolItems[levelIndex] = 該關還沒被拖走的課程卡片陣列
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

      attachCellDrop(cell);
      grid.appendChild(cell);
    }
  }
}

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
    removeBtn.addEventListener('pointerdown', e => e.stopPropagation());
    removeBtn.addEventListener('click', () => clearCell(cell, true));
    chip.appendChild(removeBtn);

    chip.addEventListener('pointerdown', e => {
      startDrag(e, payload, cell, false);
    });
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

function attachCellDrop(cell){
  // 拖放的實際判定是用 pointerup 時的座標去找元素，
  // 這裡不需要另外加事件，只是先建立好 cell。
}

/* ---------------- 左側課程清單 ---------------- */

function renderPool(){
  pool.innerHTML = '';
  levelLabel.textContent = COURSE_LEVELS[currentLevelIndex] ? COURSE_LEVELS[currentLevelIndex].label : '全部完成';

  const items = poolItems[currentLevelIndex];

  if(!items || items.length === 0){
    const done = document.createElement('div');
    done.className = 'pool-empty';
    done.textContent = '這一關的課程卡片都排完了。';
    pool.appendChild(done);
    return;
  }

  items.forEach((item, i) => {
    const course = findCourseDef(item.id, item.levelIndex);
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.style.background = item.color;
    chip.style.setProperty('--tilt', (i % 2 === 0 ? '-1.2deg' : '1.2deg'));

    const nameEl = document.createElement('div');
    nameEl.textContent = item.name;
    chip.appendChild(nameEl);

    if(course && course.allowedSlots){
      const slotEl = document.createElement('div');
      slotEl.className = 'chip-slot';
      slotEl.textContent = formatSlots(course.allowedSlots);
      chip.appendChild(slotEl);
    }

    chip.addEventListener('pointerdown', e => startDrag(e, item, null, true));
    pool.appendChild(chip);
  });
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

// 找出「有排但沒排完」的課（可以整堂不選，但選了就要排完每一節）
function getIncompleteCourses(levelIndex){
  const level = COURSE_LEVELS[levelIndex];
  if(!level) return [];
  const remaining = poolItems[levelIndex] || [];
  return level.courses
    .filter(course => {
      const remainCount = remaining.filter(it => it.id === course.id).length;
      const placed = course.count - remainCount;
      return placed > 0 && remainCount > 0;
    })
    .map(course => course.name);
}

function findCourseDef(id, levelIndex){
  const level = COURSE_LEVELS[levelIndex];
  return level ? level.courses.find(c => c.id === id) : null;
}

// 檢查某個課程可不可以放到這個格子（有固定節次限制的話，只能放在指定的格子）
function isSlotAllowed(payload, day, period){
  const course = findCourseDef(payload.id, payload.levelIndex);
  if(!course || !course.allowedSlots) return true;
  return course.allowedSlots.some(s => s.day === day && s.period === period);
}

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1600);
}

/* ---------------- 拖曳邏輯（滑鼠 / 觸控通用） ---------------- */

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
  if(cell && cell.dataset.locked !== 'true' && cell.dataset.occupied !== 'true'
     && isSlotAllowed(dragState.payload, +cell.dataset.day, +cell.dataset.period)){
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
    const allowed = isSlotAllowed(dragState.payload, +cell.dataset.day, +cell.dataset.period);
    if(cell === dragState.sourceCell){
      // 放回原本的格子，不做事
    } else if(cell.dataset.locked === 'true' || cell.dataset.occupied === 'true' || !allowed){
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
  buildPoolItems();
  renderProgress();
  renderPool();

  const pick = RANDOM_INTERESTS[Math.floor(Math.random() * RANDOM_INTERESTS.length)];
  alert('模擬新的一位同學：' + pick);
});

/* ---------------- 初始化 ---------------- */

buildGrid();
buildPoolItems();
renderProgress();
renderPool();

alert('模擬新的一位同學：' + RANDOM_INTERESTS[Math.floor(Math.random() * RANDOM_INTERESTS.length)]);
