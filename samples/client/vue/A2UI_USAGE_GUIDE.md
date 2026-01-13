# A2UI Vue 渲染器使用指南

## 问题解答

### 1. 如何使用 Vue 渲染器解析这些 a2ui_JSON？

模型返回的 A2UI JSON 是一个**消息数组**，需要按顺序处理。以下是正确的使用方法：

#### 方法一：处理 JSON 数组（推荐）

```vue
<script setup lang="ts">
import { ref } from "vue";
import { A2UISurface, A2UI } from "@a2ui/vue";

const surfaceId = "default"; // 或 "main"
const components = ref<Map<string, A2UI.Types.AnyComponentNode>>(new Map());
const rootId = ref<string>("");
const dataModel = ref<any>({});

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

// 处理 A2UI JSON 数组
function processA2UIJSON(jsonArray: A2UI.Types.ServerToClientMessage[]) {
  // 方法 1: 使用 processMessages（推荐）
  processor.processMessages(jsonArray);
  
  // 或者方法 2: 逐个处理（如果只有单个消息）
  // for (const message of jsonArray) {
  //   processor.processMessages([message]);
  // }
}

// 示例：从模型返回的 JSON 字符串解析
function handleModelResponse(jsonString: string) {
  try {
    // 解析 JSON 数组
    const messages: A2UI.Types.ServerToClientMessage[] = JSON.parse(jsonString);
    
    // 处理消息数组
    processA2UIJSON(messages);
  } catch (error) {
    console.error("Failed to parse A2UI JSON:", error);
  }
}

// 示例：处理你提供的 JSON
const exampleJSON = `[
  { "beginRendering": { "surfaceId": "default", "root": "root-column", "styles": { "primaryColor": "#FF0000", "font": "Roboto" } } },
  { "surfaceUpdate": {
    "surfaceId": "default",
    "components": [
      { "id": "root-column", "component": { "Column": { "children": { "explicitList": ["prompt-text"] } } } },
      { "id": "prompt-text", "component": { "Text": { "text": { "path": "message" } } } }
    ]
  } },
  { "dataModelUpdate": {
    "surfaceId": "default",
    "path": "/",
    "contents": [
      { "key": "message", "valueString": "Hello! I can help you find restaurants. What cuisine are you in the mood for and in what location?" }
    ]
  } }
]`;

// 使用示例
handleModelResponse(exampleJSON);
</script>

<template>
  <A2UISurface
    :surface-id="surfaceId"
    :components="components"
    :root-id="rootId"
    :data-model="dataModel"
    @action="handleAction"
  />
</template>
```

#### 方法二：从流式响应中处理（A2A 协议）

如果你的 A2UI JSON 是通过 A2A 协议流式传输的，应该这样处理：

```typescript
async function processStreamResponse(response: Response) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  const buffer = [];

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          
          // 检查是否是 A2UI 数据部分
          if (msg.data && msg.data["https://a2ui.org/a2a-extension/a2ui/v0.8"]) {
            const a2uiMessages = msg.data["https://a2ui.org/a2a-extension/a2ui/v0.8"];
            
            // 如果 a2uiMessages 是数组，直接处理
            if (Array.isArray(a2uiMessages)) {
              processor.processMessages(a2uiMessages);
            } else {
              // 如果是单个消息，包装成数组
              processor.processMessages([a2uiMessages]);
            }
          }
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      }
    }
  }
}
```

### 2. renderers/vue 这个渲染器是否渲染这个 a2ui_JSON？

**是的！** `renderers/vue` 渲染器**完全支持**渲染这些 A2UI JSON 消息。

#### 支持的消息类型

Vue 渲染器支持所有标准的 A2UI 消息类型：

1. ✅ **`beginRendering`** - 开始渲染信号
2. ✅ **`surfaceUpdate`** - 更新组件定义
3. ✅ **`dataModelUpdate`** - 更新数据模型
4. ✅ **`deleteSurface`** - 删除表面

#### 支持的组件类型

当前 Vue 渲染器已实现的标准组件：

- ✅ **Column** - 列布局容器
- ✅ **Row** - 行布局容器  
- ✅ **Text** - 文本组件
- ✅ **Button** - 按钮组件
- ⚠️ **其他组件**（Card, TextField 等）- 需要扩展实现

#### 使用流程

```
A2UI JSON 数组
    ↓
A2uiMessageProcessor.processMessages()
    ↓
解析并更新 Surface 状态
    ↓
A2UISurface 组件监听状态变化
    ↓
DynamicComponent 动态渲染组件
    ↓
最终渲染到 DOM
```

## 完整示例

### 修复 App.vue 中的问题

当前 `App.vue` 中使用 `processor.process(msg)` 是错误的，应该使用 `processMessages`。以下是修复后的代码：

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { A2UISurface, A2UI } from "@a2ui/vue";

const surfaceId = "default"; // 注意：你的 JSON 中使用的是 "default"
const components = ref<Map<string, A2UI.Types.AnyComponentNode>>(new Map());
const rootId = ref<string>("");
const dataModel = ref<any>({});
const userInput = ref("");

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
    const a2uiMessages: A2UI.Types.ServerToClientMessage[] = [];

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const msg = JSON.parse(line);
            
            // 检查是否是 A2UI 数据部分
            if (msg.data && msg.data["https://a2ui.org/a2a-extension/a2ui/v0.8"]) {
              const a2uiData = msg.data["https://a2ui.org/a2a-extension/a2ui/v0.8"];
              
              // 如果是数组，添加到消息列表
              if (Array.isArray(a2uiData)) {
                a2uiMessages.push(...a2uiData);
              } else {
                // 如果是单个消息，也添加到列表
                a2uiMessages.push(a2uiData);
              }
            }
          } catch (e) {
            console.error("Failed to parse message:", e);
          }
        }
      }
      
      // 一次性处理所有 A2UI 消息
      if (a2uiMessages.length > 0) {
        processor.processMessages(a2uiMessages);
      }
    }
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}

// 测试函数：直接处理你提供的 JSON
function testWithExampleJSON() {
  const exampleJSON = `[
    { "beginRendering": { "surfaceId": "default", "root": "root-column", "styles": { "primaryColor": "#FF0000", "font": "Roboto" } } },
    { "surfaceUpdate": {
      "surfaceId": "default",
      "components": [
        { "id": "root-column", "component": { "Column": { "children": { "explicitList": ["prompt-text"] } } } },
        { "id": "prompt-text", "component": { "Text": { "text": { "path": "message" } } } }
      ]
    } },
    { "dataModelUpdate": {
      "surfaceId": "default",
      "path": "/",
      "contents": [
        { "key": "message", "valueString": "Hello! I can help you find restaurants. What cuisine are you in the mood for and in what location?" }
      ]
    } }
  ]`;
  
  try {
    const messages: A2UI.Types.ServerToClientMessage[] = JSON.parse(exampleJSON);
    processor.processMessages(messages);
    console.log("A2UI messages processed successfully!");
  } catch (error) {
    console.error("Failed to process example JSON:", error);
  }
}

function handleAction(action: A2UI.Types.Action, context: any) {
  console.log("Action triggered:", action, context);
  // 实现 action 处理逻辑
}
</script>

<template>
  <div class="app">
    <header>
      <h1>A2UI Vue Demo - Restaurant Finder</h1>
      <button @click="testWithExampleJSON">Test with Example JSON</button>
    </header>

    <main>
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
    </main>
  </div>
</template>
```

## 重要提示

1. **Surface ID 匹配**：确保 `surfaceId` 与 JSON 中的 `surfaceId` 一致（你的例子中使用的是 `"default"`）

2. **消息顺序**：A2UI 消息必须按正确顺序处理：
   - 先 `surfaceUpdate`（定义组件）
   - 再 `dataModelUpdate`（填充数据）
   - 最后 `beginRendering`（开始渲染）

3. **组件实现**：确保 `renderers/vue/src/components/` 中有对应的组件实现（如 `Column.vue`）

4. **数据绑定**：使用 `path` 引用数据模型中的数据（如 `{ "path": "message" }`）

## 总结

- ✅ Vue 渲染器**完全支持**渲染 A2UI JSON
- ✅ 使用 `processor.processMessages(array)` 处理消息数组
- ✅ 确保 `surfaceId` 匹配
- ✅ 按正确顺序处理消息类型
