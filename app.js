// app.js (ES Modules)

// 1) Import Firebase (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// 2) PASTE YOUR FIREBASE CONFIG HERE (from Firebase Console -> Project settings -> Web app)
const firebaseConfig = {
  // PASTE_FIREBASE_CONFIG_HERE
  // example:
  // apiKey: "...",
  // authDomain: "...",
  // databaseURL: "...",
  // projectId: "...",
  // storageBucket: "...",
  // messagingSenderId: "...",
  // appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Database location for the "current trade"
const tradeRef = ref(db, "dynasty5/currentTrade");

// Owners list (exact names requested)
const OWNERS = ["JCort", "Troy", "Tristan", "Charmin", "Kade"];

// DOM
const newTradeBtn = document.getElementById("newTradeBtn");
const tradeForm = document.getElementById("tradeForm");
const cancelBtn = document.getElementById("cancelBtn");
const weSendEl = document.getElementById("weSend");
const weReceiveEl = document.getElementById("weReceive");

const tradeBox = document.getElementById("tradeBox");
const confirmSection = document.getElementById("confirmSection");
const readyTag = document.getElementById("readyTag");

const checkboxEls = Array.from(document.querySelectorAll('input[type="checkbox"][data-owner]'));

function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }

newTradeBtn.addEventListener("click", () => {
  show(tradeForm);
  weSendEl.focus();
});

cancelBtn.addEventListener("click", () => {
  hide(tradeForm);
  tradeForm.reset();
});

// Submit new trade proposal
tradeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const weSend = (weSendEl.value || "").trim();
  const weReceive = (weReceiveEl.value || "").trim();

  if (!weSend || !weReceive) {
    alert("Please fill out both: We send and We receive.");
    return;
  }

  // Reset approvals to false
  const approvals = {};
  for (const o of OWNERS) approvals[o] = false;

  const payload = {
    weSend,
    weReceive,
    approvals,
    createdAt: Date.now()
  };

  await set(tradeRef, payload);

  hide(tradeForm);
  tradeForm.reset();
});

// Listen for real-time updates
onValue(tradeRef, (snap) => {
  const data = snap.val();

  if (!data) {
    tradeBox.innerHTML = `<div class="muted">No trade proposal yet. Tap “Enter new Trade Proposal”.</div>`;
    hide(confirmSection);
    return;
  }

  const approvals = data.approvals || {};
  const checkedCount = OWNERS.filter(o => approvals[o] === true).length;
  const allChecked = checkedCount === OWNERS.length;

  tradeBox.innerHTML = `
    <div class="tradeLine">
      <span class="badge">Active Trade</span>
      <span class="muted">Approvals: <b>${checkedCount}/${OWNERS.length}</b></span>
      ${allChecked ? `<span class="badge" style="background: rgba(47,209,161,.15); border-color: rgba(47,209,161,.3);">✅ Trade ready to send</span>` : ``}
    </div>
    <div class="kv">
      <div><b>We send:</b> ${escapeHtml(data.weSend)}</div>
      <div><b>We receive:</b> ${escapeHtml(data.weReceive)}</div>
    </div>
  `;

  show(confirmSection);

  // Update checkboxes to match DB
  checkboxEls.forEach(cb => {
    const owner = cb.dataset.owner;
    cb.checked = approvals[owner] === true;
  });

  if (allChecked) show(readyTag);
  else hide(readyTag);
});

// When someone toggles a checkbox, write to Firebase
checkboxEls.forEach(cb => {
  cb.addEventListener("change", async () => {
    const owner = cb.dataset.owner;
    const path = `dynasty5/currentTrade/approvals/${owner}`;
    await update(ref(db), { [path]: cb.checked });
  });
});

// Simple HTML escape for display
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br/>");
}
