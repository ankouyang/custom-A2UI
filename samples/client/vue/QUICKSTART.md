# Vue 3 集成 A2UI - 完整指南

## 📊 三种方案对比

| 方案                                    | 适用场景                 | 优势                                               | 劣势                                   | 推荐度     |
| --------------------------------------- | ------------------------ | -------------------------------------------------- | -------------------------------------- | ---------- |
| **方案 1**: 注册自定义组件到 Lit 渲染器 | 简单集成，组件数量少     | 快速，无需大改动                                   | 无法用 Vue 组件，需要用 Web Components | ⭐⭐       |
| **方案 2**: 修改 Lit 渲染器             | 轻度定制                 | 改动较小                                           | 仍然是 Lit，不是 Vue                   | ⭐         |
| **方案 3**: 创建 Vue 渲染器             | **Vue 3.0 + 私有组件库** | ✅ 完全 Vue 生态<br>✅ 直接用私有库<br>✅ 类型安全 | 需要一次性搭建                         | ⭐⭐⭐⭐⭐ |

## ✅ 推荐方案：方案 3 - 创建 Vue 渲染器

### 为什么选择方案 3？

1. **完全 Vue 生态**: 你的团队熟悉 Vue，开发效率高
2. **直接使用私有库**: 无需包装成 Web Components
3. **类型安全**: TypeScript + Vue 3 完整类型支持
4. **易于维护**: 代码结构清晰，符合 Vue 最佳实践

---

## 🚀 快速开始

### 前置要求

```bash
# 确保有 Node.js 18+
node --version

# 确保有 Gemini API Key
echo $GEMINI_API_KEY
```

### 第一步：构建 Vue 渲染器

```bash
cd renderers/vue
npm install
npm run build
```

### 第二步：运行 Vue 客户端演示

```bash
cd samples/client/vue
npm install
npm run demo:restaurant
```

这会自动：

1. 构建渲染器
2. 启动 Python agent（餐厅查找）
3. 启动 Vite 开发服务器
4. 打开浏览器 http://localhost:5174

---

## 🔧 集成你的私有组件库

### 1. 安装你的组件库

```bash
cd samples/client/vue

# 配置私有 registry（如果需要）
npm config set @your-company:registry https://npm.your-company.com/
npm config set //npm.your-company.com/:_authToken ${YOUR_NPM_TOKEN}

# 安装
npm install @your-company/ui-components
```

### 2. 注册组件

编辑 `src/main.ts`:

```typescript
import { createApp } from "vue";
import App from "./App.vue";
import { registerComponent } from "@a2ui/vue";

// 导入你的组件库
import {
  YourButton,
  YourInput,
  YourCard,
  YourTable,
} from "@your-company/ui-components";

// 导入组件库样式
import "@your-company/ui-components/dist/style.css";

// 注册组件
registerComponent("MyButton", YourButton);
registerComponent("MyInput", YourInput);
registerComponent("MyCard", YourCard);
registerComponent("MyTable", YourTable);

const app = createApp(App);
app.mount("#app");
```

### 3. Agent 使用自定义组件

在你的 Python agent 中：

```python
def create_custom_ui():
    return {
        "surfaceUpdate": {
            "surfaceId": "main",
            "components": [
                {
                    "id": "my-btn",
                    "component": {
                        "Custom": {
                            "typeName": "MyButton",  # 对应注册的名称
                            "properties": {
                                "label": "提交",
                                "type": "primary",
                                "size": "large"
                            }
                        }
                    }
                }
            ]
        }
    }
```

---

## 📁 项目结构

```
A2UI/
├── renderers/
│   └── vue/                      # 新创建的 Vue 渲染器
│       ├── src/
│       │   ├── index.ts          # 导出 API
│       │   ├── component-registry.ts  # 组件注册
│       │   ├── Surface.vue       # Surface 容器
│       │   ├── DynamicComponent.vue   # 动态渲染
│       │   └── components/       # 标准组件实现
│       │       ├── Button.vue
│       │       ├── Text.vue
│       │       └── ...
│       └── package.json
│
└── samples/
    └── client/
        └── vue/                  # Vue 客户端示例
            ├── src/
            │   ├── main.ts       # 👈 在这里注册你的组件
            │   ├── App.vue
            │   └── adapters/     # 组件适配器（如需要）
            ├── package.json
            └── INTEGRATION_GUIDE.md  # 详细集成指南
```

---

## 🎯 核心文件说明

### 1. `renderers/vue/src/component-registry.ts`

组件注册中心，管理所有自定义组件。

### 2. `renderers/vue/src/DynamicComponent.vue`

动态组件渲染器，根据 A2UI 消息类型渲染对应组件。

### 3. `renderers/vue/src/Surface.vue`

Surface 容器，管理组件树和数据模型。

### 4. `samples/client/vue/src/main.ts`

**👈 你主要修改这个文件**，在这里注册你的私有组件库。

---

## 🔍 完整示例

### 示例 1: 使用 Ant Design Vue

```bash
npm install ant-design-vue
```

```typescript
// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { registerComponent } from "@a2ui/vue";
import { Button, Input, Card } from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

registerComponent("AntButton", Button);
registerComponent("AntInput", Input);
registerComponent("AntCard", Card);

createApp(App).mount("#app");
```

### 示例 2: 创建适配器

如果组件 props 不匹配，创建适配器：

```vue
<!-- src/adapters/MyButtonAdapter.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { YourButton } from "@your-company/ui";

const props = defineProps<{
  component: any;
}>();

const emit = defineEmits(["action"]);

// props 映射
const buttonProps = computed(() => ({
  text: props.component.properties.label,
  variant: props.component.properties.type,
  onClick: () => {
    if (props.component.properties.action) {
      emit("action", props.component.properties.action);
    }
  },
}));
</script>

<template>
  <YourButton v-bind="buttonProps" />
</template>
```

---

## 🧪 测试

### 测试标准组件

```bash
cd samples/client/vue
npm run dev
```

在浏览器输入：

- "Book a table for 2"
- "Find Italian restaurants"

### 测试自定义组件

修改 agent 代码生成自定义组件消息，然后测试渲染和交互。

---

## 📚 下一步

1. **添加更多标准组件**: 在 `renderers/vue/src/components/` 添加 Card、TextField 等
2. **完善数据绑定**: 实现 path-based 数据绑定
3. **添加主题系统**: 支持主题定制
4. **集成你的组件库**: 按照 INTEGRATION_GUIDE.md 操作

---

## ❓ 常见问题

### Q: 为什么不用方案 1 或方案 2？

A: 因为你使用 Vue 3.0，方案 1/2 都是基于 Lit（另一个框架），无法直接使用 Vue 组件。方案 3 让你完全在 Vue 生态内工作。

### Q: 现有的 Lit 渲染器还能用吗？

A: 可以！Vue 渲染器是独立的，不影响 Lit 渲染器。你可以同时维护两个渲染器。

### Q: 性能如何？

A: Vue 3 的性能非常好，特别是使用了 Composition API 和响应式系统。动态组件渲染对性能影响很小。

### Q: 支持 TypeScript 吗？

A: 完全支持！所有代码都是 TypeScript，有完整的类型推断。

### Q: 如何调试？

A: 使用 Vue DevTools 浏览器扩展，可以查看组件树、props、events 等。

---

## 📖 参考文档

- [A2UI 规范](../../docs/specification/v0.8-a2ui.md)
- [Vue 3 文档](https://vuejs.org/)
- [集成指南](./INTEGRATION_GUIDE.md)
- [组件开发指南](../../docs/guides/custom-components.md)

---

**需要帮助？** 查看 [GitHub Issues](https://github.com/google/a2ui/issues)
