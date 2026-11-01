/** One presentation refresh after a synchronous event batch; domain stays synchronous. */
export function coalescedRefresh(refresh:()=>void,enqueue:(task:()=>void)=>void=queueMicrotask) {
  let pending=false;
  return () => {
    if(pending)return;
    pending=true;
    enqueue(()=>{pending=false;refresh();});
  };
}
