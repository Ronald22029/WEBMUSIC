<script setup lang="ts">
withDefaults(defineProps<{ active?: boolean; small?: boolean }>(), { active: false, small: false })
</script>
<template>
<span class="equalizer" :class="{ 'equalizer--playing': active, 'equalizer--small': small }" aria-hidden="true">
 <i v-for="bar in 5" :key="bar"/>
</span>
</template>
<style scoped>
.equalizer{display:inline-flex;align-items:center;justify-content:center;gap:3px;width:28px;height:24px}
.equalizer i{display:block;width:3px;height:26%;border-radius:6px;background:#c4b5fd;transform-origin:center}
.equalizer--small{width:20px;height:18px;gap:2px}.equalizer--small i{width:2px}
.equalizer--playing i{animation:eq 850ms ease-in-out infinite alternate}
.equalizer--playing i:nth-child(2){animation-delay:-580ms;animation-duration:650ms}
.equalizer--playing i:nth-child(3){animation-delay:-200ms;animation-duration:950ms}
.equalizer--playing i:nth-child(4){animation-delay:-720ms;animation-duration:700ms}
.equalizer--playing i:nth-child(5){animation-delay:-410ms;animation-duration:800ms}
@keyframes eq{from{height:20%}to{height:94%}}
@media(prefers-reduced-motion:reduce){.equalizer--playing i{animation:none;height:55%}}
</style>
