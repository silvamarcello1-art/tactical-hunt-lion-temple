import {defaultAppearance,normalizeAppearance,type CharacterAppearance} from '../data/outfits';
const heroes=['knight','druid','sorcerer'] as const;
export const APPEARANCE_KEY='tactical-hunt-appearance-v1';
/** Cosmetic namespace only. Never reads/writes economic saves or combat state. */
export class AppearanceStore {
  private values:Record<string,CharacterAppearance>={};
  private futureVersion=false;
  warning='';
  constructor(private storage:Pick<Storage,'getItem'|'setItem'>){
    try {
      const raw=storage.getItem(APPEARANCE_KEY);if(!raw)return;
      const saved=JSON.parse(raw);
      if(saved?.version!==1){this.futureVersion=true;this.warning='Save cosmético de versão desconhecida preservado; somente sessão.';return;}
      for(const hero of heroes)this.values[hero]=normalizeAppearance(saved.heroes?.[hero],hero);
    }catch{this.warning='Preferências cosméticas ilegíveis; aparência original preservada.';}
  }
  get(hero:string){return structuredClone(this.values[hero]??defaultAppearance(hero));}
  set(hero:string,value:CharacterAppearance){
    if(!heroes.includes(hero as typeof heroes[number]))return false;
    this.values[hero]=normalizeAppearance(value,hero);
    if(this.futureVersion)return false;
    try{this.storage.setItem(APPEARANCE_KEY,JSON.stringify({version:1,heroes:this.values}));this.warning='';return true;}
    catch{this.warning='Aparência aplicada nesta sessão; não foi possível salvar.';return false;}
  }
}
