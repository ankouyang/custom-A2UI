# 集成你的 Vue 3 私有组件库

## 完整集成步骤

### 步骤 1: 安装你的私有组件库

```bash
cd samples/client/vue

# 如果是私有 npm registry
npm config set registry https://your-private-registry.com/
npm config set //your-private-registry.com/:_authToken YOUR_TOKEN

# 安装你的组件库
npm install @your-company/ui-components
```

### 步骤 2: 创建组件适配器（如需要）

如果你的组件库接口与 A2UI 不完全匹配，创建适配器：

```vue
<!-- src/adapters/CustomButton.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { YourButton } from "@your-company/ui-components";
import type { Types } from "@a2ui/lit/0.8";

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.CustomComponentNode;
}>();

const emit = defineEmits<{
  action: [action: Types.Action, context: any];
}>();

// 从 A2UI properties 映射到你的组件 props
const buttonProps = computed(() => ({
  label: props.component.properties.label,
  type: props.component.properties.variant || "primary",
  size: props.component.properties.size || "medium",
  disabled: props.component.properties.disabled || false,
}));

const action = computed(() => props.component.properties.action);

function handleClick() {
  if (action.value) {
    emit("action", action.value, {
      surfaceId: props.surfaceId,
      componentId: props.component.id,
    });
  }
}
</script>

<template>
  <YourButton v-bind="buttonProps" @click="handleClick" />
</template>
```

### 步骤 3: 批量注册组件

在 `src/main.ts` 中：

```typescript
import { createApp } from "vue";
import App from "./App.vue";
import { registerComponent } from "@a2ui/vue";

// 导入你的组件库
import {
  YourButton,
  YourCard,
  YourInput,
  YourSelect,
  YourDatePicker,
  YourTable,
} from "@your-company/ui-components";

// 或者导入你创建的适配器
import CustomButton from "./adapters/CustomButton.vue";
import CustomInput from "./adapters/CustomInput.vue";

// 批量注册
const customComponents = {
  CompanyButton: CustomButton,
  CompanyInput: CustomInput,
  CompanyCard: YourCard,
  CompanySelect: YourSelect,
  CompanyDatePicker: YourDatePicker,
  CompanyTable: YourTable,
};

Object.entries(customComponents).forEach(([name, component]) => {
  registerComponent(name, component);
});

const app = createApp(App);
app.mount("#app");
```

### 步骤 4: 配置你的组件库主题（可选）

如果你的组件库需要全局配置：

```typescript
// src/main.ts
import { ConfigProvider } from "@your-company/ui-components";

const app = createApp(App);

// 配置你的组件库主题
app.use(ConfigProvider, {
  theme: {
    primaryColor: "#1976d2",
    borderRadius: "8px",
    // ... 其他配置
  },
});

app.mount("#app");
```

### 步骤 5: Agent 端配置

修改你的 Python agent 来生成使用自定义组件的 A2UI 消息：

```python
# 在你的 agent 代码中
def generate_custom_button():
    return {
        "component": {
            "Custom": {
                "typeName": "CompanyButton",
                "properties": {
                    "label": "提交订单",
                    "variant": "primary",
                    "size": "large",
                    "action": {
                        "name": "submit_order",
                        "parameters": {"orderId": "12345"}
                    }
                }
            }
        }
    }

def generate_custom_form():
    return {
        "surfaceUpdate": {
            "surfaceId": "main",
            "components": [
                {
                    "id": "form-card",
                    "component": {
                        "Custom": {
                            "typeName": "CompanyCard",
                            "properties": {
                                "title": "用户信息",
                                "child": "form-content"
                            }
                        }
                    }
                },
                {
                    "id": "name-input",
                    "component": {
                        "Custom": {
                            "typeName": "CompanyInput",
                            "properties": {
                                "label": "姓名",
                                "placeholder": "请输入姓名",
                                "value": {"path": "/user/name"}
                            }
                        }
                    }
                },
                {
                    "id": "submit-btn",
                    "component": {
                        "Custom": {
                            "typeName": "CompanyButton",
                            "properties": {
                                "label": "提交",
                                "action": {"name": "submit_form"}
                            }
                        }
                    }
                }
            ]
        }
    }
```

## 示例：集成 Ant Design Vue

```bash
npm install ant-design-vue
```

```typescript
// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { registerComponent } from "@a2ui/vue";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

// 创建适配器
import AntButton from "./adapters/AntButton.vue";
import AntInput from "./adapters/AntInput.vue";
import AntCard from "./adapters/AntCard.vue";

const app = createApp(App);
app.use(Antd);

// 注册 Ant Design 组件
registerComponent("AntButton", AntButton);
registerComponent("AntInput", AntInput);
registerComponent("AntCard", AntCard);

app.mount("#app");
```

```vue
<!-- src/adapters/AntButton.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { Button } from "ant-design-vue";
import type { Types } from "@a2ui/lit/0.8";

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.CustomComponentNode;
}>();

const emit = defineEmits<{
  action: [action: Types.Action, context: any];
}>();

const type = computed(() => props.component.properties.type || "primary");
const size = computed(() => props.component.properties.size || "middle");
const label = computed(() => props.component.properties.label);
const action = computed(() => props.component.properties.action);

function handleClick() {
  if (action.value) {
    emit("action", action.value, {
      surfaceId: props.surfaceId,
      componentId: props.component.id,
    });
  }
}
</script>

<template>
  <Button :type="type" :size="size" @click="handleClick">
    {{ label }}
  </Button>
</template>
```

## 示例：集成 Element Plus

```bash
npm install element-plus
```

```typescript
// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { registerComponent } from "@a2ui/vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import ElButtonAdapter from "./adapters/ElButton.vue";
import ElInputAdapter from "./adapters/ElInput.vue";

const app = createApp(App);
app.use(ElementPlus);

registerComponent("ElButton", ElButtonAdapter);
registerComponent("ElInput", ElInputAdapter);

app.mount("#app");
```

## 测试你的集成

运行开发服务器：

```bash
cd samples/client/vue
npm run dev
```

测试自定义组件是否正确渲染和交互。

## 常见问题

### Q: 如何处理组件库的全局样式？

A: 在 `src/main.ts` 或 `App.vue` 中导入：

```typescript
import "@your-company/ui-components/dist/style.css";
```

### Q: 组件属性不匹配怎么办？

A: 创建适配器组件进行属性映射（见步骤 2）。

### Q: 如何调试组件注册？

A: 检查浏览器控制台，查看是否有注册错误或未找到组件的警告。

### Q: 支持异步组件吗？

A: 支持，使用 Vue 的 `defineAsyncComponent`：

```typescript
import { defineAsyncComponent } from "vue";
import { registerComponent } from "@a2ui/vue";

registerComponent(
  "HeavyComponent",
  defineAsyncComponent(
    () => import("@your-company/ui-components/HeavyComponent")
  )
);
```
