<script setup lang="ts">
defineProps<{ modelValue: boolean; label?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<template>
  <button
    class="switch"
    :class="{ 'switch--on': modelValue }"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    type="button"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="switch__knob" />
  </button>
</template>

<style scoped>
.switch {
  position: relative;
  width: 38px;
  height: 22px;
  flex: none;
  border-radius: 99px;
  background: var(--border-strong);
  transition: background-color 0.16s ease;
}
.switch--on {
  background: var(--accent);
}
.switch:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.switch__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.16s cubic-bezier(0.4, 0, 0.2, 1);
}
.switch--on .switch__knob {
  transform: translateX(16px);
}
</style>
