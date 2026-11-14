<script setup lang="ts">
import { Music2 } from 'lucide-vue-next'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  eager?: boolean
  width?: number
  height?: number
}>(), { src: '', alt: '', eager: false })
const broken = ref(false)
const usable = computed(() => {
  const src = (props.src || '').trim()
  return !broken.value && (/^https?:\/\//i.test(src) || src.startsWith('/'))
})
watch(() => props.src, () => { broken.value = false })
</script>
<template>
  <img
    v-if="usable"
    v-bind="$attrs"
    :src="src || undefined"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    :fetchpriority="eager ? 'high' : 'low'"
    :width="width"
    :height="height"
    referrerpolicy="strict-origin-when-cross-origin"
    @error="broken = true"
  />
  <span v-else v-bind="$attrs" role="img" :aria-label="alt || 'Portada no disponible'"
    class="flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-[#272b40] text-violet-200">
    <Music2 :size="32" aria-hidden="true" />
  </span>
</template>
