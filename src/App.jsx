import { useState } from 'react'
import { supabase } from './services/supabaseClient'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/AuthPage'
import Profile, { getInitial } from './components/Profile'
import Dashboard from './components/Dashboard'
import WorkoutSession from './components/WorkoutSession'
import History from './components/History'
import Progress from './components/Progress'
import Manage from './components/Manage'
import HowToUse from './components/HowToUse'

const tabs = [
  { id: 'dashboard', label: 'Início', icon: '🏠' },
  { id: 'workout', label: 'Treinar', icon: '🏋️' },
  { id: 'history', label: 'Histórico', icon: '📋' },
  { id: 'progress', label: 'Progresso', icon: '📈' },
  { id: 'manage', label: 'Gerenciar', icon: '⚙️' },
  { id: 'howtouse', label: 'Ajuda', icon: '❓' },
]

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="loading">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (showProfile) {
    return (
      <div className="app">
        <Profile user={user} onBack={() => setShowProfile(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>
            <span className="header-icon">💪</span>
            TreinoDuoTreino
          </h1>
          <div className="user-menu">
            <button className="user-btn" onClick={() => setShowProfile(true)}>
              {getInitial(user)}
            </button>
          </div>
        </div>
        <p className="subtitle">Controle sua evolução na academia</p>
      </header>

      <nav className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'workout' && <WorkoutSession />}
        {activeTab === 'history' && <History />}
        {activeTab === 'progress' && <Progress />}
        {activeTab === 'manage' && <Manage />}
        {activeTab === 'howtouse' && <HowToUse />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
