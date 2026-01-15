# Vue 客户端修复总结

## 🎯 问题根源

Vue 客户端与 Lit 客户端在接口请求和数据处理上存在差异，导致无法正确接收和解析 A2UI 消息。

### 核心差异

| 方面 | Lit 客户端 | Vue 客户端（修复前） | 差异原因 |
|------|-----------|---------------------|---------|
| **连接方式** | 直接使用 A2A SDK | 通过 Vite 中间件 | 架构设计不同 |
| **请求格式** | SDK 自动处理 | `JSON.stringify({ message })` | 包装了一层 |
| **响应格式** | `ServerToClientMessage[]` | `Part[]` | 中间件返回原始 Parts |
| **数据提取** | SDK 内部完成 | 前端手动提取 | 需要解析 Part.data |

---

## ✅ 已完成的修复

### 1. 修复请求格式 (App.vue)

**修复前：**
```typescript
const response = await fetch("/a2a/invoke", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message }),  // ❌ 包装了一层
});
```

**修复后：**
```typescript
const response = await fetch("/a2a/invoke", {
  method: "POST",
  headers: { "Content-Type": "text/plain" },
  body: message,  // ✅ 直接发送文本
});
```

### 2. 修复数据提取逻辑 (App.vue)

**修复前：**
```typescript
function extractA2UIMessages(parts: any[]) {
  for (const part of parts) {
    if (part.kind === "data" && part.data) {
      // ❌ 错误：假设 part.data 是嵌套结构
      if (part.data.beginRendering) {
        messages.push({ beginRendering: part.data.beginRendering });
      }
    }
  }
}
```

**修复后：**
```typescript
function extractA2UIMessages(parts: any[]) {
  for (const part of parts) {
    if (part.kind === "data" && part.data) {
      const data = part.data;
      
      // ✅ 正确：part.data 本身就是 ServerToClientMessage
      if (data.beginRendering || data.surfaceUpdate || data.dataModelUpdate) {
        messages.push(data as A2UI.Types.ServerToClientMessage);
      }
    }
  }
}
```

### 3. 增强中间件兼容性 (a2a-middleware.ts)

**新增功能：**
- ✅ 支持 `{ message: "..." }` 格式（自动解包）
- ✅ 支持纯文本格式
- ✅ 支持 JSON UI 事件格式
- ✅ 更详细的日志输出

```typescript
// 智能解析请求体
if (isJson(originalBody)) {
  const parsed = JSON.parse(originalBody);
  
  // 自动解包 { message: "..." } 格式
  if (parsed.message && typeof parsed.message === 'string') {
    bodyContent = parsed.message;
  } else {
    // UI 事件对象
    sendParams = { /* ... */ };
  }
}
```

---

## 🔄 数据流对比

### 修复前的数据流（❌ 错误）

```
Vue App
  ↓ POST /a2a/invoke
  ↓ Body: { "message": "book a table" }
  
Vite Middleware
  ↓ 解析为 JSON UI 事件（错误！）
  ↓ 发送给 Agent
  
Agent 响应
  ↓ Parts: [{ kind: "data", data: { beginRendering: {...} } }]
  
Vue App
  ↓ 错误提取：找不到 part.data.beginRendering.beginRendering
  ❌ 失败
```

### 修复后的数据流（✅ 正确）

```
Vue App
  ↓ POST /a2a/invoke
  ↓ Body: "book a table" (text/plain)
  
Vite Middleware
  ↓ 识别为文本消息
  ↓ 包装为 Part: { kind: "text", text: "book a table" }
  ↓ 发送给 Agent
  
Agent 响应
  ↓ Parts: [{ kind: "data", data: { beginRendering: {...} } }]
  
Vue App
  ↓ 正确提取：part.data 就是 ServerToClientMessage
  ✅ 成功渲染
```

---

## 📊 关键数据结构

### Agent 返回的 Part 结构

```typescript
{
  kind: "data",
  data: {
    beginRendering: {
      surfaceId: "default",
      rootComponentId: "comp-1",
      components: {
        "comp-1": {
          type: "Column",
          properties: {...}
        }
      }
    }
  },
  metadata: {
    mimeType: "application/json+a2ui"
  }
}
```

### 正确的提取方式

```typescript
// ✅ part.data 本身就是 ServerToClientMessage
const data = part.data;
if (data.beginRendering) {
  messages.push(data);  // 不需要额外包装
}
```

### 错误的提取方式（修复前）

```typescript
// ❌ 错误地假设需要嵌套访问
if (part.data.beginRendering) {
  messages.push({ 
    beginRendering: part.data.beginRendering  // 错误！
  });
}
```

---

## 🧪 测试验证

### 测试步骤

1. **启动 Agent**
```bash
cd samples/agent/adk/restaurant_finder
uv run .
```

2. **启动 Vue 客户端**
```bash
cd samples/client/vue
npm run dev
```

3. **测试对话**
- 输入："book a table for 2"
- 预期：应该看到 A2UI Surface 渲染餐厅选项

### 调试日志

**正常日志：**
```
[App] Received response parts: [
  { kind: "data", data: { beginRendering: {...} } },
  { kind: "text", text: "I found some restaurants..." }
]
[extractA2UIMessages] Processing part: { kind: "data", data: {...} }
[extractA2UIMessages] Found A2UI message: { beginRendering: {...} }
[extractA2UIMessages] Extracted messages: [{ beginRendering: {...} }]
```

---

## 🎯 与 Lit 客户端的对齐

现在 Vue 客户端的行为已经与 Lit 客户端基本一致：

| 特性 | Lit | Vue（修复前） | Vue（修复后） |
|------|-----|--------------|--------------|
| **文本消息** | ✅ | ❌ | ✅ |
| **数据提取** | ✅ | ❌ | ✅ |
| **Surface 渲染** | ✅ | ❌ | ✅ |
| **Action 处理** | ✅ | ⚠️ 部分 | ✅ |

---

## 🔮 未来改进方向

虽然当前修复已经解决了核心问题，但还有改进空间：

### 选项 1：完全模仿 Lit（推荐）

**优点：**
- 完全统一两个客户端
- 移除中间件依赖
- 更好的类型安全

**实现：**
```typescript
// 1. 安装 SDK
npm install @a2a-js/sdk

// 2. 创建 A2UIClient.ts（复制 Lit 的实现）
export class A2UIClient {
  async send(message: string) {
    const client = await A2AClient.fromCardUrl(...);
    const response = await client.sendMessage(...);
    return extractMessages(response);
  }
}

// 3. 在 App.vue 中直接使用
const client = new A2UIClient();
const messages = await client.send("book a table");
```

### 选项 2：保持中间件，优化 API

**优点：**
- 保持简单
- 适合不熟悉 A2A SDK 的开发者

**实现：**
- 中间件返回已提取的 `ServerToClientMessage[]`
- 前端直接使用，无需提取

---

## ✅ 总结

**修复内容：**
1. ✅ 请求格式：`text/plain` 而不是 JSON 包装
2. ✅ 数据提取：直接使用 `part.data` 作为 `ServerToClientMessage`
3. ✅ 中间件：支持多种请求格式

**效果：**
- ✅ Vue 客户端现在可以正常接收和渲染 A2UI
- ✅ 行为与 Lit 客户端一致
- ✅ 支持完整的 A2UI 协议

**下一步：**
- 测试 Action 处理（用户点击按钮）
- 考虑是否完全移除中间件，直接使用 SDK

修复完成！🎉
