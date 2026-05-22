import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export default function Dashboard() {
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
      .select('*')
      .order('date', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('session_id', sessions[0].id)

      setStats({
        lastDate: sessions[0].date,
        lastExercises: logs?.length || 0,
        totalSessions: sessions.length,
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
        <a className="dash-action-btn" href="#register">
          <span className="dash-action-icon">➕</span>
          <span>Registrar Treino</span>
        </a>
        <a className="dash-action-btn" href="#history">
          <span className="dash-action-icon">📋</span>
          <span>Ver Histórico</span>
        </a>
        <a className="dash-action-btn" href="#progress">
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
