import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

let idCounter = 0
function newId() { return ++idCounter }

export default function RegisterWorkout() {
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState([createRow()])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  function createRow() {
    return { _key: newId(), exercise_id: '', equipment_id: '', weight_kg: '', sets: '', reps: '' }
  }

  useEffect(() => {
    fetchExercises()
    fetchEquipment()
  }, [])

  async function fetchExercises() {
    const { data } = await supabase.from('exercises').select('*').order('name')
    if (data) setExercises(data)
  }

  async function fetchEquipment() {
    const { data } = await supabase.from('equipment').select('*').order('name')
    if (data) setEquipment(data)
  }

  function addRow() {
    setRows(prev => [...prev, createRow()])
  }

  function removeRow(key) {
    setRows(prev => prev.filter(r => r._key !== key))
  }

  function updateRow(key, field, value) {
    setRows(prev => prev.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  function isRowValid(r) {
    return r.exercise_id && r.equipment_id && r.weight_kg && r.sets && r.reps
  }

  async function handleSave() {
    const validRows = rows.filter(isRowValid)
    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'Adicione pelo menos um exercício com todos os campos preenchidos.' })
      return
    }

    setSaving(true)
    setMessage(null)

    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({ date, notes: notes.trim() || null })
      .select()
      .single()

    if (sessionError) {
      setSaving(false)
      setMessage({ type: 'error', text: 'Erro ao criar sessão: ' + sessionError.message })
      return
    }

    const logs = validRows.map((r, i) => ({
      session_id: session.id,
      date,
      exercise_id: r.exercise_id,
      equipment_id: r.equipment_id,
      weight_kg: parseFloat(r.weight_kg),
      sets: parseInt(r.sets),
      reps: parseInt(r.reps),
      order_index: i,
    }))

    const { error: logsError } = await supabase.from('workout_logs').insert(logs)

    setSaving(false)

    if (logsError) {
      setMessage({ type: 'error', text: 'Erro ao salvar exercícios: ' + logsError.message })
    } else {
      setMessage({ type: 'success', text: `Treino salvo! ${logs.length} exercício(s) registrado(s).` })
      setRows([createRow()])
      setNotes('')
    }
  }

  return (
    <div className="card">
      <h2>Registrar Treino</h2>

      <label className="field-label">
        Data
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </label>

      <label className="field-label">
        Anotações (opcional)
        <input type="text" placeholder="Ex: Treino A, Push Day..." value={notes} onChange={e => setNotes(e.target.value)} />
      </label>

      <div className="session-exercises">
        <div className="session-header">
          <h3>Exercícios</h3>
          <button className="btn-add" onClick={addRow}>+ Adicionar Exercício</button>
        </div>

        {rows.map((row, i) => (
          <div key={row._key} className="exercise-row">
            <div className="exercise-row-header">
              <span className="exercise-index">{i + 1}</span>
              {rows.length > 1 && (
                <button className="btn-remove-row" onClick={() => removeRow(row._key)}>✕</button>
              )}
            </div>
            <div className="exercise-row-fields">
              <select value={row.exercise_id} onChange={e => updateRow(row._key, 'exercise_id', e.target.value)}>
                <option value="">Exercício</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>

              <select value={row.equipment_id} onChange={e => updateRow(row._key, 'equipment_id', e.target.value)}>
                <option value="">Equipamento</option>
                {equipment.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>

              <input
                type="number" step="0.5" min="0" placeholder="kg"
                value={row.weight_kg} onChange={e => updateRow(row._key, 'weight_kg', e.target.value)}
              />

              <input
                type="number" min="1" placeholder="séries"
                value={row.sets} onChange={e => updateRow(row._key, 'sets', e.target.value)}
              />

              <input
                type="number" min="1" placeholder="reps"
                value={row.reps} onChange={e => updateRow(row._key, 'reps', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="btn-save" disabled={saving} onClick={handleSave}>
        {saving ? 'Salvando...' : `Salvar Treino (${rows.filter(isRowValid).length} exercícios)`}
      </button>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}
    </div>
  )
}
