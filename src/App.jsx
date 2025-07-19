import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage.jsx'
import AuthPage from './components/AuthPage.jsx'
import AppDashboard from './components/AppDashboard.jsx'
import AccountView from './components/AccountView.jsx'
import TransactionPage from './components/TransactionPage.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app" element={<AppDashboard />} />
        <Route path="/account" element={<AccountView />} />
        <Route path="/transaction" element={<TransactionPage />} />
      </Routes>
    </Router>
  )
}

export default App

