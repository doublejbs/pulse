import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TopicBoardPage from './pages/TopicBoardPage'
import LoginPage from './pages/LoginPage'
import SearchPageView from './pages/SearchPageView'

const App = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/topic/:id" element={<TopicBoardPage />} />
          <Route path="/search" element={<SearchPageView />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App

