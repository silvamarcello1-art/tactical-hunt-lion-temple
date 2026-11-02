import {describe,it,expect,vi} from 'vitest';
import {writeText,writeAttribute,writeStyle} from './domWrites';
describe('unchanged DOM writes',()=>{
  it('preserves identical text nodes and writes changed or cleared text',()=>{
    let value='ready';const set=vi.fn((v:string|null)=>{value=v??'';});
    const node={get textContent(){return value;},set textContent(v:string|null){set(v);}};
    writeText(node,'ready');expect(set).not.toHaveBeenCalled();
    writeText(node,'changed');writeText(node,'');expect(set.mock.calls).toEqual([['changed'],['']]);
  });
  it('writes attributes only when needed, including an absent empty attribute',()=>{
    const values=new Map<string,string>();const setAttribute=vi.fn((k:string,v:string)=>{values.set(k,v);});
    const node={getAttribute:(k:string)=>values.get(k)??null,setAttribute};
    writeAttribute(node,'data-target','');writeAttribute(node,'data-target','');writeAttribute(node,'data-target','lion');
    expect(setAttribute.mock.calls).toEqual([['data-target',''],['data-target','lion']]);
  });
  it('preserves equal CSS custom properties but updates changed values',()=>{
    const values=new Map<string,string>();const setProperty=vi.fn((k:string,v:string|null)=>{values.set(k,v??'');});
    const style={getPropertyValue:(k:string)=>values.get(k)??'',setProperty};
    writeStyle(style,'--angle','0deg');writeStyle(style,'--angle','0deg');writeStyle(style,'--angle','90deg');
    expect(setProperty.mock.calls).toEqual([['--angle','0deg'],['--angle','90deg']]);
  });
  it('allows optional elements without changing application state',()=>{
    expect(()=>{writeText(null,'');writeAttribute(null,'x','');writeStyle(undefined,'cursor','');}).not.toThrow();
  });
});
