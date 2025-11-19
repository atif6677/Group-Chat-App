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


// Create unique room from two emails
function createRoomId(email1, email2) {
  return [email1, email2].sort().join("_");
}

// Selected room state
let activeRoomId = null;
let activeReceiverEmail = null;

// Join a personal room
function joinPersonalRoom(receiverEmail) {
  const myEmail = localStorage.getItem("email");
  const roomId = createRoomId(myEmail, receiverEmail);

  activeRoomId = roomId;
  activeReceiverEmail = receiverEmail;

  socket.emit("join_room", roomId);
  console.log("🔵 Joined Personal Room:", roomId);

  // Clear old chat UI for new private chat
  messagesEl.innerHTML = "";
  return roomId;
}

// Send personal message
function sendPersonalMessage(text) {
  if (!activeRoomId || !activeReceiverEmail) {
    console.warn("❌ No personal room selected.");
    return;
  }

  socket.emit("new_message", {
    roomId: activeRoomId,
    senderEmail: localStorage.getItem("email"),
    receiverEmail: activeReceiverEmail,
    message: text,
  });

  // Show your own message instantly
  appendMessage({
    userId: currentUserId,
    name: "You",
    text,
    ts: Date.now()
  });
}

// Listen for incoming private messages
socket.on("new_message", (msg) => {
  console.log("📩 Private Message Received:", msg);

  appendMessage({
    userId: msg.senderId,
    name: msg.senderEmail,
    text: msg.message,
    ts: msg.ts
  });
});

// ===============================
// SEARCH USER → JOIN ROOM
// ===============================

// handle click on search result
searchResultsEl.addEventListener("click", (e) => {
  if (e.target.classList.contains("user-search__item")) {
    const receiverEmail = e.target.dataset.email;

    joinPersonalRoom(receiverEmail);

    searchResultsEl.style.display = "none";
    searchInput.value = "";
  }
});
