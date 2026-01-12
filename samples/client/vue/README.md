# A2UI Vue Client Demo

Vue 3 client for A2UI protocol demonstration.

## Quick Start

### 1. Build the Vue Renderer

```bash
cd ../../../renderers/vue
npm install
npm run build
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Demo

Make sure you have your Gemini API key set:

```bash
export GEMINI_API_KEY="your_key_here"
```

Run everything (agent + web):

```bash
npm run demo:restaurant
```

Or run separately:

```bash
# Terminal 1: Start the A2A agent
cd ../../agent/adk/restaurant_finder
uv run .

# Terminal 2: Start the dev server
npm run dev
```

Open http://localhost:5174

## Using Your Custom Component Library

### Step 1: Install Your Private NPM Library

```bash
npm install @your-org/ui-library
```

### Step 2: Register Your Components

In [src/main.ts](src/main.ts):

```typescript
import { registerComponent } from "@a2ui/vue";
import { YourButton, YourCard, YourInput } from "@your-org/ui-library";

// 注册自定义组件
registerComponent("YourButton", YourButton);
registerComponent("YourCard", YourCard);
registerComponent("YourInput", YourInput);
```

### Step 3: Agent 使用自定义组件

Agent 生成 A2UI 消息时使用 Custom 类型：

```json
{
  "component": {
    "Custom": {
      "typeName": "YourButton",
      "properties": {
        "label": "提交",
        "type": "primary",
        "size": "large"
      }
    }
  }
}
```

## Architecture

```
src/
├── main.ts              # 应用入口，注册自定义组件
├── App.vue              # 主应用组件
└── components/          # 可选的应用级组件

renderers/vue/
├── src/
│   ├── index.ts               # 导出主要 API
│   ├── component-registry.ts  # 组件注册系统
│   ├── Surface.vue            # Surface 容器
│   ├── DynamicComponent.vue   # 动态组件渲染器
│   └── components/            # 标准 A2UI 组件实现
│       ├── Button.vue
│       ├── Text.vue
│       └── ...
```
