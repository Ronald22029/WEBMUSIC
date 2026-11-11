<script setup lang="ts">
import { Play, Heart } from 'lucide-vue-next'
import type { Track, Artist, Album } from '~/types/music'
import { formatTime } from '~/utils/format'
const props = defineProps<{ track: Track; index: number; artist?: Artist; album?: Album; queue?: Track[] }>()
const player = usePlayer()
const lib = useLocalLibrary()
const selected = computed(() => player.current.value?.id === props.track.id)
const liked = computed(() => lib.isFavorite(props.track.id))
function play(){ void player.start(props.track,props.queue) }
</script>
<template>
<div class="group flex items-center gap-2 rounded-xl px-1 transition duration-200 hover:bg-white/[.055]" :class="{'bg-violet-500/[.08]':selected}">
  <button class="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left sm:gap-4" :aria-label="'Reproducir '+track.title" @click="play">
    <span class="flex w-5 flex-none justify-center text-xs" :class="selected?'text-violet-400':'text-[#858a9d]'">
      <EqualizerBars v-if="selected&&player.playing.value" active small/>
      <span v-else class="group-hover:hidden">{{track.trackNumber||index+1}}</span>
      <Play v-if="!(selected&&player.playing.value)" :size="15" class="hidden group-hover:block"/>
    </span>
    <img v-if="track.cover||album?.cover" :src="track.cover||album?.cover" :alt="'Portada de '+track.title" loading="lazy" class="h-11 w-11 flex-none rounded-lg bg-[#272a38] object-cover"/>
    <div v-else class="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-[#272a38] text-violet-300">♪</div>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-semibold" :class="selected?'text-violet-300':'text-[#ececf5]'">{{track.title}}</span>
      <span class="mt-1 block truncate text-xs text-[#9297a9]">{{artist?.name||'Artista'}}</span>
    </span>
    <span class="hidden max-w-40 flex-1 truncate text-xs text-[#898da0] md:block">{{album?.title}}</span>
  </button>
  <button class="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[#9b9db0] transition hover:bg-white/10 hover:text-violet-300" :class="liked?'!text-violet-400':''" :aria-label="liked?'Quitar de favoritos':'Agregar a favoritos'" :aria-pressed="liked" @click="lib.toggleFavorite(track.id)">
    <Heart :size="17" :fill="liked?'currentColor':'none'"/>
  </button>
  <span class="w-10 flex-none pr-1 text-right text-[11px] tabular-nums text-[#878ba0]">{{track.duration?formatTime(track.duration):'—'}}</span>
</div>
</template>
