export class EventEmitter {
  constructor() {
    this.events = []
  }

  on(type, func) {
    this.events.push({ type, func, once: false })
  }

  once(type, func) {
    this.events.push({ type, func, once: true })
  }

  off(type, func) {
    this.events = this.events.filter(e => e.type !== type || e.func !== func)
  }

  emit(type, value) {
    for (const event of this.events) {
      if (event.type === type) {
        if (event.once) {
          this.events = this.events.filter(e => e !== event)
        }
        event.func(value)
      }
    }
  }
}
