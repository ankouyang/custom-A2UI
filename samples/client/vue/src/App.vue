/* Copyright 2025 Google LLC Licensed under the Apache License, Version 2.0 */

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { A2UISurface, A2UI } from "@a2ui/vue";
import { A2UIClient } from "./client";

// A2A Client
const client = new A2UIClient();

// State
const userInput = ref("");
const a2uiMessages = ref<A2UI.Types.ServerToClientMessage[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Computed
const hasMessages = computed(() => a2uiMessages.value.length > 0);

// 初始化
onMounted(async () => {
  await client.ready;
});

// 处理用户输入
async function handleSubmit() {
  if (!userInput.value.trim() || loading.value) return;

  const message = userInput.value.trim();
  userInput.value = "";
  error.value = null;
  loading.value = true;

  try {
    console.log("[App] Sending message:", message);
    
    const newMessages = await client.send(message);
    console.log("[App] Received messages:", newMessages);

    // 完全匹配Lit：清空旧消息，只显示新响应
    a2uiMessages.value = newMessages;
  } catch (err: any) {
    console.error("[App] Error:", err);
    error.value = err.message || "Failed to send message";
  } finally {
    loading.value = false;
  }
}

// 处理 A2UI 用户操作
async function handleAction(event: CustomEvent) {
  const action = event.detail as A2UI.Types.A2UIClientEventMessage;
  console.log("[App] User action:", action);
  
  loading.value = true;
  try {
    const newMessages = await client.send(action);
    console.log("[App] Received messages after action:", newMessages);
    
    // 完全匹配Lit：替换而不是累积
    a2uiMessages.value = newMessages;
  } catch (err: any) {
    console.error("[App] Error sending action:", err);
    error.value = err.message || "Failed to send action";
  } finally {
    loading.value = false;
  }
}

// 清空聊天
function clearChat() {
  a2uiMessages.value = [];
  error.value = null;
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🤖 A2UI Vue Demo</h1>
      <p class="subtitle">Powered by Web Components from @a2ui/lit</p>
      <button v-if="hasMessages" @click="clearChat" class="clear-btn">
        Clear Chat
      </button>
    </header>

    <main class="main">
      <!-- Loading state -->
      <div v-if="loading && !hasMessages" class="pending">
        <div class="spinner"></div>
        <div class="loading-text">Awaiting an answer...</div>
      </div>

      <!-- A2UI Surface -->
      <div v-else-if="hasMessages" class="surface-container">
        <A2UISurface
          v-model:messages="a2uiMessages"
          surface-id="default"
          @a2uiaction="handleAction"
        />
      </div>

      <!-- Error message -->
      <div v-if="error" class="error">⚠️ {{ error }}</div>
    </main>

    <footer class="footer" v-if="!hasMessages">
      <form @submit.prevent="handleSubmit" class="input-form">
        <input
          v-model="userInput"
          type="text"
          placeholder="Book a table for 2..."
          :disabled="loading"
          class="input"
        />
        <button
          type="submit"
          :disabled="loading || !userInput.trim()"
          class="submit-btn"
        >
          <span class="icon">send</span>
        </button>
      </form>
    </footer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 640px;
  margin: 0 auto;
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  background: var(--background);
}

.header {
  padding: 2rem 1.5rem;
  text-align: center;
  position: relative;
}

.header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  opacity: 0.7;
  font-size: 0.9rem;
  color: #666;
}

.clear-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  color: #333;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #e8e8e8;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
}

.pending {
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(102, 126, 234, 0.1);
  border-left-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #666;
  font-size: 0.95rem;
}

.surface-container {
  animation: fadeIn 0.5s ease-in-out;
}

.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.footer {
  padding: 1.5rem;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-form {
  display: flex;
  gap: 0.5rem;
}

.input {
  flex: 1;
  padding: 1rem 1.25rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  color: #333;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #667eea;
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.submit-btn .icon {
  font-family: "Material Symbols Outlined";
  font-size: 24px;
}

.submit-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
