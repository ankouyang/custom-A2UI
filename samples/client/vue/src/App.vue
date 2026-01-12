/* Copyright 2025 Google LLC Licensed under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance with the License. You
may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License. */

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { A2UISurface, A2UI } from "@a2ui/vue";

const surfaceId = "main";
const components = ref<Map<string, A2UI.Types.AnyComponentNode>>(new Map());
const rootId = ref<string>("");
const dataModel = ref<any>({});
const userInput = ref("");
const messages = ref<Array<{ role: "user" | "agent"; content: string }>>([]);

// 创建消息处理器
const processor = new A2UI.Data.A2uiMessageProcessor();

// 监听处理器状态变化
processor.onStateChange = (state) => {
  const surface = state.surfaces.get(surfaceId);
  if (surface) {
    components.value = surface.components;
    rootId.value = surface.root || "";
    dataModel.value = surface.dataModel;
  }
};

async function sendMessage() {
  if (!userInput.value.trim()) return;

  const message = userInput.value;
  messages.value.push({ role: "user", content: message });
  userInput.value = "";

  try {
    // 调用 A2A agent
    const response = await fetch("/a2a/invoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const msg = JSON.parse(line);
            processor.process(msg);
          } catch (e) {
            console.error("Failed to parse message:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}

function handleAction(action: Types.Action, context: any) {
  console.log("Action triggered:", action, context);

  // 发送 action 到 agent
  messages.value.push({
    role: "user",
    content: `Action: ${action.name}`,
  });

  // TODO: 实现 action 处理逻辑
}
</script>

<template>
  <div class="app">
    <header>
      <h1>A2UI Vue Demo - Restaurant Finder</h1>
    </header>

    <main>
      <div class="chat-container">
        <div class="messages">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="['message', msg.role]"
          >
            <strong>{{ msg.role === "user" ? "You" : "Agent" }}:</strong>
            {{ msg.content }}
          </div>
        </div>

        <div class="surface-container">
          <A2UISurface
            :surface-id="surfaceId"
            :components="components"
            :root-id="rootId"
            :data-model="dataModel"
            @action="handleAction"
          />
        </div>

        <div class="input-container">
          <input
            v-model="userInput"
            type="text"
            placeholder="Try: 'Book a table for 2'"
            @keyup.enter="sendMessage"
          />
          <button @click="sendMessage">Send</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

header h1 {
  color: #1976d2;
  font-size: 28px;
}

.chat-container {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.messages {
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
}

.message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: white;
}

.message.user {
  background: #e3f2fd;
}

.message.agent {
  background: #f1f8e9;
}

.surface-container {
  min-height: 200px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}

.input-container {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
}

.input-container input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.input-container button {
  padding: 12px 24px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.input-container button:hover {
  background: #1565c0;
}
</style>
