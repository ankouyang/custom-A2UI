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

export { componentRegistry, registerComponent } from "./component-registry";
export { default as A2UISurface } from "./Surface.vue";
export { default as DynamicComponent } from "./DynamicComponent.vue";

// 导出标准组件以便自定义
export { default as Button } from "./components/Button.vue";
export { default as Text } from "./components/Text.vue";

// 重新导出 A2UI 核心类型和工具
export * as A2UI from "@a2ui/lit/0.8";
