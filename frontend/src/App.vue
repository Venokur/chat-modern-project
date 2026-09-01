<template>
  <div class="app-layout">
    <header class="navbar">
      <div class="brand">
        <span class="logo-dot"></span>
        <h1>Support Workspace</h1>
      </div>
      <nav class="nav-pills">
        <button 
          :class="{ active: currentView === 'site' }" 
          @click="currentView = 'site'"
        >
          Клиентский интерфейс
        </button>
        <button 
          :class="{ active: currentView === 'admin' }" 
          @click="currentView = 'admin'"
        >
          Админ-панель
        </button>
      </nav>
    </header>

    <main class="viewport">
      <section v-if="currentView === 'site'" class="site-preview">
        <div class="hero-card">
          <h2>Онлайн-чат поддержка</h2>
          <p>Нажмите на круглую плавающую кнопку в правом нижнем углу для начала диалога.</p>
        </div>
        <ChatWidget />
      </section>

      <section v-else class="admin-view">
        <AdminPanel />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ChatWidget from './components/ChatWidget.vue';
import AdminPanel from './components/AdminPanel.vue';

const currentView = ref('site');
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #0f172a;
  color: #fff;
  padding: 0.85rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-dot {
  width: 10px;
  height: 10px;
  background: #10b981;
  border-radius: 50%;
}

.brand h1 {
  font-size: 1.1rem;
  font-weight: 600;
}

.nav-pills {
  display: flex;
  background: #1e293b;
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
}

.nav-pills button {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-pills button.active {
  background: var(--primary);
  color: #fff;
}

.viewport {
  flex: 1;
  padding: 2rem;
  max-width: 1300px;
  margin: 0 auto;
  width: 100%;
}

.site-preview .hero-card {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 3rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.hero-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.hero-card p {
  color: var(--text-muted);
}
</style>
