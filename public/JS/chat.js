console.log("✅ chat.js loaded");

const token = localStorage.getItem("token");
const currentUserEmail = localStorage.getItem("email");
const currentUserId = localStorage.getItem("userId");

const apiBase = "http://localhost:3000/api";

const socket = io(window.location.origin, {
  auth: { token }
});

// DOM ELEMENTS
const messagesEl = document.getElementById("chatMessages");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("chatInput");
const sendBtnEl = document.getElementById("sendBtn");
const searchInput = document.getElementById("userSearchInput");
const searchResultsEl = document.getElementById("userSearchResults");

// STATE
let currentRoomId = null;
let currentReceiverEmail = null;

// UTILITY FUNCTIONS
function generateRoomId(email1, email2) {
  return [email1.trim().toLowerCase(), email2.trim().toLowerCase()].sort().join("_");
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

// GROUP CHAT LOAD
async function loadMessages() {
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
    console.error("Failed loading messages:", err);
  }
}
loadMessages();

// GROUP CHAT SEND
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  if (!currentRoomId) {
    // GROUP CHAT MODE
    try {
      await axios.post(`${apiBase}/messages`, {
        userId: currentUserId,
        message: text
      }, {
        headers: { Authorization: "Bearer " + token }
      });

      inputEl.value = "";
      sendBtnEl.disabled = true;

    } catch (err) {
      console.error("Send failed", err);
    }
  } else {
    // PRIVATE CHAT MODE
    sendPersonalMessage(text);
    inputEl.value = "";
    sendBtnEl.disabled = true;
  }
});

// ENABLE / DISABLE SEND BUTTON
inputEl.addEventListener("input", () => {
  sendBtnEl.disabled = inputEl.value.trim().length === 0;
});

// GROUP SOCKET LISTENER
socket.on("message", (msg) => appendMessage(msg));

// PRIVATE CHAT SYSTEM
async function joinPersonalChat(receiverEmail) {
  if (!currentUserEmail) return alert("Login again, no email found!");

  const valid = await verifyUserEmail(receiverEmail);
  if (!valid) return alert("❌ User not found!");

  currentReceiverEmail = receiverEmail;
  currentRoomId = generateRoomId(currentUserEmail, receiverEmail);

  socket.emit("join_room", currentRoomId);
  messagesEl.innerHTML = "";
  console.log("🔵 Joined private room:", currentRoomId);
}

function sendPersonalMessage(text) {
  socket.emit("new_message", {
    roomId: currentRoomId,
    senderEmail: currentUserEmail,
    receiverEmail: currentReceiverEmail,
    message: text
  });
}


socket.on("new_message", (msg) => {
  appendMessage({
    userId: msg.senderEmail,
    name: msg.senderName || msg.senderEmail,
    text: msg.message,
    ts: msg.ts
  });
});


// SEARCH SYSTEM
async function searchUsers(query) {
  if (!query.trim()) {
    searchResultsEl.style.display = "none";
    return;
  }

  const res = await axios.get(`${apiBase}/users/search?query=${query}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const users = res.data.users.filter(u => u.email !== currentUserEmail);

  if (users.length === 0) {
    searchResultsEl.innerHTML = `<div class="user-search__item">No users found</div>`;
  } else {
    searchResultsEl.innerHTML = users
      .map(u => `<div class="user-search__item" data-email="${u.email}">${u.name} (${u.email})</div>`)
      .join("");
  }

  searchResultsEl.style.display = "block";
}

searchInput.addEventListener("input", e => searchUsers(e.target.value));

searchResultsEl.addEventListener("click", async (e) => {
  if (e.target.classList.contains("user-search__item")) {
    const email = e.target.dataset.email;
    await joinPersonalChat(email);

    searchResultsEl.style.display = "none";
    searchInput.value = "";
  }
});
