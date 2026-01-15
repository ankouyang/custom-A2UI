# Vue 渲染器对 @a2ui/lit 的深度依赖分析

## 一、依赖关系概览

### 1.1 包依赖声明
```json
// renderers/vue/package.json
{
  "dependencies": {
    "@a2ui/lit": "file:../lit"  // 文件依赖，指向本地 lit 包
  }
}
```

### 1.2 导入模式
Vue 渲染器在所有组件中使用统一的导入方式：
```typescript
import type { Types } from "@a2ui/lit/0.8";
```

**关键点**：
- 使用 `type` 关键字，仅导入类型定义（编译时依赖，运行时零开销）
- 从 `@a2ui/lit/0.8` 子路径导入（对应 package.json 的 exports 配置）

---

## 二、类型系统依赖

### 2.1 核心类型定义（来自 Lit）

Lit 提供的完整类型系统（`renderers/lit/src/0.8/types/types.ts`）：

```typescript
// 1. Surface 相关类型
export type SurfaceID = string;

export interface Surface {
  id: SurfaceID;
  components: Map<string, AnyComponentNode>;
  rootId?: string;
  dataModel: DataMap;
}

// 2. 组件节点基础接口
interface BaseComponentNode {
  id: string;              // 组件唯一 ID
  weight?: number;         // 布局权重（flex）
  dataContextPath?: string; // 数据上下文路径
  slotName?: string;       // 插槽名称
}

// 3. 具体组件类型（discriminated union）
export interface TextNode extends BaseComponentNode {
  type: "Text";
  properties: ResolvedText;
}

export interface ButtonNode extends BaseComponentNode {
  type: "Button";
  properties: ResolvedButton;
}

export interface ColumnNode extends BaseComponentNode {
  type: "Column";
  properties: ResolvedColumn;
}

// ... 18+ 种标准组件类型

// 4. 联合类型
export type AnyComponentNode =
  | TextNode
  | IconNode
  | ImageNode
  | ButtonNode
  | ColumnNode
  | RowNode
  // ... 所有组件的联合
  | CustomNode;  // 自定义组件
```

### 2.2 Vue 组件中的类型使用

#### Surface.vue - 表面容器
```vue
<script setup lang="ts">
import type { Types } from "@a2ui/lit/0.8";

const props = defineProps<{
  surfaceId: Types.SurfaceID;                           // 使用 Lit 的 SurfaceID 类型
  components?: Map<string, Types.AnyComponentNode>;     // 使用 Lit 的 AnyComponentNode 联合类型
  rootId?: string;
  dataModel?: any;
}>();
</script>
```

**依赖关系**：
- `Types.SurfaceID`：确保 Surface ID 类型一致
- `Types.AnyComponentNode`：接收任意标准组件或自定义组件
- `Map<string, Types.AnyComponentNode>`：组件注册表的类型安全

#### DynamicComponent.vue - 动态组件路由器
```vue
<script setup lang="ts">
import type { Types } from "@a2ui/lit/0.8";

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.AnyComponentNode;  // 可以是任何组件类型
  components?: Map<string, Types.AnyComponentNode>;
}>();

const dynamicComponent = computed(() => {
  const type = props.component.type;  // TypeScript 自动推断类型
  
  if (type === "Button") {
    // props.component 自动窄化为 Types.ButtonNode
    return Button;
  }
  // ...
});
</script>
```

**类型安全保障**：
- TypeScript discriminated union 自动类型窄化
- 访问 `component.type` 后，编译器知道对应的 `properties` 类型

#### Button.vue - 具体组件实现
```vue
<script setup lang="ts">
import type { Types } from "@a2ui/lit/0.8";

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.ButtonNode;  // 精确的组件类型
  components?: Map<string, Types.AnyComponentNode>;
}>();

const action = computed(() => props.component.properties.action);
// TypeScript 知道 properties 是 ResolvedButton 类型
// 因此 .action 属性存在且类型为 Types.Action
</script>
```

---

## 三、数据结构依赖

### 3.1 组件属性结构（来自 Lit）

```typescript
// renderers/lit/src/0.8/types/components.ts

export interface Action {
  name: string;
  context?: {
    key: string;
    value: {
      path?: string;
      literalString?: string;
      literalNumber?: number;
      literalBoolean?: boolean;
    };
  }[];
}

export interface Text {
  text: StringValue;
  usageHint: "h1" | "h2" | "h3" | "h4" | "h5" | "caption" | "body";
}

export interface Button {
  child: string;
  action: Action;
}
```

### 3.2 Vue 组件中的属性访问

```vue
<!-- Text.vue -->
<script setup lang="ts">
const props = defineProps<{
  component: Types.TextNode;
}>();

const text = computed(() => {
  const textProp = props.component.properties.text;  // ResolvedText 类型
  
  if ("literalString" in textProp) {
    return textProp.literalString;  // 类型安全的访问
  }
  
  if ("path" in textProp) {
    return getValueFromPath(textProp.path, dataModel.value);
  }
  
  return "";
});
</script>
```

**关键依赖**：
- `properties` 的结构完全由 Lit 定义
- Vue 组件只负责渲染，不定义数据结构
- 类型系统确保访问安全

---

## 四、数据处理逻辑依赖（零运行时依赖）

### 4.1 当前实现（Vue 自己处理数据绑定）

```vue
<!-- Text.vue -->
<script setup lang="ts">
// Vue 自己实现了数据路径解析
function getValueFromPath(path: string, model: any): any {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const parts = cleanPath.split("/").filter(p => p);
  
  let value = model;
  for (const part of parts) {
    if (value instanceof Map) {
      value = value.get(part);
    } else if (typeof value === "object" && part in value) {
      value = value[part];
    } else {
      return "";
    }
  }
  
  return value ?? "";
}
</script>
```

**问题**：
- 重复实现了 Lit 已有的数据处理逻辑
- 未利用 Lit 的 `MessageProcessor` 能力

### 4.2 可以利用的 Lit 核心逻辑

```typescript
// renderers/lit/src/0.8/data/model-processor.ts

export class A2uiMessageProcessor implements MessageProcessor {
  // 处理服务器消息，构建 Surface
  processMessages(messages: ServerToClientMessage[]): void {
    // 解析 beginRendering, surfaceUpdate 等消息
  }
  
  // 获取数据绑定值
  getData(
    node: AnyComponentNode,
    relativePath: string,
    surfaceId: string
  ): DataValue | null {
    // 从 dataModel 中解析路径并返回值
  }
  
  // 设置数据值
  setData(
    node: AnyComponentNode | null,
    relativePath: string,
    value: DataValue,
    surfaceId: string
  ): void {
    // 更新 dataModel
  }
}
```

**改进方案**：
```vue
<!-- Surface.vue 改进版 -->
<script setup lang="ts">
import { A2UI } from "@a2ui/lit/0.8";  // 导入运行时工具

// 创建消息处理器实例
const processor = new A2UI.Data.A2uiMessageProcessor();

// 处理来自 Agent 的消息
watch(() => props.messages, (messages) => {
  processor.processMessages(messages);
  
  const surfaces = processor.getSurfaces();
  const surface = surfaces.get(props.surfaceId);
  
  if (surface) {
    components.value = surface.components;
    rootId.value = surface.rootId;
  }
});

// 提供 processor 给子组件使用
provide("a2ui-processor", processor);
</script>
```

```vue
<!-- Text.vue 改进版 -->
<script setup lang="ts">
const processor = inject<A2UI.MessageProcessor>("a2ui-processor");

const text = computed(() => {
  const textProp = props.component.properties.text;
  
  if ("path" in textProp && processor) {
    // 使用 Lit 的数据获取逻辑
    const value = processor.getData(
      props.component,
      textProp.path,
      props.surfaceId
    );
    return value?.toString() || "";
  }
  
  return textProp.literalString || "";
});
</script>
```

---

## 五、事件系统依赖

### 5.1 Lit 的事件定义

```typescript
// renderers/lit/src/0.8/events/events.ts

export interface StateEventDetailMap {
  "a2ui.action": A2UIAction;
}

export class StateEvent<T extends keyof StateEventDetailMap> 
  extends CustomEvent<StateEventDetailMap[T]> {
  static eventName = "a2uiaction";
}
```

### 5.2 Vue 的事件处理

```vue
<!-- Button.vue -->
<script setup lang="ts">
const emit = defineEmits(["action"]);

function handleClick() {
  if (action.value) {
    // 发射 Vue 事件（向上传递）
    emit("action", action.value, {
      surfaceId: props.surfaceId,
      componentId: props.component.id,
    });
  }
}
</script>

<template>
  <button @click="handleClick">
    <DynamicComponent ... />
  </button>
</template>
```

**事件流**：
```
Button.vue (用户点击)
  → emit("action", actionData)
    → Surface.vue 接收
      → 应用层处理（发送给 Agent）
```

**可改进点**：
- 可以直接使用 Lit 的 `StateEvent` 类型定义
- 确保事件数据结构与 Lit 一致

---

## 六、Schema 验证依赖

### 6.1 Lit 的 JSON Schema

```typescript
// renderers/lit/src/0.8/core.ts

export const Schemas = {
  A2UIClientEventMessage,  // 从 schemas/*.json 导入
};
```

Lit 在构建时复制 JSON Schema 文件：
```javascript
// package.json wireit 配置
"copy-spec": {
  "command": "复制 ../../specification/0.8/json/*.json 到 src/0.8/schemas/",
  "files": ["../../specification/0.8/json/*.json"],
  "output": ["src/0.8/schemas/*.json"]
}
```

### 6.2 Vue 可利用的验证

```typescript
// 可以在 Vue 应用层使用
import { A2UI } from "@a2ui/lit/0.8";

// 验证从 Agent 接收的消息
function validateMessage(message: unknown) {
  // 使用 JSON Schema 验证
  const isValid = validateAgainstSchema(
    message,
    A2UI.Schemas.A2UIClientEventMessage
  );
  
  if (!isValid) {
    throw new Error("Invalid message format");
  }
}
```

---

## 七、完整依赖图

```
┌─────────────────────────────────────────────────────────┐
│                    @a2ui/lit                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  types/types.ts (核心类型系统)                    │   │
│  │  ├─ SurfaceID, Surface, AnyComponentNode         │   │
│  │  ├─ TextNode, ButtonNode, ColumnNode, etc.       │   │
│  │  └─ MessageProcessor interface                   │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  types/components.ts (组件属性定义)               │   │
│  │  ├─ Text, Button, Action, StringValue            │   │
│  │  └─ 各组件的 properties 结构                      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  data/model-processor.ts (数据处理器)             │   │
│  │  ├─ A2uiMessageProcessor class                   │   │
│  │  ├─ processMessages()                            │   │
│  │  ├─ getData()                                    │   │
│  │  └─ setData()                                    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  events/events.ts (事件系统)                      │   │
│  │  └─ StateEvent, StateEventDetailMap              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  schemas/*.json (JSON Schema 验证)                │   │
│  │  └─ A2UIClientEventMessage                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
              (编译时类型导入 + 运行时可选导入)
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  @a2ui/vue                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  index.ts                                        │   │
│  │  export * as A2UI from "@a2ui/lit/0.8"           │   │
│  │  (重新导出 Lit 的所有内容供用户使用)                │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Surface.vue (容器组件)                          │   │
│  │  import type { Types } from "@a2ui/lit/0.8"      │   │
│  │  - props: surfaceId, components, rootId          │   │
│  │  - 使用 Types.SurfaceID                          │   │
│  │  - 使用 Map<string, Types.AnyComponentNode>      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  DynamicComponent.vue (组件路由)                  │   │
│  │  import type { Types } from "@a2ui/lit/0.8"      │   │
│  │  - props.component: Types.AnyComponentNode       │   │
│  │  - 根据 component.type 路由到具体组件              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  components/Button.vue                           │   │
│  │  import type { Types } from "@a2ui/lit/0.8"      │   │
│  │  - props.component: Types.ButtonNode             │   │
│  │  - 访问 component.properties.action               │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  components/Text.vue                             │   │
│  │  import type { Types } from "@a2ui/lit/0.8"      │   │
│  │  - props.component: Types.TextNode               │   │
│  │  - 访问 component.properties.text                 │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  components/Row.vue, Column.vue, etc.            │   │
│  │  (所有组件都使用相同的类型导入模式)                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 八、依赖层次分析

### 8.1 类型依赖（Type-only，零运行时开销）✅ 已实现

```typescript
// 所有 Vue 组件都使用这种方式
import type { Types } from "@a2ui/lit/0.8";

// 编译后：类型信息被完全擦除
// 运行时：零依赖
```

**特点**：
- ✅ 类型安全
- ✅ 无运行时成本
- ✅ 保持与 Lit 类型系统同步
- ✅ TypeScript discriminated union 自动类型窄化

### 8.2 运行时依赖（Runtime，可选）⚠️ 未充分利用

```typescript
// 当前仅在 index.ts 重新导出
export * as A2UI from "@a2ui/lit/0.8";

// 可以在组件中使用
import { A2UI } from "@a2ui/lit/0.8";
const processor = new A2UI.Data.A2uiMessageProcessor();
```

**当前状态**：
- ⚠️ Vue 组件重复实现了数据处理逻辑（如 `getValueFromPath`）
- ⚠️ 未使用 Lit 的 `MessageProcessor`
- ⚠️ 未使用 Lit 的 Schema 验证

**改进方向**：
```typescript
// 1. 使用 MessageProcessor 处理消息
const processor = new A2UI.Data.A2uiMessageProcessor();
processor.processMessages(serverMessages);

// 2. 使用 getData/setData 处理数据绑定
const value = processor.getData(node, "/user/name", surfaceId);

// 3. 使用 Guards 进行类型检查
if (A2UI.Data.Guards.isResolvedButton(properties)) {
  // TypeScript 知道这是 Button 类型
}
```

---

## 九、依赖优势

### 9.1 类型安全
- **编译时检查**：所有组件属性访问都经过类型验证
- **自动补全**：IDE 提供完整的类型提示
- **重构安全**：Lit 类型变更会立即在 Vue 中报错

### 9.2 标准一致性
- **唯一数据源**：所有类型定义来自 Lit，确保跨框架一致
- **规范遵循**：严格遵循 A2UI 0.8 规范

### 9.3 维护成本低
- **单一维护点**：类型定义只在 Lit 中维护
- **自动同步**：Vue 自动继承 Lit 的类型更新

---

## 十、改进建议

### 10.1 充分利用 MessageProcessor

**当前**：
```vue
<!-- Surface.vue -->
<script setup>
// 手动管理组件和数据
const rootComponent = ref(null);
watch(() => [props.components, props.rootId], () => {
  rootComponent.value = props.components.get(props.rootId);
});
</script>
```

**改进**：
```vue
<script setup>
import { A2UI } from "@a2ui/lit/0.8";

const processor = new A2UI.Data.A2uiMessageProcessor();

// 处理服务器消息
function handleServerMessages(messages: A2UI.Types.ServerToClientMessage[]) {
  processor.processMessages(messages);
  
  const surfaces = processor.getSurfaces();
  const surface = surfaces.get(props.surfaceId);
  
  components.value = surface?.components;
  rootId.value = surface?.rootId;
}

// 提供给子组件
provide("a2ui-processor", processor);
provide("a2ui-surface-id", props.surfaceId);
</script>
```

### 10.2 使用数据绑定 API

**当前**：
```vue
<!-- Text.vue -->
<script setup>
function getValueFromPath(path: string, model: any) {
  // 重复实现数据路径解析
  const parts = path.split("/");
  // ...
}
</script>
```

**改进**：
```vue
<script setup>
import { inject } from "vue";

const processor = inject<A2UI.MessageProcessor>("a2ui-processor");
const surfaceId = inject<string>("a2ui-surface-id");

const text = computed(() => {
  const textProp = props.component.properties.text;
  
  if ("path" in textProp && processor) {
    const value = processor.getData(
      props.component,
      textProp.path,
      surfaceId
    );
    return value?.toString() || "";
  }
  
  return textProp.literalString || "";
});
</script>
```

### 10.3 使用类型守卫

```vue
<script setup>
import { A2UI } from "@a2ui/lit/0.8";

// 使用 Lit 的类型守卫
if (A2UI.Data.Guards.isResolvedButton(props.component.properties)) {
  // TypeScript 自动推断类型
  console.log(props.component.properties.action);
}
</script>
```

---

## 十一、总结

### 核心依赖关系
1. **类型系统**：100% 依赖 Lit 的类型定义（`Types.*`）
2. **数据结构**：组件属性结构完全由 Lit 定义
3. **运行时逻辑**：当前未充分利用，存在改进空间

### 依赖优势
- ✅ 类型安全，编译时验证
- ✅ 跨框架一致性
- ✅ 维护成本低

### 改进方向
- ⚠️ 使用 `MessageProcessor` 替代手动数据处理
- ⚠️ 使用 `getData/setData` API
- ⚠️ 使用类型守卫（Guards）
- ⚠️ 使用 Schema 验证

### 依赖模式
```
Vue 渲染器 = 薄包装层 (Thin Wrapper)
            + Lit 类型系统 (完全依赖)
            + Lit 运行时逻辑 (可选，建议使用)
            + Vue 特定实现 (仅渲染逻辑)
```
