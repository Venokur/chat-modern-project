<template>
  <div class="chat-widget-root">
    <button 
      class="trigger-btn" 
      :class="{ open: isOpen }"
      @click="isOpen = !isOpen"
      aria-label="Открыть чат"
    >
      <svg v-if="!isOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    <div v-show="isOpen" class="chat-card">
      <div class="chat-card-header">
        <div class="avatar-group">
          <div class="avatar-badge"></div>
          <div>
            <div class="header-title">Поддержка</div>
            <div class="header-status">В сети</div>
          </div>
        </div>
      </div>

      <div class="messages-container" ref="scrollBox">
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          :class="['bubble-row', msg.sender]"
        >
          <div class="bubble">
            <span class="sender-name">{{ formatSender(msg.sender) }}</span>
            <p>{{ msg.text }}</p>
          </div>
        </div>
      </div>

      <form class="action-bar" @submit.prevent="handleSend">
        <input 
          v-model="text" 
          type="text" 
          placeholder="Напишите сообщение..." 
          required 
        />
        <button type="submit" :disabled="!text.trim()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { socket } from '../socket';

const isOpen = ref(false);
const text = ref('');
const messages = ref([]);
const scrollBox = ref(null);

let roomId = localStorage.getItem('app_chat_uid');
if (!roomId) {
  roomId = 'guest_' + crypto.randomUUID().slice(0, 8);
  localStorage.setItem('app_chat_uid', roomId);
}

let userName = localStorage.getItem('app_chat_user_name');
if (!userName) {
  userName = 'Гость ' + Math.floor(1000 + Math.random() * 9000);
  localStorage.setItem('app_chat_user_name', userName);
}

const formatSender = (s) => (s === 'client' ? 'Вы' : s === 'bot' ? 'Ассистент' : 'Оператор');

const scrollToBottom = async () => {
  await nextTick();
  if (scrollBox.value) {
    scrollBox.value.scrollTo({ top: scrollBox.value.scrollHeight, behavior: 'smooth' });
  }
};

const handleSend = () => {
  const payload = text.value.trim();
  if (!payload) return;

  socket.emit('send_message', {
    roomId,
    sender: 'client',
    text: payload,
    userName,
  });

  text.value = '';
};

onMounted(async () => {
  socket.emit('join_room', { roomId, userName, role: 'client' });

  try {
    const res = await fetch(`http://localhost:3001/api/rooms/${roomId}/messages`);
    messages.value = await res.json();
    scrollToBottom();
  } catch (err) {
    console.error('History fetch error:', err);
  }

  socket.on('new_message', (msg) => {
    if (msg.room_id === roomId) {
      messages.value.push(msg);
      scrollToBottom();
    }
  });
});
</script>

<style scoped>
.chat-widget-root {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.trigger-btn {
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: var(--primary);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.35);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.trigger-btn:hover {
  transform: scale(1.06);
}

.chat-card {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 360px;
  height: 500px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-card-header {
  background: var(--surface);
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.avatar-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-badge {
  width: 12px;
  height: 12px;
  background: #10b981;
  border-radius: 50%;
}

.header-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.header-status {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.messages-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bubble-row {
  display: flex;
}

.bubble-row.client {
  justify-content: flex-end;
}

.bubble-row.admin,
.bubble-row.bot {
  justify-content: flex-start;
}

.bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.9rem;
}

.sender-name {
  font-size: 0.7rem;
  display: block;
  margin-bottom: 2px;
  opacity: 0.7;
}

.client .bubble {
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.admin .bubble {
  background: #f1f5f9;
  border-bottom-left-radius: 2px;
}

.bot .bubble {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  border-bottom-left-radius: 2px;
}

.action-bar {
  padding: 10px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 6px;
}

.action-bar input {
  flex: 1;
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: 8px;
  outline: none;
  font-size: 0.875rem;
}

.action-bar input:focus {
  border-color: var(--primary);
}

.action-bar button {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.action-bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
