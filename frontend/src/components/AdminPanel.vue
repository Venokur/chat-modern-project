<template>
  <div class="workspace-grid">
    <!-- Sidebar -->
    <aside class="threads-sidebar">
      <div class="threads-header">
        <h3>Обращения</h3>
        <span class="count-badge">{{ rooms.length }}</span>
      </div>

      <div class="threads-scroll">
        <div 
          v-for="room in rooms" 
          :key="room.id"
          :class="['thread-cell', { active: activeRoom?.id === room.id }]"
          @click="selectRoom(room)"
        >
          <div class="cell-head">
            <span class="cell-name">{{ room.user_name }}</span>
            <span class="cell-time">{{ formatTime(room.last_message_at) }}</span>
          </div>
          <div class="cell-body">
            <p class="cell-preview">{{ room.last_message || 'Нет сообщений' }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Dialog View -->
    <section class="dialog-viewport">
      <div v-if="activeRoom" class="dialog-container">
        <div class="dialog-header">
          <div class="header-info">
            <h4>{{ activeRoom.user_name }}</h4>
            <span class="subtext">ID: {{ activeRoom.id }}</span>
          </div>
          <!-- Минималистичная кнопка удаления -->
          <button 
            class="minimal-delete-btn" 
            @click="deleteActiveRoom" 
            title="Удалить диалог"
            aria-label="Удалить диалог"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>

        <div class="dialog-feed" ref="scrollBox">
          <div 
            v-for="msg in messages" 
            :key="msg.id"
            :class="['feed-row', msg.sender]"
          >
            <div class="feed-bubble">
              <span class="feed-author">{{ msg.sender === 'admin' ? 'Вы (Оператор)' : msg.sender }}</span>
              <p>{{ msg.text }}</p>
            </div>
          </div>
        </div>

        <form class="feed-input-form" @submit.prevent="handleReply">
          <input 
            v-model="replyText" 
            type="text" 
            placeholder="Напишите ответ клиенту..." 
            required
          />
          <button type="submit" :disabled="!replyText.trim()">Отправить</button>
        </form>
      </div>

      <div v-else class="dialog-empty">
        <p>Выберите обращение из списка слева</p>
      </div>
    </section>

    <!-- Confirm Modal: Delete Room -->
    <ConfirmModal
      v-model:modelValue="isDeleteDialogOpen"
      title="Подтверждение удаления"
      :message="`Удалить диалог с '${activeRoom?.user_name || '...'}' ?`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="deleteRoomConfirmed"
      @cancel="isDeleteDialogOpen = false"
    />

    <!-- Error Modal: Delete Room Failed -->
    <ConfirmModal
      v-model:modelValue="isErrorModalOpen"
      title="Ошибка"
      message="Ошибка при удалении диалога"
      :show-confirm="false"
      cancel-text="ОК"
      @cancel="isErrorModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { socket } from '../socket';
import ConfirmModal from './ConfirmModal.vue';

const rooms = ref([]);
const activeRoom = ref(null);
const messages = ref([]);
const replyText = ref('');
const scrollBox = ref(null);

const isDeleteDialogOpen = ref(false);
const isErrorModalOpen = ref(false);

const formatTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = async () => {
  await nextTick();
  if (scrollBox.value) {
    scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
  }
};

const fetchRooms = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/rooms');
    rooms.value = await res.json();
  } catch (err) {
    console.error('Fetch rooms error:', err);
  }
};

const selectRoom = async (room) => {
  activeRoom.value = room;
  socket.emit('join_room', { roomId: room.id, role: 'admin' });

  try {
    const res = await fetch(`http://localhost:3001/api/rooms/${room.id}/messages`);
    messages.value = await res.json();
    scrollToBottom();
  } catch (err) {
    console.error('Fetch messages error:', err);
  }
};

const handleReply = () => {
  const text = replyText.value.trim();
  if (!text || !activeRoom.value) return;

  socket.emit('send_message', {
    roomId: activeRoom.value.id,
    sender: 'admin',
    text,
  });

  replyText.value = '';
};

const deleteActiveRoom = () => {
  if (!activeRoom.value) return;
  isDeleteDialogOpen.value = true;
};

const deleteRoomConfirmed = async () => {
  isDeleteDialogOpen.value = false;

  if (!activeRoom.value) return;

  const targetId = activeRoom.value.id;
  try {
    const res = await fetch(`http://localhost:3001/api/rooms/${targetId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      activeRoom.value = null;
      messages.value = [];
      await fetchRooms();
    } else {
      isErrorModalOpen.value = true;
    }
  } catch (err) {
    console.error('Delete error:', err);
    isErrorModalOpen.value = true;
  }
};

onMounted(() => {
  fetchRooms();

  socket.on('new_message', (msg) => {
    if (activeRoom.value && msg.room_id === activeRoom.value.id) {
      messages.value.push(msg);
      scrollToBottom();
    }
  });

  socket.on('room_updated', () => {
    fetchRooms();
  });

  socket.on('room_deleted', ({ roomId }) => {
    if (activeRoom.value && activeRoom.value.id === roomId) {
      activeRoom.value = null;
      messages.value = [];
    }
    fetchRooms();
  });
});
</script>

<style scoped>
.workspace-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  height: 650px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.threads-sidebar {
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.threads-header {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

.count-badge {
  background: var(--primary);
  color: #fff;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
}

.threads-scroll {
  flex: 1;
  overflow-y: auto;
}

.thread-cell {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s ease;
}

.thread-cell:hover {
  background: #f1f5f9;
}

.thread-cell.active {
  background: #eef2ff;
  border-left: 3px solid var(--primary);
}

.cell-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.cell-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.cell-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.cell-preview {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Область диалога с поддержкой скролла */
.dialog-viewport {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}

.dialog-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dialog-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h4 {
  font-size: 1rem;
  font-weight: 600;
}

.subtext {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Минималистичная кнопка удаления */
.minimal-delete-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease-in-out;
}

.minimal-delete-btn:hover {
  color: #ef4444;
  background-color: #fef2f2;
  border-color: #fee2e2;
}

.minimal-delete-btn:active {
  transform: scale(0.95);
}

.dialog-feed {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feed-row {
  display: flex;
}

.feed-row.admin {
  justify-content: flex-end;
}

.feed-row.client,
.feed-row.bot {
  justify-content: flex-start;
}

.feed-bubble {
  max-width: 65%;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.9rem;
}

.feed-author {
  font-size: 0.7rem;
  display: block;
  margin-bottom: 2px;
  opacity: 0.7;
}

.feed-row.admin .feed-bubble {
  background: var(--primary);
  color: #fff;
}

.feed-row.client .feed-bubble {
  background: #f1f5f9;
}

.feed-row.bot .feed-bubble {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.feed-input-form {
  padding: 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
}

.feed-input-form input {
  flex: 1;
  border: 1px solid var(--border);
  padding: 10px 14px;
  border-radius: 8px;
  outline: none;
}

.feed-input-form button {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.dialog-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
</style>