import {defaultAssistance,type AssistanceOptions} from '../control/PlayerCommand';
const key='tactical-hunt-assistance-v1';
export class AssistanceStore {
  private options:Record<string,AssistanceOptions>={};
  constructor(private storage:Pick<Storage,'getItem'|'setItem'>) {
    try {const saved=JSON.parse(storage.getItem(key)??'{}');if(saved.version===1) for(const id of ['knight','druid','sorcerer']) {
      const o=saved.heroes?.[id];if(o&&typeof o.autoAttack==='boolean'&&typeof o.autoSpells==='boolean')this.options[id]={autoAttack:o.autoAttack,autoSpells:o.autoSpells};
    }} catch { /* Preferences do not touch progression or restore orders. */ }
  }
  get(id:string){return {...(this.options[id]??defaultAssistance())};}
  set(id:string,options:AssistanceOptions){this.options[id]={...options};try{this.storage.setItem(key,JSON.stringify({version:1,heroes:this.options}));return true;}catch{return false;}}
}
