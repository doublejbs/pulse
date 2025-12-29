import { observer } from 'mobx-react-lite'
import { useStore } from './stores/useStore'
import './App.css'

const App = observer(() => {
  const { counterStore } = useStore()

  return (
    <div className="app">
      <h1>Pulse</h1>
      <div className="card">
        <button onClick={() => counterStore.increment()}>
          count is {counterStore.count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
})

export default App

