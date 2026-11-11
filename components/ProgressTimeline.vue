<script setup lang="ts">
import { formatTime } from '~/utils/format'

const props = withDefaults(defineProps<{
  position: number
  duration: number
  playing: boolean
  buffering?: boolean
  large?: boolean
}>(), { buffering: false, large: false })
const emit = defineEmits<{ seek: [seconds: number] }>()
const valid = computed(() => Number.isFinite(props.duration) && props.duration > 0)
const max = computed(() => valid.value ? props.duration : 1)
const percent = computed(() => valid.value ? Math.max(0, Math.min(100, props.position / props.duration * 100)) : 0)
const bars = Array.from({length: 72}, (_, i) => {
  // Forma decorativa determinista, NO representa las frecuencias del audio.
  const wave = Math.abs(Math.sin(i * .61) * Math.cos(i * .17))
  return Math.round(18 + wave * 75)
})
function seek(e: Event) {
  if (!valid.value) return
  emit('seek', Number((e.target as HTMLInputElement).value))
}
</script>
<template>
<div class="timeline w-full" :class="{'timeline--large':large, 'timeline--playing':playing && !buffering}">
  <div class="flex items-center gap-3">
    <span class="w-11 flex-none text-right text-[11px] font-semibold tabular-nums text-[#a9aec4]">{{formatTime(position)}}</span>
    <div class="timeline-track group relative h-8 min-w-0 flex-1">
      <div class="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-white/[.12]"></div>
      <div class="timeline-waves absolute inset-x-0 top-1/2 flex h-[18px] -translate-y-1/2 items-center justify-between gap-[2px] overflow-hidden opacity-40" aria-hidden="true">
        <i v-for="(h,i) in bars" :key="i" class="min-w-0 flex-1 rounded-full bg-[#a1a7bd]" :style="{height:h+'%'}"/>
      </div>
      <div class="timeline-fill absolute left-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#7657f4] via-[#b376ff] to-[#e3a8fa]" :style="{width:percent+'%'}">
        <span v-if="playing && valid" class="timeline-light pointer-events-none absolute inset-0 rounded-full"/>
      </div>
      <div v-if="valid" class="timeline-thumb pointer-events-none absolute top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#f2dcff] bg-[#ad7bff] shadow-[0_0_15px_rgba(169,103,255,.9)]" :style="{left:percent+'%'}"/>
      <input class="timeline-input absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" type="range"
        :min="0" :max="max" :step="0.25" :value="Math.max(0, Math.min(position, max))" :disabled="!valid"
        :aria-valuetext="formatTime(position)+' de '+(valid?formatTime(duration):'duración desconocida')"
        aria-label="Avanzar o retroceder la canción" @input="seek"/>
    </div>
    <span class="w-11 flex-none text-left text-[11px] font-semibold tabular-nums text-[#a9aec4]">{{valid?formatTime(duration):'--:--'}}</span>
  </div>
  <p v-if="!valid && buffering" class="mt-1 text-center text-[10px] text-[#9993b5]">Obteniendo duración del audio…</p>
</div>
</template>
<style scoped>
.timeline-fill,.timeline-thumb{transition:width .2s linear,left .2s linear}
.timeline-track:hover .timeline-thumb{transform:translate(-50%,-50%) scale(1.2)}
.timeline-light{background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);background-size:220% 100%;animation:timeline-sweep 3s linear infinite;mix-blend-mode:screen}
.timeline--playing .timeline-thumb{animation:timeline-pulse 1.7s ease-in-out infinite}
.timeline--large .timeline-track{height:46px}
.timeline--large .timeline-waves{height:30px}
.timeline--large .timeline-fill{height:6px}
.timeline-input:focus-visible{outline:2px solid #d8b4fe;outline-offset:3px;border-radius:12px;opacity:.12}
@keyframes timeline-pulse{50%{box-shadow:0 0 22px rgba(173,121,255,1),0 0 0 6px rgba(173,121,255,.13)}}
@keyframes timeline-sweep{0%{background-position:220% 0}100%{background-position:-220% 0}}
@media(prefers-reduced-motion:reduce){.timeline-light,.timeline--playing .timeline-thumb{animation:none}.timeline-fill,.timeline-thumb{transition:none}}
</style>
