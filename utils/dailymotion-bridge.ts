type Command = {play?:()=>Promise<unknown>|void;pause?:()=>Promise<unknown>|void;seek?:(seconds:number)=>Promise<unknown>|void;setVolume?:(volume:number)=>Promise<unknown>|void}
let controller:Command|null=null
export const dailymotionBridge={
  connect(value:Command){controller=value},
  disconnect(value:Command){if(controller===value)controller=null},
  play(){if(!controller?.play)return false;void Promise.resolve(controller.play()).catch(()=>{});return true},
  pause(){if(controller?.pause)void Promise.resolve(controller.pause()).catch(()=>{})},
  seek(seconds:number){if(controller?.seek)void Promise.resolve(controller.seek(seconds)).catch(()=>{})},
  volume(value:number){if(controller?.setVolume)void Promise.resolve(controller.setVolume(value)).catch(()=>{})}
}
