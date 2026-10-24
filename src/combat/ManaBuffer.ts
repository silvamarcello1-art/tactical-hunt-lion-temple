/** Selected 2026 mage mechanic. Ordinary damage only; no online/world-type rules. */
export function manaBuffer(hp:number,mana:number,maxMana:number,damage:number,now:number,surchargeUntil=0){
  if(damage<=hp)return {hp:Math.max(0,hp-damage),mana,activated:false,manaSpent:0,surchargeUntil};
  const manaSpent=(damage-hp)*8+(now>=surchargeUntil?Math.ceil(maxMana*.25):0);
  return {hp:mana>manaSpent?1:0,mana:Math.max(0,mana-manaSpent),activated:true,manaSpent,surchargeUntil:now>=surchargeUntil?now+2000:surchargeUntil};
}
