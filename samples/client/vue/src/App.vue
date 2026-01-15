/* Copyright 2025 Google LLC Licensed under the Apache License, Version 2.0 */

<script setup lang="ts">
import { ref, computed } from "vue";
import { A2UISurface, A2UI } from "@a2ui/vue";

// State
const userInput = ref("");
const chatMessages = ref<Array<{ role: "user" | "agent"; content: string }>>([]);
const a2uiMessages = ref<A2UI.Types.ServerToClientMessage[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Computed
const hasMessages = computed(() => chatMessages.value.length > 0);

// 处理用户输入
async function handleSubmit() {
  if (!userInput.value.trim() || loading.value) return;

  const message = userInput.value.trim();
  userInput.value = "";
  error.value = null;

  chatMessages.value.push({ role: "user", content: message });
  loading.value = true;

  try {
    const response = await fetch("/a2a/invoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const parts = await response.json();
    console.log("[App] Received response:", parts);

    // 提取 A2UI 消息
    const newA2UIMessages = extractA2UIMessages(parts);
    if (newA2UIMessages.length > 0) {
      a2uiMessages.value = [...a2uiMessages.value, ...newA2UIMessages];
    }

    // 提取文本消息
    const textParts = parts.filter((p: any) => p.kind === "text");
    if (textParts.length > 0) {
      const agentText = textParts.map((p: any) => p.text).join("\n");
      chatMessages.value.push({ role: "agent", content: agentText });
    }
  } catch (err: any) {
    console.error("[App] Error:", err);
    error.value = err.message || "Failed to send message";
    chatMessages.value.push({
      role: "agent",
      content: `Error: ${error.value}`,
    });
  } finally {
    loading.value = false;
  }
}

// 从 parts 中提取 A2UI 消息
function extractA2UIMessages(
  parts: any[]
): A2UI.Types.ServerToClientMessage[] {
  const messages: A2UI.Types.ServerToClientMessage[] = [];

  for (const part of parts) {
    if (part.kind === "data" && part.data) {
      const isA2UI =
        part.metadata?.mimeType === "application/json+a2ui" ||
        part.data.beginRendering ||
        part.data.surfaceUpdate ||
        part.data.dataModelUpdate;

      if (isA2UI) {
        if (part.data.beginRendering) {
          messages.push({ beginRendering: part.data.beginRendering });
        }
        if (part.data.surfaceUpdate) {
          messages.push({ surfaceUpdate: part.data.surfaceUpdate });
        }
        if (part.data.dataModelUpdate) {
          messages.push({ dataModelUpdate: part.data.dataModelUpdate });
        }
      }
    }
  }

  return messages;
}

// 处理 A2UI 用户操作
function handleAction(action: A2UI.Types.Action, context: any) {
  console.log("[App] User action:", action, context);
  chatMessages.value.push({ role: "user", content: `Action: ${action.name}` });
  // TODO: 将操作发送回 Agent
}

// 清空聊天
function clearChat() {
  chatMessages.value = [];
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
      <!-- A2UI Surface (使用 Web Components 渲染) -->
      <div class="surface-container">
        <A2UISurface
          v-model:messages="a2uiMessages"
          surface-id="default"
          @action="handleAction"
        />
      </div>

      <!-- 聊天历史 -->
      <div v-if="hasMessages" class="chat-history">
        <h3>Chat History</h3>
        <div
          v-for="(msg, idx) in chatMessages"
          :key="idx"
          :class="['message', msg.role]"
        >
          <strong>{{ msg.role === "user" ? "You" : "Agent" }}:</strong>
          <span>{{ msg.content }}</span>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error">⚠️ {{ error }}</div>
    </main>

    <footer class="footer">
      <form @submit.prevent="handleSubmit" class="input-form">
        <input
          v-model="userInput"
          type="text"
          placeholder="Type your message..."
          :disabled="loading"
          class="input"
        />
        <button
          type="submit"
          :disabled="loading || !userInput.trim()"
          class="submit-btn"
        >
          {{ loading ? "Sending..." : "Send" }}
        </button>
      </form>
      <p class="hint">
        💡 This demo uses <code>&lt;a2ui-surface&gt;</code> Web Component
        directly
      </p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
}

.subtitle {
  margin: 0.5rem 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.clear-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f5f5f5;
}

.surface-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  min-height: 300px;
}

.chat-history {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chat-history h3 {
  margin: 0 0 1rem;
  color: #333;
  font-size: 1.1rem;
}

.message {
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  line-height: 1.5;
}

.message.user {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.message.agent {
  background: #f3e5f5;
  border-left: 3px solid #9c27b0;
}

.message strong {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.error {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #c62828;
  margin-top: 1rem;
}

.footer {
  padding: 1.5rem;
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.input-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #667eea;
}

.input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.submit-btn {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.hint {
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  color: #666;
}

.hint code {
  background: #f5f5f5;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: "Courier New", monospace;
}
</style>
