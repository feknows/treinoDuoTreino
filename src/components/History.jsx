import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export default function History() {
  const [sessions, setSessions] = useState([])
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetchExercises()
    fetchEquipment()
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchExercises() {
    const { data } = await supabase.from('exercises').select('*').order('name')
    if (data) setExercises(data)
  }

  async function fetchEquipment() {
    const { data } = await supabase.from('equipment').select('*').order('name')
    if (data) setEquipment(data)
  }

  function getName(list, id) {
    return list.find(i => i.id === id)?.name || id
  }

  async function fetchSessions() {
    setLoading(true)

    const { data: sessionsData } = await supabase
      .from('workout_sessions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (!sessionsData) {
      setLoading(false)
      return
    }

    const ids = sessionsData.map(s => s.id)
    if (ids.length === 0) {
      setSessions(sessionsData)
      setLoading(false)
      return
    }

    const { data: logsData } = await supabase
      .from('workout_logs')
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

    const sessionsWithLogs = sessionsData.map(s => ({
      ...s,
      logs: grouped[s.id] || [],
    }))

    setSessions(sessionsWithLogs)
    setLoading(false)
  }

  async function handleDeleteSession(sessionId) {
    if (!window.confirm('Excluir esta sessão de treino inteira?')) return
    const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId)
    if (!error) fetchSessions()
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id)
  }

  return (
    <div className="card">
      <h2>Histórico</h2>

      {loading ? (
        <p className="loading">Carregando...</p>
      ) : sessions.length === 0 ? (
        <p className="empty">Nenhum treino registrado.</p>
      ) : (
        <div className="session-list">
          {sessions.map(session => {
            const isExpanded = expanded === session.id
            const isExpandable = session.logs.length > 0

            return (
              <div key={session.id} className={`session-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="session-card-header" onClick={() => isExpandable && toggleExpand(session.id)}>
                  <div className="session-card-info">
                    <span className="session-date">{session.date}</span>
                    {session.notes && <span className="session-notes">{session.notes}</span>}
                    <span className="session-count">{session.logs.length} exercício(s)</span>
                  </div>
                  <div className="session-card-actions">
                    {isExpandable && (
                      <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                    )}
                    <button className="btn-delete" onClick={() => handleDeleteSession(session.id)}>✕</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="session-card-body">
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Exercício</th>
                            <th>Equipamento</th>
                            <th>Carga</th>
                            <th>Séries</th>
                            <th>Reps</th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.logs.map((log, i) => (
                            <tr key={log.id}>
                              <td>{i + 1}</td>
                              <td>{getName(exercises, log.exercise_id)}</td>
                              <td>{getName(equipment, log.equipment_id)}</td>
                              <td>{log.weight_kg} kg</td>
                              <td>{log.sets}</td>
                              <td>{log.reps}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
