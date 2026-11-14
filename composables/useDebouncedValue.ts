import { ref, watch, onScopeDispose, type Ref } from 'vue'
export function useDebouncedValue<T>(source:Ref<T>,delay=250):Ref<T>{
 const value=ref(source.value) as Ref<T>
 let timeout:ReturnType<typeof setTimeout>|undefined
 watch(source,next=>{
  if(timeout)clearTimeout(timeout)
  timeout=setTimeout(()=>{value.value=next},delay)
 })
 onScopeDispose(()=>{if(timeout)clearTimeout(timeout)})
 return value
}
