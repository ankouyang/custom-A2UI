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

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.AnyComponentNode;
}>();

const emit = defineEmits(["action"]);

// 组件映射表
const componentMap: Record<string, any> = {
  Button: markRaw(Button),
  Text: markRaw(Text),
  // TODO: 添加其他标准组件
  // Card: markRaw(Card),
  // TextField: markRaw(TextField),
  // ...
};

const dynamicComponent = computed(() => {
  const type = props.component.type;

  // 1. 检查标准组件
  if (componentMap[type]) {
    return componentMap[type];
  }

  // 2. 检查自定义组件注册表
  if (type === "Custom") {
    const customProps = props.component.properties as any;
    const customType = customProps.typeName;
    const customComponent = componentRegistry.get(customType);
    if (customComponent) {
      return markRaw(customComponent);
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
    @action="(action: any, context: any) => emit('action', action, context)"
  />
  <div v-else class="a2ui-unknown">Unknown component: {{ component.type }}</div>
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
