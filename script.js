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
};

function getDeviceId() {
  let id = localStorage.getItem("party_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("party_device_id", id);
  }
  return id;
}
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