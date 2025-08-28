<template>
  <slot v-if="hasPermission" />
  <slot
    v-else-if="props.onDenied"
    name="unauthorized"
    @onDenied="props.onDenied()"
  />
  <slot v-else name="unauthorized" />
</template>

<script setup lang="ts">
import { useUserStore } from "../../stores/user";
import { computed } from "vue";

const props = defineProps<{
  permission: string | string[];
  onDenied?: () => void;
}>();

const userStore = useUserStore();

const hasPermission = computed(() => {
  return Array.isArray(props.permission)
    ? props.permission.some((p) => userStore.hasPermission(p))
    : userStore.hasPermission(props.permission);
});
</script>
