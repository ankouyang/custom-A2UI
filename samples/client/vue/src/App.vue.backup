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

const surfaceId = "default"; // 注意：模型返回的 JSON 中使用的是 "default"
const components = ref<Map<string, A2UI.Types.AnyComponentNode>>(new Map());
const rootId = ref<string>("");
const dataModel = ref<any>({});
const userInput = ref("");
const messages = ref<Array<{ role: "user" | "agent"; content: string }>>([]);

// 创建消息处理器
const processor = new A2UI.Data.A2uiMessageProcessor();

// 更新 Surface 状态的函数
function updateSurfaceState() {
  const surfaces = processor.getSurfaces();
  const surface = surfaces.get(surfaceId);
  if (surface) {
    // 创建新的 Map 实例以确保 Vue 响应式系统检测到变化
    const newComponents = new Map(surface.components);
    const newRootId = surface.rootComponentId || "";

    // 对于 dataModel，如果是 Map，也需要创建新实例
    let newDataModel = surface.dataModel;
    if (surface.dataModel instanceof Map) {
      newDataModel = new Map(surface.dataModel);
    }

    console.log("updateSurfaceState: Before update:", {
      oldComponentsSize: components.value.size,
      oldRootId: rootId.value,
      newComponentsSize: newComponents.size,
      newRootId: newRootId,
      componentIds: Array.from(newComponents.keys()),
      hasRootComponent: !!newComponents.get(newRootId),
    });

    // 更新值
    components.value = newComponents;
    rootId.value = newRootId;
    dataModel.value = newDataModel;

    console.log("updateSurfaceState: After update:", {
      componentsSize: components.value.size,
      rootId: rootId.value,
      hasRootComponent: !!components.value.get(rootId.value),
      rootComponentDetails: components.value.get(rootId.value),
      dataModel: dataModel.value,
      dataModelType:
        dataModel.value instanceof Map ? "Map" : typeof dataModel.value,
      dataModelKeys:
        dataModel.value instanceof Map
          ? Array.from(dataModel.value.keys())
          : Object.keys(dataModel.value || {}),
    });
  } else {
    console.warn(
      `Surface '${surfaceId}' not found. Available surfaces:`,
      Array.from(surfaces.keys())
    );
    // 清空状态
    components.value = new Map();
    rootId.value = "";
    dataModel.value = {};
  }
}

// 从 A2A Part 中提取 A2UI 消息
function extractA2uiMessagesFromParts(
  parts: any[]
): A2UI.Types.ServerToClientMessage[] {
  const messages: A2UI.Types.ServerToClientMessage[] = [];

  console.log("extractA2uiMessagesFromParts: Processing parts:", parts);

  for (const part of parts) {
    console.log("extractA2uiMessagesFromParts: Processing part:", part);

    // 检查是否是 DataPart 且包含 A2UI 数据
    if (part.kind === "data" && part.data && typeof part.data === "object") {
      console.log("extractA2uiMessagesFromParts: Found data part:", part.data);

      // 检查 metadata 中是否有 A2UI MIME type
      const isA2uiPart = part.metadata?.mimeType === "application/json+a2ui";
      console.log(
        "extractA2uiMessagesFromParts: isA2uiPart:",
        isA2uiPart,
        "metadata:",
        part.metadata
      );

      if (
        isA2uiPart ||
        part.data.beginRendering ||
        part.data.surfaceUpdate ||
        part.data.dataModelUpdate ||
        part.data.deleteSurface
      ) {
        console.log("extractA2uiMessagesFromParts: Part contains A2UI message");

        // 直接提取 A2UI 消息
        if (part.data.beginRendering) {
          console.log(
            "extractA2uiMessagesFromParts: Found beginRendering:",
            part.data.beginRendering
          );
          messages.push({ beginRendering: part.data.beginRendering });
        }
        if (part.data.surfaceUpdate) {
          console.log(
            "extractA2uiMessagesFromParts: Found surfaceUpdate:",
            part.data.surfaceUpdate
          );
          messages.push({ surfaceUpdate: part.data.surfaceUpdate });
        }
        if (part.data.dataModelUpdate) {
          console.log(
            "extractA2uiMessagesFromParts: Found dataModelUpdate:",
            part.data.dataModelUpdate
          );
          messages.push({ dataModelUpdate: part.data.dataModelUpdate });
        }
        if (part.data.deleteSurface) {
          console.log(
            "extractA2uiMessagesFromParts: Found deleteSurface:",
            part.data.deleteSurface
          );
          messages.push({ deleteSurface: part.data.deleteSurface });
        }
      } else {
        console.log(
          "extractA2uiMessagesFromParts: Part does not contain A2UI message"
        );
      }
    } else {
      console.log(
        "extractA2uiMessagesFromParts: Part is not a data part or has no data:",
        {
          kind: part.kind,
          hasData: !!part.data,
          dataType: typeof part.data,
        }
      );
    }
  }

  console.log("extractA2uiMessagesFromParts: Extracted messages:", messages);
  return messages;
}

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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 解析 JSON 响应（middleware 返回的是 parts 数组）
    const parts = await response.json();
    console.log("Received parts:", parts);
    console.log("Parts type:", Array.isArray(parts) ? "array" : typeof parts);
    console.log("Parts length:", Array.isArray(parts) ? parts.length : "N/A");

    // 从 Parts 中提取 A2UI 消息
    const a2uiMessages = extractA2uiMessagesFromParts(
      Array.isArray(parts) ? parts : [parts]
    );
    console.log("Extracted A2UI messages:", a2uiMessages);
    console.log("A2UI messages count:", a2uiMessages.length);

    // 处理 A2UI 消息
    if (a2uiMessages.length > 0) {
      console.log("Processing A2UI messages...");
      console.log(
        "Message order:",
        a2uiMessages.map((msg) => {
          if (msg.beginRendering) return "beginRendering";
          if (msg.surfaceUpdate) return "surfaceUpdate";
          if (msg.dataModelUpdate) return "dataModelUpdate";
          if (msg.deleteSurface) return "deleteSurface";
          return "unknown";
        })
      );

      processor.processMessages(a2uiMessages);
      console.log("Messages processed. Getting surfaces...");
      const surfaces = processor.getSurfaces();
      console.log("All surfaces:", Array.from(surfaces.keys()));

      // 手动更新 Surface 状态（因为 processor 没有 onStateChange 回调）
      updateSurfaceState();

      // 强制触发 Vue 响应式更新（使用 nextTick 确保在下一个渲染周期更新）
      await new Promise((resolve) => setTimeout(resolve, 0));
      updateSurfaceState();
    } else {
      console.warn("No A2UI messages found in response");
      console.warn("Parts that were checked:", parts);
    }

    // 处理文本消息（kind: "text"）用于聊天记录显示
    // 注意：这些消息不应该影响 A2UI 渲染
    for (const part of Array.isArray(parts) ? parts : [parts]) {
      if (part.kind === "text" && part.text) {
        messages.value.push({
          role: "agent",
          content: part.text,
        });
      }
    }
  } catch (error) {
    console.error("Failed to send message:", error);
    messages.value.push({
      role: "agent",
      content: `Error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

function handleAction(action: A2UI.Types.Action, context: any) {
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
