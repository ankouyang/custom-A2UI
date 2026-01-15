# Lit vs Vue 客户端差异分析

## 🔍 核心差异总结

### 架构差异

**Lit 客户端：**
- ✅ **直接使用 A2A SDK**：通过 `@a2a-js/sdk/client` 直接与 Agent 通信
- ✅ **完整的 A2UI 协议处理**：在客户端解析 Part，提取 A2UI 消息
- ✅ **无需中间层**：浏览器直接连接到 Agent 的 localhost:10002

**Vue 客户端：**
- ⚠️ **使用 Vite 中间件代理**：通过 `/a2a/invoke` 路由，由服务端处理
- ⚠️ **简化的数据处理**：依赖中间件解析 Part，前端只接收 parts 数组
- ⚠️ **间接连接**：浏览器 → Vite Dev Server → Agent

---

## 📡 接口请求流程对比

### Lit 客户端流程

```typescript
// 1. 前端代码 (app.ts)
const message = "book a table";
await this.#a2uiClient.send(message);

// 2. A2UIClient (client.ts)
const client = await A2AClient.fromCardUrl(
  "http://localhost:10002/.well-known/agent-card.json"
);

const parts = [{ kind: "text", text: message }];
const response = await client.sendMessage({
  message: {
    messageId: crypto.randomUUID(),
    role: "user",
    parts: parts,
  },
});

// 3. 解析响应
const result = response.result as Task;
const messages = [];
for (const part of result.status.message.parts) {
  if (part.kind === 'data') {
    messages.push(part.data); // ← A2UI 消息对象
  }
}
return messages; // ServerToClientMessage[]
```

**返回数据格式：**
```typescript
[
  {
    beginRendering: {
      surfaceId: "default",
      rootComponentId: "...",
      components: {...}
    }
  },
  {
    surfaceUpdate: {...}
  }
]
```

---

### Vue 客户端流程

```typescript
// 1. 前端代码 (App.vue)
const response = await fetch("/a2a/invoke", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "book a table" }),
});

const parts = await response.json(); // ← 注意：是 parts 数组！

// 2. Vite 中间件 (a2a-middleware.ts)
const client = await A2AClient.fromCardUrl(...);
const response = await client.sendMessage({
  message: {
    messageId: uuidv4(),
    role: "user",
    parts: [{ kind: "text", text: "book a table" }],
  },
});

const result = response.result as Task;
res.end(JSON.stringify(result.status.message?.parts)); // ← 返回 parts

// 3. 前端提取消息 (App.vue)
function extractA2UIMessages(parts) {
  const messages = [];
  for (const part of parts) {
    if (part.kind === "data" && part.data) {
      if (part.data.beginRendering) {
        messages.push({ beginRendering: part.data.beginRendering });
      }
    }
  }
  return messages;
}
```

**返回数据格式（中间层返回）：**
```typescript
[
  {
    kind: "data",
    data: {
      beginRendering: {
        surfaceId: "default",
        rootComponentId: "...",
        components: {...}
      }
    },
    metadata: { mimeType: "application/json+a2ui" }
  },
  {
    kind: "text",
    text: "I found some restaurants..."
  }
]
```

---

## 🔧 关键差异点

### 1. **数据结构层级**

| 层面 | Lit 客户端 | Vue 客户端 |
|------|-----------|-----------|
| **原始响应** | `Task.status.message.parts` | 同 |
| **前端接收** | `ServerToClientMessage[]` | `Part[]` |
| **数据嵌套** | `{ beginRendering: {...} }` | `{ kind: "data", data: { beginRendering: {...} } }` |
| **提取逻辑** | 在 client.ts | 在 App.vue |

### 2. **连接方式**

**Lit：**
```
Browser → A2A SDK → http://localhost:10002
```

**Vue：**
```
Browser → Vite Dev Server (/a2a/invoke) → A2A SDK → http://localhost:10002
```

### 3. **错误处理**

**Lit：**
- 直接在 `client.ts` 中处理 SDK 错误
- 前端立即感知网络问题

**Vue：**
- 中间件捕获错误，返回 500 状态
- 前端需要解析 HTTP 错误

---

## 🐛 Vue 客户端的问题

### 问题 1: 数据提取不正确

**当前代码：**
```typescript
// App.vue
function extractA2UIMessages(parts: any[]) {
  for (const part of parts) {
    if (part.kind === "data" && part.data) {
      // ❌ 检查 part.data.beginRendering
      if (part.data.beginRendering) {
        messages.push({ beginRendering: part.data.beginRendering });
      }
    }
  }
}
```

**问题：**
- Part 可能包含完整的 A2UI 消息对象在 `part.data` 中
- 但有时 `part.data` 本身就是 `{ beginRendering: {...} }` 格式
- 需要同时检查两种格式

### 问题 2: 请求格式不匹配

**当前代码：**
```typescript
// App.vue
body: JSON.stringify({ message }),
```

**中间件期望：**
```typescript
// a2a-middleware.ts
const clientEvent = JSON.parse(originalBody);
```

中间件期望原始字符串或 JSON 对象，而不是 `{ message: "..." }` 包装。

---

## ✅ 修复建议

### 方案 A: 修复 Vue 客户端（简单）

让 Vue 客户端的行为与 Lit 一致：

```typescript
// App.vue
async function handleSubmit() {
  const response = await fetch("/a2a/invoke", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: message, // ← 直接发送文本
  });

  const parts = await response.json();
  
  // 正确提取 A2UI 消息
  const a2uiMessages = [];
  for (const part of parts) {
    if (part.kind === "data") {
      // part.data 本身可能就是 ServerToClientMessage
      if (part.data.beginRendering || part.data.surfaceUpdate) {
        a2uiMessages.push(part.data);
      }
    }
  }
  
  a2uiMessages.value = [...a2uiMessages.value, ...a2uiMessages];
}
```

### 方案 B: 模仿 Lit（推荐）

直接使用 A2A SDK，移除中间件：

```typescript
// 安装 @a2a-js/sdk
// pnpm add @a2a-js/sdk

// App.vue
import { A2AClient } from '@a2a-js/sdk/client';

const client = await A2AClient.fromCardUrl(
  "http://localhost:10002/.well-known/agent-card.json",
  {
    fetchImpl: async (url, init) => {
      const headers = new Headers(init?.headers);
      headers.set("X-A2A-Extensions", "https://a2ui.org/a2a-extension/a2ui/v0.8");
      return fetch(url, { ...init, headers });
    }
  }
);

const response = await client.sendMessage({
  message: {
    messageId: crypto.randomUUID(),
    role: "user",
    parts: [{ kind: "text", text: message }],
  },
});

const result = response.result as Task;
const messages = [];
for (const part of result.status.message.parts) {
  if (part.kind === 'data') {
    messages.push(part.data);
  }
}
```

---

## 📊 完整对比表

| 特性 | Lit 客户端 | Vue 客户端（当前） | 推荐 |
|------|-----------|-------------------|------|
| **A2A SDK** | ✅ 直接使用 | ❌ 通过中间件 | 直接使用 |
| **数据格式** | `ServerToClientMessage[]` | `Part[]` | 统一格式 |
| **连接方式** | 直连 Agent | 通过 Vite | 直连 |
| **代码复杂度** | 简单 | 复杂（需中间件） | 简化 |
| **错误处理** | SDK 层 | HTTP + 中间件 | SDK 层 |
| **类型安全** | ✅ 完整 | ⚠️ 部分 | 改进 |

---

## 🎯 下一步行动

选择以下方案之一：

**选项 1：快速修复（5 分钟）**
- 修改 `App.vue` 的请求格式和数据提取逻辑

**选项 2：彻底改进（30 分钟）**
- 添加 `@a2a-js/sdk` 依赖
- 创建 `A2UIClient` 类（类似 Lit）
- 移除 Vite 中间件
- 统一两个客户端的行为

我建议**选项 2**，这样可以：
- ✅ 消除架构差异
- ✅ 提高代码复用性
- ✅ 简化维护
- ✅ 获得更好的类型安全

需要我帮你实现吗？
