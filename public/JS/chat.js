console.log("✅ chat.js loaded successfully");

// --------------------------------------------------
// GLOBAL VARIABLES
// --------------------------------------------------
const token = localStorage.getItem("token");
const currentUserId = localStorage.getItem("userId");
const currentUserEmail = localStorage.getItem("email");
const currentUserName = localStorage.getItem("userName") || "You";
const apiBase = "http://localhost:3000/api";

// DOM ELEMENTS
const messagesEl = document.getElementById("chatMessages");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("chatInput");
const sendBtnEl = document.getElementById("sendBtn");

const searchInput = document.getElementById("userSearchInput");
const searchResultsEl = document.getElementById("userSearchResults");

const groupNameInput = document.getElementById("groupNameInput");
const createGroupBtn = document.getElementById("createGroupBtn");
const groupSelect = document.getElementById("groupSelect");
const joinGroupBtn = document.getElementById("joinGroupBtn");

// STATE
let currentRoomId = null;        
let currentReceiverEmail = null;  
let activeGroupId = null;         


// --------------------------------------------------
// SOCKET.IO INIT
// --------------------------------------------------
const socket = io(window.location.origin, {
  auth: { token }
});


// --------------------------------------------------
// UTILITY FUNCTIONS
// --------------------------------------------------
function appendMessage({ userId, name, text, ts }) {
  const div = document.createElement("div");
  div.classList.add(
    "msg",
    userId == currentUserId || userId == currentUserEmail
      ? "msg--me"
      : "msg--them"
  );

  div.innerHTML = `
    <div class="msg__name">${name}</div>
    <div class="msg__text">${text}</div>
    <div class="msg__meta">${new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })}</div>
  `;

  messagesEl.append(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function generateRoomId(email1, email2) {
  return [email1.trim().toLowerCase(), email2.trim().toLowerCase()]
    .sort()
    .join("_");
}

async function verifyUserEmail(email) {
  try {
    const res = await axios.get(`${apiBase}/users/search?query=${email}`, {
      headers: { Authorization: "Bearer " + token }
    });
    return res.data.users.find(u => u.email === email) || null;
  } catch {
    return null;
  }
}


// --------------------------------------------------
// LOAD GLOBAL CHAT
// --------------------------------------------------
async function loadGlobalMessages() {
  try {
    const res = await axios.get(`${apiBase}/messages`, {
      headers: { Authorization: "Bearer " + token }
    });

    messagesEl.innerHTML = "";

    res.data.messages.forEach(msg =>
      appendMessage({
        userId: msg.userId,
        name: msg.User?.name || "User",
        text: msg.message,
        ts: new Date(msg.createdAt).getTime()
      })
    );
  } catch (err) {
    console.error("❌ Global messages load error:", err);
  }
}

loadGlobalMessages();


// --------------------------------------------------
// PERSONAL CHAT — FIXED!
// --------------------------------------------------
async function joinPersonalChat(receiverEmail) {
  activeGroupId = null;   // EXIT group mode

  const validUser = await verifyUserEmail(receiverEmail);
  if (!validUser) {
    alert("❌ User not found!");
    return;
  }

  currentReceiverEmail = receiverEmail;

  currentRoomId = generateRoomId(currentUserEmail, receiverEmail);
  console.log("🟢 Joining personal room:", currentRoomId);

  socket.emit("join_room", currentRoomId);

  // LOAD PRIVATE HISTORY
  const history = await axios.get(
    `${apiBase}/private/messages?roomId=${currentRoomId}`,
    { headers: { Authorization: "Bearer " + token } }
  );

  messagesEl.innerHTML = "";

  history.data.messages.forEach(m => {
    appendMessage({
      userId: m.senderEmail,
      name: m.senderEmail === currentUserEmail ? "You" : m.senderEmail,
      text: m.message,
      ts: new Date(m.createdAt).getTime()
    });
  });
}

function sendPersonalMessage(text) {
  socket.emit("new_message", {
    roomId: currentRoomId,
    senderEmail: currentUserEmail,
    receiverEmail: currentReceiverEmail,
    message: text
  });

  // DO NOT append manually (avoid duplicates)
}

socket.on("new_message", (msg) => {
  appendMessage({
    userId: msg.senderEmail,
    name: msg.senderName || msg.senderEmail,
    text: msg.message,
    ts: msg.ts
  });
});


// --------------------------------------------------
// SEARCH USERS
// --------------------------------------------------
searchInput?.addEventListener("input", async (e) => {
  const q = e.target.value.trim();

  if (!q) {
    searchResultsEl.style.display = "none";
    return;
  }

  const res = await axios.get(`${apiBase}/users/search?query=${q}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const users = res.data.users.filter(u => u.email !== currentUserEmail);

  searchResultsEl.innerHTML = users.length
    ? users
        .map(u => `<div class="user-search__item" data-email="${u.email}">
              ${u.name} (${u.email})
           </div>`)
        .join("")
    : `<div class="user-search__item">No users found</div>`;

  searchResultsEl.style.display = "block";
});

searchResultsEl?.addEventListener("click", async (e) => {
  const email = e.target.dataset.email;
  if (!email) return;

  await joinPersonalChat(email);

  searchInput.value = "";
  searchResultsEl.style.display = "none";
});


// --------------------------------------------------
// GROUP CHAT
// --------------------------------------------------
async function loadGroups() {
  const res = await axios.get(`${apiBase}/groups`, {
    headers: { Authorization: "Bearer " + token }
  });

  groupSelect.innerHTML = `<option value="">-- Select Group --</option>`;

  res.data.groups.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    groupSelect.append(opt);
  });
}

loadGroups();

createGroupBtn?.addEventListener("click", async () => {
  const name = groupNameInput.value.trim();
  if (!name) return alert("Enter a group name");

  try {
    await axios.post(
      `${apiBase}/groups`,
      { name },
      { headers: { Authorization: "Bearer " + token } }
    );

    groupNameInput.value = "";
    await loadGroups();
    alert("Group created!");
  } catch {
    alert("Failed to create group");
  }
});

joinGroupBtn?.addEventListener("click", async () => {
  const groupId = groupSelect.value;
  if (!groupId) return alert("Select a group");

  activeGroupId = groupId;
  currentRoomId = null;   // disable direct chat mode

  socket.emit("join_group", groupId);

  const res = await axios.get(`${apiBase}/groups/${groupId}/messages`, {
    headers: { Authorization: "Bearer " + token }
  });

  messagesEl.innerHTML = "";

  res.data.messages.forEach(m =>
    appendMessage({
      userId: m.senderId,
      name: m.senderName,
      text: m.text,
      ts: new Date(m.createdAt).getTime()
    })
  );
});

socket.on("group_message", (msg) => {
  appendMessage({
    userId: msg.senderId,
    name: msg.senderName,
    text: msg.text,
    ts: msg.ts
  });
});


// --------------------------------------------------
// SEND MESSAGE
// --------------------------------------------------
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  // GROUP CHAT
  if (activeGroupId) {
    socket.emit("group_message", {
      groupId: activeGroupId,
      senderId: currentUserId,
      text
    });

    inputEl.value = "";
    sendBtnEl.disabled = true;
    return;
  }

  // PERSONAL CHAT
  if (currentRoomId) {
    sendPersonalMessage(text);
    inputEl.value = "";
    sendBtnEl.disabled = true;
    return;
  }

  // GLOBAL CHAT
  try {
    await axios.post(
      `${apiBase}/messages`,
      { userId: currentUserId, message: text },
      { headers: { Authorization: "Bearer " + token } }
    );
  } catch {
    console.error("Global message send failed");
  }

  inputEl.value = "";
  sendBtnEl.disabled = true;
});

// Enable/disable Send BTN
inputEl.addEventListener("input", () => {
  sendBtnEl.disabled = inputEl.value.trim().length === 0;
});

// Global chat socket listener
socket.on("message", (msg) => appendMessage(msg));
