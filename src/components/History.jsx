import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export default function History() {
  const [logs, setLogs] = useState([])
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [dateFilter, setDateFilter] = useState('')
  const [exerciseFilter, setExerciseFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExercises()
    fetchEquipment()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [dateFilter, exerciseFilter])

  async function fetchExercises() {
    const { data } = await supabase.from('exercises').select('*').order('name')
    if (data) setExercises(data)
  }

  async function fetchEquipment() {
    const { data } = await supabase.from('equipment').select('*').order('name')
    if (data) setEquipment(data)
  }

  function getExerciseName(id) {
    return exercises.find(e => e.id === id)?.name || id
  }

  function getEquipmentName(id) {
    return equipment.find(e => e.id === id)?.name || id
  }

  async function fetchLogs() {
    setLoading(true)
    let query = supabase
      .from('workout_logs')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (dateFilter) {
      query = query.eq('date', dateFilter)
    }
    if (exerciseFilter) {
      query = query.eq('exercise_id', exerciseFilter)
    }

    const { data } = await query
    if (data) setLogs(data)
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este registro?')) return
    const { error } = await supabase.from('workout_logs').delete().eq('id', id)
    if (!error) fetchLogs()
  }

  return (
    <div className="card">
      <h2>Histórico</h2>

      <div className="filters">
        <label>
          Data
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </label>
        <label>
          Exercício
          <select value={exerciseFilter} onChange={e => setExerciseFilter(e.target.value)}>
            <option value="">Todos</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="loading">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="empty">Nenhum registro encontrado.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Exercício</th>
                <th>Equipamento</th>
                <th>Carga (kg)</th>
                <th>Séries</th>
                <th>Reps</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>{getExerciseName(log.exercise_id)}</td>
                  <td>{getEquipmentName(log.equipment_id)}</td>
                  <td>{log.weight_kg}</td>
                  <td>{log.sets}</td>
                  <td>{log.reps}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(log.id)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
