/** Presentation-only dirty flag. Never controls the simulation or its ticker. */
export class RenderInvalidation {
  private dirty=true;
  invalidate(){this.dirty=true;}
  consume(continuous=false){
    const render=this.dirty||continuous;
    this.dirty=false;
    return render;
  }
  get pending(){return this.dirty;}
}
