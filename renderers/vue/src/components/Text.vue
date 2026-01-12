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

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.TextNode;
}>();

const text = computed(() => {
  const textProp = props.component.properties.text;
  if ("literalString" in textProp) {
    return textProp.literalString;
  }
  // TODO: Handle path-based text binding
  return "";
});

const usageHint = computed(() => props.component.properties.usageHint);
</script>

<template>
  <component
    :is="usageHint || 'span'"
    class="a2ui-text"
    :style="{ flex: component.weight ?? 'initial' }"
  >
    {{ text }}
  </component>
</template>

<style scoped>
.a2ui-text {
  display: block;
}
</style>
