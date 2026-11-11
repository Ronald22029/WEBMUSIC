<script setup lang="ts">
import type { Artist } from '~/types/music'
defineProps<{artist:Artist; albumCount?:number}>()
</script>
<template>
<NuxtLink :to="'/artista/'+artist.slug" class="group motion-rise block min-w-0 rounded-2xl border border-white/[.05] bg-[#181b27]/85 p-3 text-center transition duration-300 hover:-translate-y-1 hover:border-violet-400/20 hover:bg-[#252737]">
 <div class="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-[#28253a] shadow-lg">
  <img v-if="artist.cover" :src="artist.cover" :alt="artist.name" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
  <div v-else class="flex h-full w-full items-center justify-center text-4xl">♪</div>
 </div>
 <div class="mt-4 truncate text-sm font-bold">{{artist.name}}</div>
 <div class="mt-1 text-xs text-[#9296aa]">{{albumCount||0}} álbumes</div>
</NuxtLink>
</template>
