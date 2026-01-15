/* Copyright 2025 Google LLC Licensed under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance with the License. You
may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License. */

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { A2UI } from "./index";
import "@a2ui/lit/ui"; // 导入 Web Components

// 定义 Props
const props = withDefaults(
  defineProps<{
    surfaceId?: string;
    messages?: A2UI.Types.ServerToClientMessage[];
    processor?: A2UI.Types.MessageProcessor;
    theme?: A2UI.Types.Theme;
  }>(),
  {
    surfaceId: "@default",
  }
);

// 定义 Emits
const emit = defineEmits<{
  action: [action: A2UI.Types.Action, context: any];
  "update:messages": [messages: A2UI.Types.ServerToClientMessage[]];
}>();

// 定义 v-model
const messages = defineModel<A2UI.Types.ServerToClientMessage[]>("messages");

// 创建或使用提供的处理器
const internalProcessor =
  props.processor || new A2UI.Data.A2uiMessageProcessor();
const surfaceElement = ref<HTMLElement | null>(null);

// 监听消息变化，自动处理
watch(
  [() => props.messages, messages],
  ([propsMessages, modelMessages]) => {
    const msgs = modelMessages || propsMessages;
    if (msgs && msgs.length > 0) {
      console.log("[A2UISurface] Processing messages:", msgs);
      internalProcessor.processMessages(msgs);
    }
  },
  { immediate: true, deep: true }
);

// 设置 Web Component 的属性
onMounted(() => {
  if (!surfaceElement.value) return;

  const surface = surfaceElement.value.querySelector(
    "a2ui-surface"
  ) as any;
  if (!surface) return;

  // 设置处理器
  surface.processor = internalProcessor;
  surface.surfaceId = props.surfaceId;

  // 设置主题（如果提供）
  if (props.theme) {
    surface.theme = props.theme;
  }

  // 监听 action 事件
  const handleAction = (event: CustomEvent) => {
    console.log("[A2UISurface] Action event:", event.detail);
    const detail = event.detail;
    emit("action", detail.action, {
      surfaceId: props.surfaceId,
      componentId: detail.sourceComponentId,
      dataContextPath: detail.dataContextPath,
    });
  };

  surface.addEventListener("a2uiaction", handleAction);

  // 清理
  onBeforeUnmount(() => {
    surface.removeEventListener("a2uiaction", handleAction);
  });
});

// 暴露处理器给父组件（高级用法）
defineExpose({
  processor: internalProcessor,
  getSurfaces: () => internalProcessor.getSurfaces(),
});
</script>

<template>
  <div ref="surfaceElement" class="a2ui-surface-wrapper">
    <!-- 直接使用 Lit 的 Web Component -->
    <a2ui-surface></a2ui-surface>
  </div>
</template>

<style scoped>
.a2ui-surface-wrapper {
  width: 100%;
  height: 100%;
  display: block;
}

/* Web Component 会自动渲染内容 */
a2ui-surface {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
