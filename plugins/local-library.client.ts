export default defineNuxtPlugin(() => {
  const library = useLocalLibrary()
  onNuxtReady(() => library.hydrate())
})
