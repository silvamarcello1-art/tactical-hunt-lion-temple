import { describe, expect, it } from 'vitest';
import manifestText from '../../../public/assets/original/manifests/sprites.json?raw';
import { clipFrame } from './SpriteLibrary';
import { spriteAction, type SpriteDefinition } from './SpriteDefinition';

const definitions = JSON.parse(manifestText) as SpriteDefinition[];
describe('original sprite export contract',() => {
  it('has six original silhouettes with every cardinal action inside its atlas',() => {
    expect(new Set(definitions.map(item => item.id)).size).toBe(6);
    for (const definition of definitions) {
      expect(definition.spriteSet).toMatch(/^\/assets\/original\//);
      expect(definition.footAnchor).toEqual({x:.5,y:.875});
      for (const action of ['idle','walk','attack','cast','hit','death'] as const) {
        for (const facing of ['north','east','south','west'] as const) {
          const clip = definition.animations.clips[action]![facing]!;
          expect(clip.frames.length).toBe(clip.frameCount);
          expect(clip.frameDuration * clip.frameRate).toBeCloseTo(1000);
          for (const frame of clip.frames) {
            const [x,y] = frame.split(':').map(Number);
            expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(4);
            expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThan(16);
          }
        }
      }
    }
  });
  it('samples frames without advancing during pause and clamps terminal clips',() => {
    const walk = definitions[0].animations.clips.walk!.north!;
    expect(clipFrame(walk,0)).toBe(walk.frames[0]);
    expect(clipFrame(walk,walk.frameDuration)).toBe(walk.frames[1]);
    expect(clipFrame(walk,walk.frameDuration*4)).toBe(walk.frames[0]);
    const death = definitions[0].animations.clips.death!.south!;
    expect(clipFrame(death,100000)).toBe(death.frames.at(-1));
    expect(clipFrame(death,-100)).toBe(death.frames[0]);
  });
  it('maps combat phases into the replaceable six-action asset contract',() => {
    expect(spriteAction('attack_windup')).toBe('attack');
    expect(spriteAction('attack_recovery')).toBe('attack');
    expect(spriteAction('healing')).toBe('cast');
    expect(spriteAction('dead')).toBe('death');
  });
});
