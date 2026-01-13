/* Copyright 2025 Google LLC Licensed under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance with the License. You
may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License. */

<script setup lang="ts">
import { computed, markRaw } from "vue";
import type { Types } from "@a2ui/lit/0.8";
import { componentRegistry } from "./component-registry";

// 导入标准组件
import Button from "./components/Button.vue";
import Text from "./components/Text.vue";
import Column from "./components/Column.vue";
import Row from "./components/Row.vue";

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.AnyComponentNode;
  components?: Map<string, Types.AnyComponentNode>;
}>();

const emit = defineEmits(["action"]);

// 组件映射表
const componentMap: Record<string, any> = {
  Button: markRaw(Button),
  Text: markRaw(Text),
  Column: markRaw(Column),
  Row: markRaw(Row),
  // TODO: 添加其他标准组件
  // Card: markRaw(Card),
  // TextField: markRaw(TextField),
  // ...
};

// 提取组件类型的 computed
const componentType = computed(() => {
  const component = props.component as any;

  // 检查是否是已转换的格式（有 type 字段）
  if (component.type && typeof component.type === "string") {
    return component.type;
  }
  // 检查是否是原始格式（有 component 字段，如 { component: { Column: {...} } }）
  else if (component.component && typeof component.component === "object") {
    const componentObj = component.component;
    const keys = Object.keys(componentObj);
    return keys.length > 0 ? keys[0] : null;
  }
  // 检查是否是对象格式的 type（如 { type: { Column: {...} } }）
  else if (component.type && typeof component.type === "object") {
    const keys = Object.keys(component.type);
    return keys.length > 0 ? keys[0] : null;
  }

  return null;
});

const dynamicComponent = computed(() => {
  const type = componentType.value;
  const component = props.component as any;

  console.log(
    "DynamicComponent: component:",
    component,
    "componentType:",
    type
  );

  if (!type) {
    console.warn("Could not determine component type:", component);
    return null;
  }

  // 1. 检查标准组件
  if (componentMap[type]) {
    return componentMap[type];
  }

  // 2. 检查自定义组件注册表
  if (type === "Custom") {
    const customProps = props.component.properties as any;
    const customType = customProps?.typeName;
    if (customType) {
      const customComponent = componentRegistry.get(customType);
      if (customComponent) {
        return markRaw(customComponent);
      }
    }
  }

  // 3. 未找到组件，返回占位符
  return null;
});
</script>

<template>
  <component
    v-if="dynamicComponent"
    :is="dynamicComponent"
    :surface-id="surfaceId"
    :component="component"
    :components="components"
    @action="(action: any, context: any) => emit('action', action, context)"
  />
  <div v-else class="a2ui-unknown">
    Unknown component: {{ componentType || "N/A" }}
  </div>
</template>

<style scoped>
.a2ui-unknown {
  padding: 8px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
}
</style>
