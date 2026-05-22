import { useState } from 'react'
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

export default function App() {
  const [activeTab, setActiveTab] = useState('register')

  return (
    <div className="app">
      <header className="header">
        <h1>
          <span className="header-icon">💪</span>
          TreinoDuoTreino
        </h1>
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
