import CounterStore from './CounterStore'

class RootStore {
  counterStore: CounterStore

  constructor() {
    this.counterStore = new CounterStore()
  }
}

export default RootStore

