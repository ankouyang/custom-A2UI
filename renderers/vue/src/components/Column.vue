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

// 处理 children：可能是 explicitList 数组，或者直接是数组
const children = computed(() => {
  // 获取 properties：可能是已转换格式（props.component.properties）
  // 或原始格式（props.component.component.Column.children）
  const component = props.component as any; // 使用 any 来处理原始格式和转换格式
  let childrenProp: any = null;
  
  if (component.properties?.children) {
    childrenProp = component.properties.children;
  } else if (component.component) {
    // 原始格式：{ component: { Column: { children: {...} } } }
    const componentObj = component.component;
    const componentType = Object.keys(componentObj)[0];
    if (componentType && componentObj[componentType]?.children) {
      childrenProp = componentObj[componentType].children;
    }
  }
  
  console.log("Column children prop:", childrenProp, "component:", component);
  
  if (!childrenProp) {
    console.warn("Column: No children prop found");
    return [];
  }
  
  // 如果是 explicitList 格式
  if (childrenProp.explicitList) {
    const childIds = childrenProp.explicitList;
    console.log("Column: explicitList childIds:", childIds);
    const resolved = childIds
      .map((childId: string) => {
        const child = props.components?.get(childId);
        console.log(`Column: Looking for child '${childId}':`, child ? "found" : "not found");
        return child;
      })
      .filter(Boolean);
    console.log("Column: Resolved children:", resolved);
    return resolved;
  }
  
  // 如果直接是数组
  if (Array.isArray(childrenProp)) {
    return childrenProp;
  }
  
  console.warn("Column: childrenProp is not explicitList or array:", childrenProp);
  return [];
});

const gap = computed(() => {
  const component = props.component as any;
  // 尝试从已转换格式获取
  if (component.properties?.gap !== undefined) {
    return component.properties.gap;
  }
  // 尝试从原始格式获取
  if (component.component) {
    const componentObj = component.component;
    const componentType = Object.keys(componentObj)[0];
    if (componentType && componentObj[componentType]?.gap !== undefined) {
      return componentObj[componentType].gap;
    }
  }
  return 0;
});
</script>

<template>
  <div class="a2ui-column" :style="{ gap: `${gap}px`, flex: (props.component as any)?.weight ?? 'initial' }">
    <DynamicComponent
      v-for="(child, index) in children"
      :key="child?.id || `child-${index}`"
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
