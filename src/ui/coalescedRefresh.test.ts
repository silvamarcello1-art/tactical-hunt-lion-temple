import {describe,expect,it} from 'vitest';
import {coalescedRefresh} from './coalescedRefresh';

describe('coalesced presentation refresh',()=>{
  it('refreshes once with the latest state after a synchronous batch',()=>{
    const tasks:Array<()=>void>=[],seen:number[]=[];let state=0;
    const request=coalescedRefresh(()=>seen.push(state),task=>tasks.push(task));
    for(let i=1;i<=20;i++){state=i;request();}
    expect(tasks).toHaveLength(1);expect(seen).toEqual([]);
    tasks.shift()!();expect(seen).toEqual([20]);
    state=21;request();expect(tasks).toHaveLength(1);tasks.shift()!();expect(seen).toEqual([20,21]);
  });
  it('does not lose a new request made by the refresh itself',()=>{
    const tasks:Array<()=>void>=[];let calls=0;
    const request=coalescedRefresh(()=>{if(++calls===1)request();},task=>tasks.push(task));
    request();tasks.shift()!();expect(tasks).toHaveLength(1);
    tasks.shift()!();expect(calls).toBe(2);expect(tasks).toHaveLength(0);
  });
  it('does not stay pending when a refresh throws',()=>{
    const tasks:Array<()=>void>=[];
    const request=coalescedRefresh(()=>{throw new Error('presentation failure');},task=>tasks.push(task));
    request();expect(()=>tasks.shift()!()).toThrow('presentation failure');
    request();expect(tasks).toHaveLength(1);
  });
});
