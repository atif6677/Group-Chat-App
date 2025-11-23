console.log("✅ chat.js loaded (Media + AI Enabled)");

// ==========================================
//  CONFIG & STATE
// ==========================================
const apiBase = "/api";
const token = localStorage.getItem("token");
const currentUserId = localStorage.getItem("userId");
const currentUserEmail = localStorage.getItem("email");
const currentUserName = localStorage.getItem("userName") || "You";

if (!token || !currentUserId) {
  alert("You are not logged in. Please login first.");
}

axios.defaults.headers.common.Authorization = "Bearer " + token;

let currentRoomId = null;    // personal room (email_email)
let activeGroupUuid = null;  // group room
let currentReceiver = null;  // {name,email}

// ==========================================
//  DOM ELEMENTS
// ==========================================
const meNameEl = document.getElementById("meName");
const sidebarSearch = document.getElementById("sidebarSearch");
const usersList = document.getElementById("usersList");
const groupsList = document.getElementById("groupsList");
const chatTitle = document.getElementById("chatTitle");
const chatSubtitle = document.getElementById("chatSubtitle");
const chatAvatar = document.getElementById("chatAvatar");
const chatMessages = document.getElementById("chatMessages");
const backBtn = document.getElementById("backBtn");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const createGroupBtnSmall = document.getElementById("createGroupBtnSmall");
const logoutBtn = document.getElementById("logoutBtn");

// Media & AI Elements
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const aiSuggestions = document.getElementById("aiSuggestions"); // New AI Container

meNameEl.textContent = currentUserName;

// ==========================================
//  SOCKET INITIALIZATION
// ==========================================
const socket = io(window.location.origin, { auth: { token } });
socket.on("connect", () => console.log("Socket connected:", socket.id));

// ==========================================
//  HELPERS
// ==========================================
const el = (tag, cls) => { const d = document.createElement(tag); if (cls) d.className = cls; return d; };
const time = ts => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const generateRoomId = (a,b) => [a.trim().toLowerCase(), b.trim().toLowerCase()].sort().join("_");

const clearMessages = () => { 
  chatMessages.innerHTML = ""; 
  aiSuggestions.innerHTML = ""; 
};

// ==========================================
//  AI LOGIC (Gemini Integration)
// ==========================================

// Utility: Prevent calling API on every single keystroke
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Render AI Chips (Suggestions or Replies)
function renderChips(items, type = "prediction") {
  aiSuggestions.innerHTML = "";
  aiSuggestions.style.display = "flex";

  items.forEach(text => {
    const chip = document.createElement("div");
    chip.className = "ai-suggestion";
    chip.textContent = text;

    chip.onclick = () => {
      if (type === "prediction") {
        chatInput.value += (chatInput.value.endsWith(" ") ? "" : " ") + text + " ";
      } else {
        chatInput.value = text;
      }

      chatInput.focus();
      sendBtn.disabled = false;
      aiSuggestions.innerHTML = "";
    };

    aiSuggestions.appendChild(chip);
  });
}


// 1. Predictive Typing Handler
const handleTyping = debounce(async (e) => {
  const text = e.target.value;
  // Only predict if user has typed enough context (3+ chars)
  if (text.length < 3) return; 

  try {
    const res = await axios.post(`${apiBase}/ai/predict`, { text });
    if (res.data.suggestions && res.data.suggestions.length > 0) {
      renderChips(res.data.suggestions, 'prediction');
    }
  } catch (err) {
    // Silent fail for AI features so it doesn't annoy user
    console.error("AI Prediction failed:", err.message);
  }
}, 600); // Wait 600ms after stop typing before calling API

// ==========================================
//  MESSAGE RENDERING (Text + Media)
// ==========================================
function appendMessage({ senderIdOrEmail, senderName, text, ts }) {
  const isMe = (senderIdOrEmail == currentUserId || senderIdOrEmail == currentUserEmail);
  const div = el("div", "msg " + (isMe ? "msg--me" : "msg--them"));

  // Check if text is a URL
  const isUrl = text.startsWith("http");
  // Simple regex for file extensions
  const isImage = isUrl && (text.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) != null);
  const isVideo = isUrl && (text.match(/\.(mp4|webm|ogg|mov)$/i) != null);

  let contentHtml = "";

  if (isImage) {
    contentHtml = `<img src="${text}" class="msg__image" alt="Shared image" onclick="window.open('${text}', '_blank')" />`;
  } else if (isVideo) {
    contentHtml = `<video src="${text}" controls class="msg__image"></video>`;
  } else if (isUrl && (text.includes("s3") || text.includes("amazonaws"))) {
    // It's a file URL but not an image/video we can embed
    contentHtml = `<div class="msg__text"><a href="${text}" target="_blank" class="msg__file-link">📄 Download File</a></div>`;
  } else {
    // Standard text message
    contentHtml = `<div class="msg__text">${text}</div>`;
  }

  div.innerHTML = `
    <div class="msg__name">${senderName}</div>
    ${contentHtml}
    <div class="msg__meta">${time(ts)}</div>
  `;
  
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================
//  MEDIA UPLOAD LOGIC
// ==========================================
attachBtn.addEventListener("click", () => { fileInput.click(); });

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  let context = null, idOrUuid = null, receiverEmail = null;

  if (activeGroupUuid) {
    context = "group"; idOrUuid = activeGroupUuid;
  } else if (currentRoomId) {
    context = "private"; idOrUuid = currentRoomId; receiverEmail = currentReceiver.email;
  } else {
    alert("Please select a chat first."); fileInput.value = ""; return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("context", context);
  formData.append("idOrUuid", idOrUuid);
  if (receiverEmail) formData.append("receiverEmail", receiverEmail);

  // UI Feedback
  const originalIcon = attachBtn.textContent;
  attachBtn.textContent = "⏳";
  attachBtn.disabled = true;

  try {
    await axios.post(`${apiBase}/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    console.log("File uploaded successfully");
  } catch (err) {
    console.error("Upload failed", err);
    alert("Failed to upload file.");
  } finally {
    attachBtn.textContent = originalIcon; attachBtn.disabled = false; fileInput.value = "";
  }
});

// ==========================================
//  LIST LOADING LOGIC
// ==========================================
function formatUserItem(user){
  const item = el("div", "list__item");
  item.dataset.email = user.email;
  item.innerHTML = `
    <div class="item__avatar">${(user.name||'U').slice(0,1).toUpperCase()}</div>
    <div class="item__meta">
      <div class="item__title">${user.name}</div>
      <div class="item__sub">${user.email}</div>
    </div>
  `;
  return item;
}

function formatGroupItem(group){
  const item = el("div", "list__item");
  item.dataset.groupUuid = group.uuid;
  item.innerHTML = `
    <div class="item__avatar">${(group.name||'G').slice(0,1).toUpperCase()}</div>
    <div class="item__meta">
      <div class="item__title">${group.name}</div>
      <div class="item__sub">Group • ${group.uuid}</div>
    </div>
  `;
  return item;
}

async function loadUsers(q=""){
  try {
    const res = await axios.get(`${apiBase}/users/search?query=${encodeURIComponent(q)}`);
    const users = res.data.users.filter(u => u.email !== currentUserEmail);
    usersList.innerHTML = "";
    users.forEach(u => usersList.appendChild(formatUserItem(u)));
  } catch (err) { console.error("loadUsers:", err); }
}

async function loadGroups(){
  try {
    const res = await axios.get(`${apiBase}/groups`);
    groupsList.innerHTML = "";
    res.data.groups.forEach(g => groupsList.appendChild(formatGroupItem(g)));
  } catch (err) { console.error("loadGroups:", err); }
}

loadUsers();
loadGroups();

let searchTimer = null;
sidebarSearch.addEventListener("input", e => {
  const q = e.target.value.trim();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadUsers(q), 250);
});

// ==========================================
//  NAVIGATION & CHAT OPENING
// ==========================================
usersList.addEventListener("click", ev => {
  const item = ev.target.closest(".list__item");
  if (!item) return;
  const email = item.dataset.email;
  const name = item.querySelector(".item__title").textContent;
  openPersonalChat({ email, name }).catch(console.error);
});

groupsList.addEventListener("click", ev => {
  const item = ev.target.closest(".list__item");
  if (!item) return;
  const uuid = item.dataset.groupUuid;
  const name = item.querySelector(".item__title").textContent;
  openGroupChat({ uuid, name }).catch(console.error);
});

async function openPersonalChat(user){
  activeGroupUuid = null;
  currentRoomId = generateRoomId(currentUserEmail, user.email);
  currentReceiver = user;

  socket.emit("join_room", currentRoomId);

  const displayKey = `roomDisplay_${currentRoomId}`;
  let displayName = localStorage.getItem(displayKey) || `${currentUserName} & ${user.name}`;
  
  chatTitle.textContent = displayName;
  chatSubtitle.textContent = user.email;
  chatAvatar.textContent = (user.name||'U').slice(0,1).toUpperCase();
  backBtn.hidden = false;
  aiSuggestions.innerHTML = ""; // Reset chips

  try {
    const res = await axios.get(`${apiBase}/private/messages?roomId=${encodeURIComponent(currentRoomId)}`);
    clearMessages();
    res.data.messages.forEach(m => appendMessage({
      senderIdOrEmail: m.senderEmail,
      senderName: m.senderEmail === currentUserEmail ? "You" : (m.senderName || m.senderEmail),
      text: m.message,
      ts: new Date(m.createdAt).getTime()
    }));
  } catch (e) { console.error("load private history", e); clearMessages(); }

  localStorage.setItem("lastChat", JSON.stringify({ mode: "personal", roomId: currentRoomId, receiverEmail: user.email }));
}

async function openGroupChat(group){
  activeGroupUuid = group.uuid;
  currentRoomId = null;
  currentReceiver = null;

  socket.emit("join_group", activeGroupUuid);

  chatTitle.textContent = group.name;
  chatSubtitle.textContent = "";
  chatAvatar.textContent = (group.name||'G').slice(0,1).toUpperCase();
  backBtn.hidden = false;
  aiSuggestions.innerHTML = ""; // Reset chips

  try {
    const res = await axios.get(`${apiBase}/groups/${encodeURIComponent(activeGroupUuid)}/messages`);
    clearMessages();
    res.data.messages.forEach(m => appendMessage({
      senderIdOrEmail: m.senderId,
      senderName: m.senderName,
      text: m.text,
      ts: new Date(m.createdAt).getTime()
    }));
  } catch (e) { console.error("load group history", e); clearMessages(); }

  localStorage.setItem("lastChat", JSON.stringify({ mode: "group", groupUuid: activeGroupUuid }));
}

backBtn.addEventListener("click", () => {
  activeGroupUuid = null; currentRoomId = null; currentReceiver = null; backBtn.hidden = true;
  chatTitle.textContent = "Personal / Group Chat"; chatSubtitle.textContent = ""; chatAvatar.textContent = "GC";
  loadUsers(); loadGroups(); aiSuggestions.innerHTML = "";
  localStorage.setItem("lastChat", JSON.stringify({ mode: "lists" }));
});

// ==========================================
//  SENDING MESSAGES & INPUT HANDLERS
// ==========================================

// Chat Input Listener: Triggers AI Prediction + Button State
chatInput.addEventListener("input", (e) => {
  sendBtn.disabled = e.target.value.trim().length === 0;
  handleTyping(e); // <--- AI PREDICTION TRIGGER
});

chatForm.addEventListener("submit", async e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  if (activeGroupUuid) {
    socket.emit("group_message", { groupUuid: activeGroupUuid, senderId: currentUserId, text });
  } else if (currentRoomId && currentReceiver) {
    const displayName = localStorage.getItem(`roomDisplay_${currentRoomId}`) || `${currentUserName} & ${currentReceiver.name}`;
    socket.emit("new_message", { roomId: currentRoomId, senderEmail: currentUserEmail, receiverEmail: currentReceiver.email, message: text, roomDisplay: displayName });
  }
  
  chatInput.value = ""; 
  sendBtn.disabled = true; 
  aiSuggestions.innerHTML = ""; // Clear AI suggestions on send
});

// ==========================================
//  SOCKET LISTENERS & SMART REPLIES
// ==========================================

socket.on("new_message", async payload => {
  // 1. Notification logic
  if (payload.senderEmail !== currentUserEmail) {
    if (document.visibilityState === "hidden" && window.Notification && Notification.permission === "granted") {
      new Notification(payload.senderName || payload.senderEmail, { body: payload.message });
    }

    // 2. AI SMART REPLY TRIGGER (Only for incoming private messages from others)
    try {
      const res = await axios.post(`${apiBase}/ai/reply`, { message: payload.message });
      if (res.data.replies && res.data.replies.length > 0) {
        renderChips(res.data.replies, 'reply');
      }
    } catch (err) { console.error("AI Reply failed", err.message); }
  }

  // 3. Room Title logic
  if (payload.roomDisplay && currentRoomId && payload.roomId === currentRoomId) {
    localStorage.setItem(`roomDisplay_${payload.roomId}`, payload.roomDisplay);
    chatTitle.textContent = payload.roomDisplay;
  }

  // 4. Render message
  appendMessage({
    senderIdOrEmail: payload.senderEmail,
    senderName: payload.senderName || payload.senderEmail,
    text: payload.message,
    ts: payload.ts || Date.now()
  });
});

socket.on("group_message", payload => {
  appendMessage({ 
    senderIdOrEmail: payload.senderId, 
    senderName: payload.senderName, 
    text: payload.text, 
    ts: payload.ts || Date.now() 
  });
});

// ==========================================
//  MISC
// ==========================================
createGroupBtnSmall.addEventListener("click", async () => {
  const name = prompt("Group name:");
  if (!name) return;
  try {
    const res = await axios.post(`${apiBase}/groups`, { name });
    await loadGroups();
    if (res.data.group?.uuid) openGroupChat({ uuid: res.data.group.uuid, name: res.data.group.name });
  } catch (e) { console.error("create group", e); alert("Failed to create group"); }
});

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission().catch(()=>{});
}

logoutBtn.addEventListener("click", () => { localStorage.clear(); location.reload(); });