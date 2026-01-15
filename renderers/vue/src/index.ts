/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// 仅导出 Surface 容器组件（Vue 包装）
export { default as A2UISurface } from "./Surface.vue";

// 重新导出 Lit 的所有内容供 Vue 用户使用
export * as A2UI from "@a2ui/lit/0.8";

// 用户可以直接导入 Web Components：
// import '@a2ui/lit/ui';
// 
// 然后在模板中使用：
// <a2ui-button>, <a2ui-text>, etc.
//
// 或使用 A2UISurface 组件（推荐）：
// <A2UISurface v-model:messages="messages" @action="handleAction" />

