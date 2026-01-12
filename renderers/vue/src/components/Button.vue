/* Copyright 2025 Google LLC Licensed under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance with the License. You
may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License. */

<script setup lang="ts">
import { computed } from "vue";
import type { Types } from "@a2ui/lit/0.8";
import DynamicComponent from "../DynamicComponent.vue";

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.ButtonNode;
  components?: Map<string, Types.AnyComponentNode>;
}>();

const emit = defineEmits(["action"]);

const action = computed(() => props.component.properties.action);

const childComponent = computed(() => {
  return props.component.properties.child || null;
});

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
  <button
    class="a2ui-button"
    :style="{ flex: component.weight ?? 'initial' }"
    @click="handleClick"
  >
    <DynamicComponent
      v-if="childComponent"
      :surface-id="surfaceId"
      :component="childComponent"
      :components="components"
      @action="(action: any, context: any) => emit('action', action, context)"
    />
  </button>
</template>

<style scoped>
.a2ui-button {
  display: block;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #1976d2;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.a2ui-button:hover {
  background: #1565c0;
}

.a2ui-button:active {
  transform: scale(0.98);
}
</style>
