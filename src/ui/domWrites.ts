/** Preserve node identity and avoid invalidating layout for identical values. */
export function writeText(node:Pick<Node,'textContent'>|null,value:string){
  if(node&&node.textContent!==value)node.textContent=value;
}
export function writeAttribute(node:Pick<Element,'getAttribute'|'setAttribute'>|null,name:string,value:string){
  if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);
}
export function writeStyle(style:Pick<CSSStyleDeclaration,'getPropertyValue'|'setProperty'>|undefined,name:string,value:string){
  if(style&&style.getPropertyValue(name)!==value)style.setProperty(name,value);
}
