<template>
  <teleport to="body">
    <transition name="cm-fade">
      <div
        v-if="modelValue"
        class="cm-backdrop"
        @click.self="close('cancel')"
        @keydown.esc="close('cancel')"
        tabindex="-1"
      >
        <transition name="cm-scale" appear>
          <div class="cm-modal" role="dialog" aria-modal="true" :aria-label="title">
            <div class="cm-header">
              <h3 class="cm-title">{{ title }}</h3>
            </div>

            <div v-if="message" class="cm-body">
              <p class="cm-message">{{ message }}</p>
            </div>

            <slot name="body"></slot>

            <div class="cm-footer">
              <slot name="actions">
                <button
                  ref="actionBtn"
                  type="button"
                  class="cm-btn cm-btn--secondary"
                  @click="close('cancel')"
                >
                  {{ cancelText }}
                </button>
                <button
                  v-if="showConfirm"
                  type="button"
                  class="cm-btn cm-btn--primary"
                  @click="close('confirm')"
                >
                  {{ confirmText }}
                </button>
              </slot>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, toRefs } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Подтвердить' },
  cancelText: { type: String, default: 'Отмена' },
  showConfirm: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const { modelValue } = toRefs(props);
const actionBtn = ref(null);

const close = (mode = 'cancel') => {
  emit('update:modelValue', false);
  if (mode === 'confirm') {
    emit('confirm');
  } else {
    emit('cancel');
  }
};

watch(
  () => modelValue,
  (value) => {
    if (value) {
      nextTick(() => actionBtn.value?.focus());
    }
  },
);

onMounted(() => {
  document.addEventListener('keydown', onEsc);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onEsc);
});

function onEsc(e) {
  if (e.key === 'Escape' && modelValue) {
    close('cancel');
  }
}
</script>

<style scoped>
.cm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  outline: none;
}

.cm-modal {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: var(--radius, 12px);
  box-shadow: var(--shadow, 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01));
  max-width: 420px;
  width: 90%;
  padding: 1.5rem;
}

.cm-header {
  margin-bottom: 0.75rem;
}

.cm-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-main, #0f172a);
}

.cm-body {
  margin-bottom: 1.25rem;
}

.cm-message {
  font-size: 0.9rem;
  color: var(--text-muted, #64748b);
  line-height: 1.5;
}

.cm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cm-btn {
  min-width: 96px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  outline: none;
}

.cm-btn--primary {
  background: var(--primary, #4f46e5);
  color: #fff;
}

.cm-btn--primary:hover {
  background: var(--primary-hover, #4338ca);
}

.cm-btn--secondary {
  background: transparent;
  color: var(--text-muted, #64748b);
  border-color: var(--border, #e2e8f0);
}

.cm-btn--secondary:hover {
  background: #f8fafc;
  border-color: var(--border, #e2e8f0);
}

.cm-fade-enter-active,
.cm-fade-leave-active {
  transition: opacity 0.15s ease;
}

.cm-fade-enter-from,
.cm-fade-leave-to {
  opacity: 0;
}

.cm-scale-enter-active {
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.cm-scale-leave-active {
  transition: transform 0.12s cubic-bezier(0.4, 0, 0.2, 1);
}

.cm-scale-enter-from {
  transform: scale(0.95);
}

.cm-scale-leave-to {
  transform: scale(0.95);
}
</style>
