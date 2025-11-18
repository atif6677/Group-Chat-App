console.log("✅ chat.js loaded successfully");

// 1. Initialize Socket.io
const socket = io(); 

const apiBase = "http://localhost:3000/api";
const currentUserId = localStorage.getItem('userId');
const currentUserName = localStorage.getItem('userName') || "You";

const messagesEl = document.getElementById('chatMessages');
const formEl = document.getElementById('chatForm');
const inputEl = document.getElementById('chatInput');
const sendBtnEl = document.getElementById('sendBtn');

// === Enable/Disable Send button ===
inputEl.addEventListener('input', () => {
  const hasText = inputEl.value.trim().length > 0;
  sendBtnEl.disabled = !hasText;
});

// === Append a message to the chat window ===
function appendMessage({ userId, name, text, ts }) {
  const div = document.createElement('div');
  div.classList.add('msg', userId == currentUserId ? 'msg--me' : 'msg--them');

  const nameEl = document.createElement('div');
  nameEl.className = 'msg__name';
  nameEl.textContent = name;

  const textEl = document.createElement('div');
  textEl.className = 'msg__text';
  textEl.textContent = text;

  const metaEl = document.createElement('div');
  metaEl.className = 'msg__meta';
  const time = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  metaEl.textContent = time;

  div.append(nameEl, textEl, metaEl);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// === Load existing messages from DB (Run once on load) ===
async function loadMessages() {
  try {
    const res = await axios.get(`${apiBase}/messages`);
    const allMessages = res.data.messages.map((msg) => ({
      id: msg.id,
      userId: msg.userId,
      name: msg.User?.name || "User",
      text: msg.message,
      ts: new Date(msg.createdAt).getTime(),
    }));
    messagesEl.innerHTML = ""; 
    allMessages.forEach((m) => appendMessage(m));
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
  }
}
loadMessages();

// 2. LISTEN for new messages via Socket.io (Replaces setInterval)
socket.on("message", (msg) => {
    // Append the message received from the server
    appendMessage(msg);
});

// === Handle new message submission ===
formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  try {
    // Send message to backend via API
    await axios.post(`${apiBase}/messages`, {
      userId: currentUserId,
      message: text,
    });

    // NOTE: We do NOT manually appendMessage() here anymore.
    // The server will receive the POST, save it, and EMIT the socket event.
    // The socket.on('message') listener above will handle displaying it.
    
    // Reset input
    inputEl.value = "";
    sendBtnEl.disabled = true;
  } catch (err) {
    console.error("❌ Failed to send message:", err.response?.data || err);
  }
});