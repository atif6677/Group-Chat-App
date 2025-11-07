import { initChatUI, appendMessage } from './chatUI.js';

const currentUserId = 'u1';

const seedMessages = [
  { id:'m1', userId:'u2', name:'Sana', text:'hey atif! ready to ship?', ts: Date.now()-1000*60*45 },
  { id:'m2', userId:'u1', name:'Atif', text:'yesss, fixing last bug', ts: Date.now()-1000*60*44 },
  { id:'m3', userId:'u3', name:'Ravi', text:'push when done', ts: Date.now()-1000*60*30 },
];

// initialize UI
const api = initChatUI({
  container: document,
  messagesEl: document.getElementById('chatMessages'),
  formEl: document.getElementById('chatForm'),
  inputEl: document.getElementById('chatInput'),
  sendBtnEl: document.getElementById('sendBtn'),
  newIndicatorEl: document.getElementById('newIndicator'),
  jumpBtnEl: document.getElementById('jumpToBottom'),
  currentUserId
});

api.renderMessages(seedMessages);

// demo message to show incoming behavior
setTimeout(() => {
  appendMessage({
    id: crypto.randomUUID(),
    userId:'u2',
    name:'Sana',
    text:'ship it 🚀',
    ts: Date.now()
  });
}, 2000);
