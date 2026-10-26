// Deliberately memory-only: never included in saved state or backups.
export class PracticeHistory {
  entries = [];
  index = 0;
  get current() { return this.entries[this.index]; }
  get canGoBack() { return this.index > 0; }
  get canGoForward() { return this.index < this.entries.length - 1; }
  visit(id) {
    if (!this.current) this.entries[this.index] = {id, status:{}};
    return this.current;
  }
  previous() { if (this.canGoBack) this.index--; }
  next() { this.index++; return !!this.current; }
  select(id) {
    this.entries = this.entries.slice(0, this.index + 1);
    this.index = this.entries.length;
    return this.visit(id);
  }
}
