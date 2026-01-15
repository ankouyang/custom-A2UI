# Vue 客户端测试指南

## 🚀 快速启动

### 1️⃣ 安装依赖（如果还没安装）

```bash
cd samples/client/vue
npm install
```

### 2️⃣ 启动 Restaurant Finder Agent

**Terminal 1:**
```bash
cd samples/agent/adk/restaurant_finder
uv run .
```

**预期输出：**
```
Starting Agent on http://localhost:10002
Agent Card: http://localhost:10002/.well-known/agent-card.json
```

### 3️⃣ 启动 Vue 客户端

**Terminal 2:**
```bash
cd samples/client/vue
npm run dev
```

**预期输出：**
```
VITE v6.0.7  ready in 500 ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

### 4️⃣ 打开浏览器测试

**访问：** http://localhost:5174

**测试对话：**
1. 输入："book a table for 2"
2. 点击发送
3. 应该看到餐厅选项卡片

---

## 🔍 调试检查

### 浏览器控制台日志

**正常流程：**
```
[App] Sending message: book a table for 2
[A2UIClient] Connecting to http://localhost:10002
[App] Received A2UI messages: [{ beginRendering: {...} }]
```

**如果报错：**
- ❌ `Failed to fetch`: Agent 未启动
- ❌ `CORS error`: 检查 Agent 配置
- ❌ `404 agent-card.json`: Agent URL 错误

### 网络请求检查

**打开浏览器 DevTools → Network:**

1. **Agent Card 请求：**
   - URL: `http://localhost:10002/.well-known/agent-card.json`
   - Status: 200 OK
   - Headers: `X-A2A-Extensions: https://a2ui.org/...`

2. **Send Message 请求：**
   - URL: `http://localhost:10002/...` (根据 Agent Card)
   - Method: POST
   - Body: `{"message": {...}, "parts": [...]}`
   - Response: `{"result": {"status": {"message": {"parts": [...]}}}}`

---

## ✅ 验证功能

### 基础功能
- [ ] Agent 正常启动（10002端口）
- [ ] Vue 客户端启动（5174端口）
- [ ] 页面正常加载

### 消息发送
- [ ] 输入文本消息
- [ ] 点击 Send 按钮
- [ ] 看到 "Sending..." 状态
- [ ] 收到响应

### A2UI 渲染
- [ ] 看到餐厅卡片（Column 布局）
- [ ] 卡片包含餐厅名称
- [ ] 卡片包含评分信息
- [ ] 样式正确显示

### 用户交互
- [ ] 点击餐厅卡片中的按钮
- [ ] Action 发送到 Agent
- [ ] 收到新的 A2UI 更新

---

## 🐛 常见问题

### 问题 1: Agent 启动失败

**错误：** `uv: command not found`

**解决：**
```bash
# 安装 uv
pip install uv
# 或使用系统包管理器
```

### 问题 2: 依赖安装失败

**错误：** `Cannot find module '@a2a-js/sdk'`

**解决：**
```bash
cd samples/client/vue
rm -rf node_modules package-lock.json
npm install
```

### 问题 3: CORS 错误

**错误：** `Access-Control-Allow-Origin`

**解决：**
检查 Agent 是否允许跨域请求（通常 localhost 应该没问题）

### 问题 4: TypeScript 类型错误

**错误：** `Type 'Map<string, ComponentInstance>' is not assignable...`

**说明：** 这是 IDE 的类型检查错误，不影响运行。可以忽略或：

```bash
# 重新构建 renderer
cd renderers/vue
npm run build
```

---

## 📊 与 Lit 客户端对比测试

### 同时运行两个客户端

**Lit 客户端（Terminal 3）:**
```bash
cd samples/client/lit/shell
npm run dev
# 运行在 http://localhost:5173
```

**Vue 客户端（Terminal 2）:**
```bash
cd samples/client/vue
npm run dev
# 运行在 http://localhost:5174
```

### 验证行为一致性

**在两个客户端中输入相同消息：** "book a table for 2"

**应该看到：**
- ✅ 相同的 A2UI 卡片
- ✅ 相同的渲染效果
- ✅ 相同的交互行为

---

## 🎯 测试用例

### 用例 1: 简单文本消息

**输入：** "hello"

**预期：**
- Agent 返回文本响应（可能没有 A2UI）
- 控制台显示：`Received A2UI messages: []`

### 用例 2: A2UI 渲染请求

**输入：** "book a table for 2"

**预期：**
- 看到餐厅卡片列表
- 每个卡片包含：名称、评分、地址
- 控制台显示：`Received A2UI messages: [{ beginRendering: {...} }]`

### 用例 3: 用户操作

**步骤：**
1. 渲染餐厅卡片（输入 "book a table")
2. 点击某个餐厅的 "Select" 按钮

**预期：**
- 触发 `a2uiaction` 事件
- 发送 Action 到 Agent
- 收到新的 A2UI 更新（可能是确认页面）

---

## 🎉 成功标志

如果你看到以下内容，说明完全成功：

1. ✅ **Agent 日志：**
   ```
   Received message: book a table for 2
   Returning A2UI card with restaurants
   ```

2. ✅ **浏览器页面：**
   - 显示餐厅卡片
   - 样式美观
   - 可以交互

3. ✅ **控制台日志：**
   ```
   [App] Sending message: book a table for 2
   [App] Received A2UI messages: [{ beginRendering: {...} }]
   ```

4. ✅ **与 Lit 客户端行为一致**

---

## 📝 下一步

测试成功后：
- [ ] 尝试更多 Agent（contact_lookup、orchestrator）
- [ ] 自定义样式
- [ ] 添加更多功能（历史记录、多 Surface 等）
- [ ] 删除旧的 `vite-plugins/a2a-middleware.ts`

现在就开始测试吧！🚀
