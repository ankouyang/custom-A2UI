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

import type { Component } from "vue";

export interface ComponentConfig {
  component: Component;
  props?: Record<string, any>;
}

class ComponentRegistry {
  private registry = new Map<string, Component>();

  register(typeName: string, component: Component) {
    if (!/^[a-zA-Z0-9]+$/.test(typeName)) {
      throw new Error(
        `[Registry] Invalid typeName '${typeName}'. Must be alphanumeric.`
      );
    }
    this.registry.set(typeName, component);
  }

  get(typeName: string): Component | undefined {
    return this.registry.get(typeName);
  }

  has(typeName: string): boolean {
    return this.registry.has(typeName);
  }
}

export const componentRegistry = new ComponentRegistry();

export function registerComponent(typeName: string, component: Component) {
  componentRegistry.register(typeName, component);
}
