console.log("✅ chat.js loaded successfully");

// ====== AUTH ======
const token = localStorage.getItem("token");
const currentUserId = localStorage.getItem("userId");
const currentUserName = localStorage.getItem("userName") || "You";

const apiBase = "http://localhost:3000/api";

// ====== SOCKET.IO INIT ======
const socket = io(window.location.origin, {
  auth: { token }
});

// ====== ELEMENTS ======
const messagesEl = document.getElementById("chatMessages");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("chatInput");
const sendBtnEl = document.getElementById("sendBtn");

const searchInput = document.getElementById("userSearchInput");
const searchResultsEl = document.getElementById("userSearchResults");

// ====== SEND BUTTON ENABLE/DISABLE ======
inputEl.addEventListener("input", () => {
  sendBtnEl.disabled = inputEl.value.trim().length === 0;
});

// ====== APPEND MESSAGE TO UI ======
function appendMessage({ userId, name, text, ts }) {
  const div = document.createElement("div");
  div.classList.add("msg", userId == currentUserId ? "msg--me" : "msg--them");

  div.innerHTML = `
    <div class="msg__name">${name}</div>
    <div class="msg__text">${text}</div>
    <div class="msg__meta">${new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
  `;

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ====== LOAD GROUP MESSAGES ======
async function loadMessages() {
  try {
    const res = await axios.get(`${apiBase}/messages`, {
      headers: { Authorization: "Bearer " + token }
    });

    const allMessages = res.data.messages.map((msg) => ({
      id: msg.id,
      userId: msg.userId,
      name: msg.User?.name || "User",
      text: msg.message,
      ts: new Date(msg.createdAt).getTime()
    }));

    messagesEl.innerHTML = "";
    allMessages.forEach(appendMessage);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
  }
}

loadMessages();

// ====== RECEIVE GROUP MESSAGE ======
socket.on("message", (msg) => {
  appendMessage(msg);
});

// ====== SEND GROUP MESSAGE ======
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = inputEl.value.trim();
  if (!text) return;

  try {
    await axios.post(`${apiBase}/messages`,
      { userId: currentUserId, message: text },
      { headers: { Authorization: "Bearer " + token } }
    );

    inputEl.value = "";
    sendBtnEl.disabled = true;
  } catch (err) {
    console.error("❌ Failed to send message:", err.response?.data || err);
  }
});

// ======================================================
// 🔥 PERSONAL CHAT SYSTEM BELOW
// ======================================================

// ====== JOIN PERSONAL ROOM ======
function joinPersonalRoom(otherUserId) {
  const roomId = [currentUserId, otherUserId].sort().join("_");
  socket.emit("join_room", roomId);
  console.log("🔵 Joined personal room:", roomId);
  return roomId;
}

function sendPersonalMessage(roomId, receiverId, text) {
  socket.emit("new_message", {
    roomId,
    senderId: currentUserId,
    receiverId,
    message: text
  });
}

// ====== RECEIVE PERSONAL MESSAGE ======
socket.on("receive_message", (msg) => {
  console.log("📨 Personal message received:", msg);
  appendMessage({
    userId: msg.senderId,
    name: msg.senderId == currentUserId ? "You" : "User " + msg.senderId,
    text: msg.message,
    ts: msg.ts
  });
});

// ======================================================
// 🔍 USER SEARCH SYSTEM
// ======================================================

// ====== Search users API ======
async function searchUsers(query) {
  if (!query.trim()) {
    searchResultsEl.style.display = "none";
    return;
  }

  try {
    const res = await axios.get(`${apiBase}/users/search?query=${query}`, {
      headers: { Authorization: "Bearer " + token }
    });

    const users = res.data.users.filter(u => u.id != currentUserId);

    renderSearchResults(users);
  } catch (err) {
    console.error("User search failed:", err);
  }
}

// ====== Render dropdown ======
function renderSearchResults(users) {
  if (users.length === 0) {
    searchResultsEl.innerHTML = `<div class="user-search__item">No users found</div>`;
  } else {
    searchResultsEl.innerHTML = users
      .map(u => `<div class="user-search__item" data-id="${u.id}" data-name="${u.name}">${u.name}</div>`)
      .join("");
  }

  searchResultsEl.style.display = "block";
}

// ====== Search bar input listener ======
searchInput.addEventListener("input", (e) => {
  searchUsers(e.target.value);
});

// ====== When clicking a user from dropdown ======
searchResultsEl.addEventListener("click", (e) => {
  if (!e.target.classList.contains("user-search__item")) return;

  const otherUserId = e.target.dataset.id;
  const otherUserName = e.target.dataset.name;

  const roomId = joinPersonalRoom(otherUserId);

  alert(`Starting chat with ${otherUserName}`);

  searchResultsEl.style.display = "none";
  searchInput.value = "";
});
