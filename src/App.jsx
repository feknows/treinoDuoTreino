import { useState } from 'react'
import { supabase } from './services/supabaseClient'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/AuthPage'
import RegisterWorkout from './components/RegisterWorkout'
import History from './components/History'
import Progress from './components/Progress'
import Manage from './components/Manage'
import HowToUse from './components/HowToUse'

const tabs = [
  { id: 'register', label: 'Registrar', icon: '➕' },
  { id: 'history', label: 'Histórico', icon: '📋' },
  { id: 'progress', label: 'Progresso', icon: '📈' },
  { id: 'manage', label: 'Gerenciar', icon: '⚙️' },
  { id: 'howtouse', label: 'Ajuda', icon: '❓' },
]

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('register')
  const [menuOpen, setMenuOpen] = useState(false)

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

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>
            <span className="header-icon">💪</span>
            TreinoDuoTreino
          </h1>
          <div className="user-menu">
            <button className="user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              {user.email?.[0]?.toUpperCase() || 'U'}
            </button>
            {menuOpen && (
              <div className="user-dropdown">
                <span className="user-email">{user.email}</span>
                <button onClick={() => { supabase.auth.signOut(); setMenuOpen(false) }}>
                  Sair
                </button>
              </div>
            )}
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
        {activeTab === 'register' && <RegisterWorkout />}
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
