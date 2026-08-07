export class DisplayObjectPool<T> {
  private readonly available: T[] = [];
  private active = 0;
  private created = 0;

  constructor(
    private readonly create: () => T,
    private readonly reset: (item: T) => void,
    private readonly capacity = 32,
  ) {}

  acquire() {
    const item = this.available.pop() ?? this.createNew();
    this.active++;
    return item;
  }

  release(item: T) {
    this.active = Math.max(0, this.active - 1);
    this.reset(item);
    if (this.available.length < this.capacity) this.available.push(item);
  }

  clear(destroy?: (item: T) => void) {
    for (const item of this.available) destroy?.(item);
    this.available.length = 0;
    this.active = 0;
  }

  get metrics() {
    return { active:this.active,pooled:this.available.length,created:this.created };
  }

  private createNew() {
    this.created++;
    return this.create();
  }
}
