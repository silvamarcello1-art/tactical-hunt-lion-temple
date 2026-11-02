import {it,expect} from 'vitest';
import {pickGroundedBody} from './picking';
it('picks a visible upper body even when its point rounds to the tile above its feet',()=>{
  const body={id:'guard',left:565,right:587,top:166,bottom:192};
  expect(Math.round(170/32)).toBe(5);expect(Math.round(body.bottom/32)).toBe(6);
  expect(pickGroundedBody({x:576,y:170},[body])).toBe('guard');
  expect(pickGroundedBody({x:560,y:170},[body])).toBeUndefined();
});
it('uses grounded draw depth without mutating candidates',()=>{
  const back={id:'back',left:0,right:20,top:0,bottom:30},front={id:'front',left:0,right:20,top:10,bottom:40},bodies=[back,front];
  expect(pickGroundedBody({x:10,y:20},bodies)).toBe('front');expect(bodies).toEqual([back,front]);
});
