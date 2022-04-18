import { VoidFn } from '@/common';
export class Queue {
  private micro: Promise<void>;
  private stack: any[] = [];
  private isFlushing = false;
  constructor() {
    this.micro = Promise.resolve();
  }
  addFn(handler: VoidFn): void {
    if (typeof handler !== 'function') return;
    this.stack.push(handler);
    if (this.isFlushing) return;
    this.isFlushing = true;
    this.micro.then(() => this.flushStack());
  }
  flushStack(): void {
    const temp = this.stack.slice(0);
    this.stack.length = 0;
    this.isFlushing = false;
    for (let i = 0; i < temp.length; i++) {
      temp[i]();
    }
  }
}
