import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [name, setName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const displayName = data.user?.user_metadata?.display_name
      setName(displayName || data.user?.email?.split('@')[0] || '')
    })
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('*, session_exercises(count)')
      .order('date', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      const { count } = await supabase
        .from('session_exercises')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessions[0].id)

      setStats({
        lastDate: sessions[0].date,
        lastExercises: count || 0,
        totalSessions: sessions.length,
        lastCompleted: sessions[0].completed,
      })
    } else {
      setStats({ lastDate: null, lastExercises: 0, totalSessions: 0 })
    }
  }

  return (
    <div className="card dashboard">
      <div className="dash-welcome">
        <div className="dash-avatar">
          {name?.[0]?.toUpperCase() || '💪'}
        </div>
        <h2>Olá, {name || 'atleta'}!</h2>
        <p className="dash-subtitle">Bora treinar hoje?</p>
      </div>

      <div className="dash-actions">
        <a className="dash-action-btn" href="#workout" onClick={e => { e.preventDefault(); onNavigate?.('workout') }}>
          <span className="dash-action-icon">🏋️</span>
          <span>Treinar Agora</span>
        </a>
        <a className="dash-action-btn" href="#history" onClick={e => { e.preventDefault(); onNavigate?.('history') }}>
          <span className="dash-action-icon">📋</span>
          <span>Ver Histórico</span>
        </a>
        <a className="dash-action-btn" href="#progress" onClick={e => { e.preventDefault(); onNavigate?.('progress') }}>
          <span className="dash-action-icon">📈</span>
          <span>Meu Progresso</span>
        </a>
      </div>

      <div className="dash-stats">
        <h3>Resumo</h3>
        {stats ? (
          <div className="dash-stats-grid">
            <div className="dash-stat">
              <span className="dash-stat-value">{stats.totalSessions}</span>
              <span className="dash-stat-label">Treinos</span>
            </div>
            {stats.lastDate && (
              <>
                <div className="dash-stat">
                  <span className="dash-stat-value">{stats.lastExercises}</span>
                  <span className="dash-stat-label">Últimos exercícios</span>
                </div>
                <div className="dash-stat">
                  <span className="dash-stat-value">{stats.lastDate}</span>
                  <span className="dash-stat-label">Último treino</span>
                </div>
              </>
            )}
            {!stats.lastDate && (
              <div className="dash-stat dash-stat-full">
                <span className="dash-stat-label">Nenhum treino registrado ainda. Comece agora!</span>
              </div>
            )}
          </div>
        ) : (
          <p className="loading">Carregando...</p>
        )}
      </div>
    </div>
  )
}
