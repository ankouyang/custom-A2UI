/* Copyright 2025 Google LLC Licensed under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance with the License. You
may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License. */

<script setup lang="ts">
import { watch, provide, computed } from "vue";
import type { Types } from "@a2ui/lit/0.8";
import DynamicComponent from "./DynamicComponent.vue";

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  components?: Map<string, Types.AnyComponentNode>;
  rootId?: string;
  dataModel?: any;
}>();

const emit = defineEmits(["action"]);

// 使用 computed 来确保响应式更新
const rootComponent = computed(() => {
  console.log("Surface.vue: Computing rootComponent:", {
    hasComponents: !!props.components,
    componentsSize: props.components?.size || 0,
    rootId: props.rootId,
    componentsKeys: props.components ? Array.from(props.components.keys()) : [],
  });
  
  if (props.components && props.rootId) {
    const found = props.components.get(props.rootId);
    console.log("Surface.vue: Looking for root component:", {
      rootId: props.rootId,
      found: !!found,
      component: found,
    });
    return found || null;
  } else {
    console.warn("Surface.vue: Missing components or rootId:", {
      hasComponents: !!props.components,
      rootId: props.rootId,
    });
    return null;
  }
});

// 监听 props 变化以便调试
watch(
  () => [props.components, props.rootId],
  () => {
    console.log("Surface.vue: Props changed:", {
      hasComponents: !!props.components,
      componentsSize: props.components?.size || 0,
      rootId: props.rootId,
      componentsKeys: props.components ? Array.from(props.components.keys()) : [],
      rootComponentValue: rootComponent.value,
    });
  },
  { immediate: true, deep: true }
);

// 提供 surface 级别的数据模型
provide("a2ui-data-model", props.dataModel);
</script>

<template>
  <div class="a2ui-surface" :data-surface-id="surfaceId">
    <DynamicComponent
      v-if="rootComponent"
      :surface-id="surfaceId"
      :component="rootComponent"
      :components="props.components"
      @action="(action: any, context: any) => emit('action', action, context)"
    />
    <div v-else class="a2ui-empty">
      No content to display
    </div>
  </div>
</template>

<style scoped>
.a2ui-surface {
  width: 100%;
  height: 100%;
}

.a2ui-empty {
  padding: 24px;
  text-align: center;
  color: #999;
}
</style>
