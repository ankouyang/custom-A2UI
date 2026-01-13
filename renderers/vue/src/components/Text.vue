/* Copyright 2025 Google LLC Licensed under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance with the License. You
may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License. */

<script setup lang="ts">
import { computed, inject } from "vue";
import type { Types } from "@a2ui/lit/0.8";

const props = defineProps<{
  surfaceId: Types.SurfaceID;
  component: Types.TextNode;
  dataModel?: any;
}>();

// 从 provide 中获取数据模型，如果没有通过 props 传入
const injectedDataModel = inject<any>("a2ui-data-model", null);
const dataModel = computed(() => props.dataModel || injectedDataModel || {});

// 从数据模型中获取路径值
// 支持 Map 和普通对象两种格式
function getValueFromPath(path: string, model: any): any {
  if (!path || !model) return "";
  
  // 处理路径，如 "/message" 或 "message"
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const parts = cleanPath.split("/").filter(p => p); // 过滤空字符串
  
  let value = model;
  for (const part of parts) {
    if (!value) return "";
    
    // 处理 Map 类型
    if (value instanceof Map) {
      value = value.get(part);
    }
    // 处理数组类型（路径可能是数字索引）
    else if (Array.isArray(value) && /^\d+$/.test(part)) {
      value = value[parseInt(part, 10)];
    }
    // 处理普通对象
    else if (typeof value === "object" && part in value) {
      value = value[part];
    } else {
      return "";
    }
  }
  
  return value ?? "";
}

const text = computed(() => {
  // 获取 text 属性：可能是已转换格式或原始格式
  const component = props.component as any; // 使用 any 来处理原始格式和转换格式
  let textProp: any = null;
  
  if (component.properties?.text) {
    textProp = component.properties.text;
  } else if (component.component) {
    // 原始格式：{ component: { Text: { text: {...} } } }
    const componentObj = component.component;
    const componentType = Object.keys(componentObj)[0];
    if (componentType && componentObj[componentType]?.text) {
      textProp = componentObj[componentType].text;
    }
  }
  
  console.log("Text component:", component, "textProp:", textProp);
  
  if (!textProp) {
    console.warn("Text: No text prop found");
    return "";
  }
  
  if ("literalString" in textProp) {
    const result = textProp.literalString;
    console.log("Text: literalString:", result);
    return result;
  }
  
  if ("path" in textProp && textProp.path) {
    const result = getValueFromPath(textProp.path, dataModel.value);
    console.log("Text: path:", textProp.path, 
      "dataModel:", dataModel.value, 
      "dataModelType:", dataModel.value instanceof Map ? "Map" : typeof dataModel.value,
      "result:", result);
    return result;
  }
  
  console.warn("Text: textProp format not recognized:", textProp);
  return "";
});

const usageHint = computed(() => {
  const component = props.component as any; // 使用 any 来处理原始格式和转换格式
  let hint: string | undefined = undefined;
  
  if (component.properties?.usageHint) {
    hint = component.properties.usageHint;
  } else if (component.component) {
    // 原始格式
    const componentObj = component.component;
    const componentType = Object.keys(componentObj)[0];
    if (componentType && componentObj[componentType]?.usageHint) {
      hint = componentObj[componentType].usageHint;
    }
  }
  
  console.log("Text usageHint:", hint, "component:", component);
  return hint;
});

// 将 usageHint 映射到实际的 HTML 标签
// usageHint 是样式提示，不是直接的 HTML 标签名
const htmlTag = computed(() => {
  const hint = usageHint.value;
  // 有效的 HTML 标签：h1-h5 可以直接使用
  if (hint && ["h1", "h2", "h3", "h4", "h5"].includes(hint)) {
    return hint;
  }
  // body 和 caption 使用 p 标签
  if (hint === "body") {
    return "p";
  }
  if (hint === "caption") {
    return "small";
  }
  // 默认使用 span
  return "span";
});
</script>

<template>
  <component
    :is="htmlTag"
    class="a2ui-text"
    :class="`a2ui-text-${usageHint || 'span'}`"
    :style="{ flex: (props.component as any)?.weight ?? 'initial' }"
  >
    {{ text }}
  </component>
</template>

<style scoped>
.a2ui-text {
  display: block;
}

/* 确保 h3 有正确的样式 */
.a2ui-text-h3 {
  font-size: 1.75em;
  font-weight: bold;
  margin: 0.67em 0;
}

/* body 文本样式 */
.a2ui-text-body {
  font-size: 1em;
  line-height: 1.5;
  margin: 0.5em 0;
}
</style>
