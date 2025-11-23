console.log("✅ chat.js loaded (Media Sharing Enabled)");

// config + state
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

// DOM Elements
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

// Media Elements
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");

meNameEl.textContent = currentUserName;

// socket initialization
const socket = io(window.location.origin, { auth: { token } });
socket.on("connect", () => console.log("Socket connected:", socket.id));

// helpers
const el = (tag, cls) => { const d = document.createElement(tag); if (cls) d.className = cls; return d; };
const time = ts => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const generateRoomId = (a,b) => [a.trim().toLowerCase(), b.trim().toLowerCase()].sort().join("_");
const clearMessages = () => { chatMessages.innerHTML = ""; };

// ==========================================
//  MESSAGE RENDERING (Handles Text & Media)
// ==========================================
function appendMessage({ senderIdOrEmail, senderName, text, ts }) {
  const isMe = (senderIdOrEmail == currentUserId || senderIdOrEmail == currentUserEmail);
  const div = el("div", "msg " + (isMe ? "msg--me" : "msg--them"));

  // Detect if the text is likely a URL (Simple check)
  const isUrl = text.startsWith("http");
  
  // Regex to check file extensions
  const isImage = isUrl && (text.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) != null);
  const isVideo = isUrl && (text.match(/\.(mp4|webm|ogg|mov)$/i) != null);

  let contentHtml = "";

  if (isImage) {
    contentHtml = `<img src="${text}" class="msg__image" alt="Shared image" onclick="window.open('${text}', '_blank')" />`;
  } else if (isVideo) {
    contentHtml = `<video src="${text}" controls class="msg__image"></video>`;
  } else if (isUrl && (text.includes("s3") || text.includes("amazonaws"))) {
    // Fallback for other files (PDFs, docs)
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

// 1. Trigger Hidden Input
attachBtn.addEventListener("click", () => {
  fileInput.click();
});

// 2. Handle File Selection
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Determine Context
  let context = null;
  let idOrUuid = null;
  let receiverEmail = null;

  if (activeGroupUuid) {
    context = "group";
    idOrUuid = activeGroupUuid;
  } else if (currentRoomId) {
    context = "private";
    idOrUuid = currentRoomId;
    receiverEmail = currentReceiver.email;
  } else {
    alert("Please select a chat first.");
    fileInput.value = ""; // Reset so change event works next time
    return;
  }

  // Prepare Form Data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("context", context);
  formData.append("idOrUuid", idOrUuid);
  
  // If private, we might need the receiver email depending on backend logic
  if (receiverEmail) formData.append("receiverEmail", receiverEmail);

  // UI Feedback
  const originalIcon = attachBtn.textContent;
  attachBtn.textContent = "⏳";
  attachBtn.disabled = true;

  try {
    // Send to Backend
    await axios.post(`${apiBase}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    
    console.log("File uploaded successfully");
    // Note: We don't manually append the message here. 
    // The backend will emit a socket event, which triggers 'new_message' or 'group_message' listeners below.

  } catch (err) {
    console.error("Upload failed", err);
    alert("Failed to upload file: " + (err.response?.data?.error || err.message));
  } finally {
    attachBtn.textContent = originalIcon;
    attachBtn.disabled = false;
    fileInput.value = ""; // Reset input
  }
});

// ==========================================
//  LIST & CHAT LOGIC (Standard)
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

// search debounce
let searchTimer = null;
sidebarSearch.addEventListener("input", e => {
  const q = e.target.value.trim();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadUsers(q), 250);
});

// click handlers
usersList.addEventListener("click", ev => {
  const item = ev.target.closest(".list__item");
  if (!item) return;
  const email = item.dataset.email;
  if (!email) return;
  const user = { email, name: item.querySelector(".item__title").textContent };
  openPersonalChat(user).catch(console.error);
});

groupsList.addEventListener("click", ev => {
  const item = ev.target.closest(".list__item");
  if (!item) return;
  const uuid = item.dataset.groupUuid;
  if (!uuid) return;
  const name = item.querySelector(".item__title").textContent;
  openGroupChat({ uuid, name }).catch(console.error);
});

async function openPersonalChat(user){
  if (!user || !user.email) return console.warn("invalid user", user);

  activeGroupUuid = null;
  currentRoomId = generateRoomId(currentUserEmail, user.email);
  currentReceiver = user;

  if (!currentRoomId || currentRoomId.includes("undefined")) {
    console.error("Invalid roomId:", currentRoomId);
    return;
  }

  socket.emit("join_room", currentRoomId);

  const displayKey = `roomDisplay_${currentRoomId}`;
  let displayName = localStorage.getItem(displayKey);
  if (!displayName) {
    displayName = `${currentUserName} & ${user.name}`;
    localStorage.setItem(displayKey, displayName);
  }

  chatTitle.textContent = displayName;
  chatSubtitle.textContent = user.email;
  chatAvatar.textContent = (user.name||'U').slice(0,1).toUpperCase();
  backBtn.hidden = false;

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
  if (!group || !group.uuid) return;
  activeGroupUuid = group.uuid;
  currentRoomId = null;
  currentReceiver = null;

  socket.emit("join_group", activeGroupUuid);

  chatTitle.textContent = group.name;
  chatSubtitle.textContent = "";
  chatAvatar.textContent = (group.name||'G').slice(0,1).toUpperCase();
  backBtn.hidden = false;

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
  activeGroupUuid = null;
  currentRoomId = null;
  currentReceiver = null;
  backBtn.hidden = true;

  chatTitle.textContent = "Personal / Group Chat";
  chatSubtitle.textContent = "";
  chatAvatar.textContent = "GC";

  loadUsers();
  loadGroups();
  localStorage.setItem("lastChat", JSON.stringify({ mode: "lists" }));
});

// send
chatForm.addEventListener("submit", async e => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  // group mode
  if (activeGroupUuid) {
    socket.emit("group_message", { groupUuid: activeGroupUuid, senderId: currentUserId, text });
    chatInput.value = ""; sendBtn.disabled = true;
    return;
  }

  // personal mode
  if (currentRoomId && currentReceiver) {
    const displayName = localStorage.getItem(`roomDisplay_${currentRoomId}`) || `${currentUserName} & ${currentReceiver.name}`;
    socket.emit("new_message", {
      roomId: currentRoomId,
      senderEmail: currentUserEmail,
      receiverEmail: currentReceiver.email,
      message: text,
      roomDisplay: displayName
    });
    chatInput.value = ""; sendBtn.disabled = true;
    return;
  }
});

chatInput.addEventListener("input", () => { sendBtn.disabled = chatInput.value.trim().length === 0; });

// socket listeners
socket.on("new_message", payload => {
  if (payload.senderEmail !== currentUserEmail) {
    if (document.visibilityState === "hidden" && window.Notification && Notification.permission === "granted") {
      new Notification(payload.senderName || payload.senderEmail, { body: payload.message });
    }
  }

  if (payload.roomDisplay && currentRoomId && payload.roomId === currentRoomId) {
    localStorage.setItem(`roomDisplay_${payload.roomId}`, payload.roomDisplay);
    chatTitle.textContent = payload.roomDisplay;
  }

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

// create group
createGroupBtnSmall.addEventListener("click", async () => {
  const name = prompt("Group name:");
  if (!name) return;
  try {
    const res = await axios.post(`${apiBase}/groups`, { name });
    const group = res.data.group;
    await loadGroups();
    if (group?.uuid) openGroupChat({ uuid: group.uuid, name: group.name });
  } catch (e) { console.error("create group", e); alert("Failed to create group"); }
});

// request permission for notifications
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission().catch(()=>{});
}

logoutBtn.addEventListener("click", () => { localStorage.clear(); location.reload(); });