# A2UI Vue 3 Renderer

A2UI renderer implementation for Vue 3.

## Installation

```bash
npm install @a2ui/vue
```

## Usage

```vue
<script setup lang="ts">
import { A2UISurface } from "@a2ui/vue";
import { ref } from "vue";

const surfaceData = ref(null);
</script>

<template>
  <A2UISurface :data="surfaceData" />
</template>
```

## Custom Components

Register your custom components from your private npm library:

```typescript
import { registerComponent } from "@a2ui/vue";
import { YourCustomButton } from "@your-org/components";

registerComponent("YourCustomButton", YourCustomButton);
```
