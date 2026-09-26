import {it,expect} from 'vitest';
import {MouseGesture} from './MouseGesture';
it.each([[0,2],[2,0]])('chord %s + %s consumes all releases', (first,second)=>{
  const gesture=new MouseGesture();expect(gesture.down(first,first===0?1:2)).toBeUndefined();
  expect(gesture.down(second,3)).toBe('look');expect(gesture.up(second)).toBeUndefined();expect(gesture.up(first)).toBeUndefined();
  gesture.down(0,1);expect(gesture.up(0)).toBe('select');gesture.down(2,2);expect(gesture.up(2)).toBe('engage');
});
it('cancel and unmatched release never emit a click',()=>{const m=new MouseGesture();m.down(0,1);m.clear();expect(m.up(0)).toBeUndefined();});
