/** Resolve on release so a two-button chord consumes BOTH clicks, in either order. */
export class MouseGesture {
  private pressed=0;
  private consumed=false;
  down(button:number,buttons:number):'look'|undefined {
    if (!this.pressed) this.consumed=false;
    this.pressed|=button===0?1:button===2?2:0;
    if ((buttons&3)===3 && !this.consumed) {this.consumed=true;return 'look';}
  }
  up(button:number):'select'|'engage'|undefined {
    const bit=button===0?1:button===2?2:0;
    const wasPressed=!!(this.pressed&bit);
    this.pressed&=~bit;
    if (!wasPressed || this.consumed) return;
    return button===0?'select':button===2?'engage':undefined;
  }
  clear(){this.pressed=0;this.consumed=false;}
}
