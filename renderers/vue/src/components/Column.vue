/* Copyright 2025 Google LLC */

<script setup lang="ts">
import { computed } from 'vue';
import type { Types } from '@a2ui/lit/0.8';
import DynamicComponent from '../DynamicComponent.vue';

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: any;
  components?: Map<string, Types.AnyComponentNode>;
}>();

const emit = defineEmits(['action']);

const children = computed(() => props.component.properties?.children || []);
const gap = computed(() => props.component.properties?.gap || 0);
</script>

<template>
  <div class="a2ui-column" :style="{ gap: `${gap}px`, flex: component.weight ?? 'initial' }">
    <DynamicComponent
      v-for="(child, index) in children"
      :key="child.id || index"
      :surface-id="surfaceId"
      :component="child"
      :components="components"
      @action="(action: any, context: any) => emit('action', action, context)"
    />
  </div>
</template>

<style scoped>
.a2ui-column {
  display: flex;
  flex-direction: column;
}
</style>
