import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { renderTechniqueSummary, getTechniqueLabel } from '../services/techniqueDefaults'

export default function History() {
  const [sessions, setSessions] = useState([])
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    fetchCatalogs()
  }, [])

  useEffect(() => {
    if (exercises.length || equipment.length) fetchSessions()
  }, [exercises, equipment, sortOrder])

  async function fetchCatalogs() {
    const [exRes, eqRes] = await Promise.all([
      supabase.from('exercises').select('*'),
      supabase.from('equipment').select('*'),
    ])
    if (exRes.data) setExercises(exRes.data)
    if (eqRes.data) setEquipment(eqRes.data)
  }

  function getName(list, id) {
    return list.find(i => i.id === id)?.name || id?.substring(0, 8) || '-'
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${days[d.getDay()]}, ${day}-${month}-${d.getFullYear()}`
  }

  async function fetchSessions() {
    setLoading(true)

    const { data: sessionsData } = await supabase
      .from('workout_sessions')
      .select('*')
      .order('date', { ascending: sortOrder === 'asc' })
      .order('created_at', { ascending: sortOrder === 'asc' })

    if (!sessionsData) { setLoading(false); return }

    const ids = sessionsData.map(s => s.id)
    if (ids.length === 0) { setSessions(sessionsData); setLoading(false); return }

    const { data: logsData } = await supabase
      .from('session_exercises')
      .select('*')
      .in('session_id', ids)
      .order('order_index', { ascending: true })

    const grouped = {}
    if (logsData) {
      for (const log of logsData) {
        if (!grouped[log.session_id]) grouped[log.session_id] = []
        grouped[log.session_id].push(log)
      }
    }

    setSessions(sessionsData.map(s => ({
      ...s,
      exercises: grouped[s.id] || [],
    })))
    setLoading(false)
  }

  async function handleDeleteSession(sessionId) {
    setConfirmDeleteId(null)
    await supabase.from('workout_sessions').delete().eq('id', sessionId)
    fetchSessions()
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  const warmupExs = (exs) => exs.filter(e => e.block_type === 'warmup')
  const mainExs = (exs) => exs.filter(e => e.block_type === 'main')

  return (
    <div className="card">
      <div className="history-header">
        <h2>Histórico</h2>
        <select className="history-sort" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="desc">Mais recente</option>
          <option value="asc">Mais antigo</option>
        </select>
      </div>

      {loading ? (
        <p className="loading">Carregando...</p>
      ) : sessions.length === 0 ? (
        <p className="empty">Nenhum treino registrado.</p>
      ) : (
        <div className="session-list">
          {sessions.map(session => {
            const isExpanded = expanded === session.id
            const warmup = warmupExs(session.exercises)
            const main = mainExs(session.exercises)

            return (
              <div key={session.id} className={`session-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="session-card-header" onClick={() => session.exercises.length > 0 && toggleExpand(session.id)}>
                  <div className="session-card-info">
                    <span className="session-date">{formatDate(session.date)}</span>
                    {session.completed && <span className="session-complete-tag">✅</span>}
                    <span className="session-count">{session.exercises.length} exercício(s)</span>
                  </div>
                  <div className="session-card-actions">
                    {session.exercises.length > 0 && (
                      <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                    )}
                    {confirmDeleteId === session.id ? (
                      <span className="confirm-delete">
                        <span className="confirm-delete-text">Excluir?</span>
                        <button className="btn-confirm-yes" onClick={() => handleDeleteSession(session.id)}>✓</button>
                        <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>✕</button>
                      </span>
                    ) : (
                      <button className="btn-delete" onClick={() => setConfirmDeleteId(session.id)}>✕</button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="session-card-body">
                    {warmup.length > 0 && (
                      <div className="hist-group">
                        <h4 className="hist-group-title">🔥 Aquecimento</h4>
                        {warmup.map(ex => (
                          <div key={ex.id} className={`hist-ex ${ex.completed ? 'done' : ''}`}>
                            <span className="hist-ex-name">{getName(exercises, ex.exercise_id)}</span>
                            <span className="hist-ex-data">
                              {ex.warmup_data?.sets || '?'}x{ex.warmup_data?.reps || '?'}
                            </span>
                            {ex.completed ? <span className="hist-check">✔</span> : <span className="hist-alert">⚠️ Não finalizado</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {main.length > 0 && (
                      <div className="hist-group">
                        <h4 className="hist-group-title">💪 Parte Principal</h4>
                        {main.map(ex => (
                          <div key={ex.id} className={`hist-ex ${ex.completed ? 'done' : ''}`}>
                            <div className="hist-ex-info">
                              <span className="hist-ex-name">{getName(exercises, ex.exercise_id)}</span>
                              {ex.equipment_id && (
                                <span className="hist-ex-equip">{getName(equipment, ex.equipment_id)}</span>
                              )}
                              {ex.technique_type && (
                                <span className="hist-ex-tech">{getTechniqueLabel(ex.technique_type)}</span>
                              )}
                            </div>
                            <span className="hist-ex-data">
                              {renderTechniqueSummary(ex.technique_type, ex.technique_data)}
                            </span>
                            {ex.completed ? <span className="hist-check">✔</span> : <><span className="hist-alert">⚠️ Não finalizado</span><span className="hist-pending">⏳</span></>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
