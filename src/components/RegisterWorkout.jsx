import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export default function RegisterWorkout() {
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [exerciseId, setExerciseId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!exerciseId || !equipmentId || !weightKg || !sets || !reps) {
      setMessage({ type: 'error', text: 'Preencha todos os campos.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await supabase.from('workout_logs').insert({
      date,
      exercise_id: exerciseId,
      equipment_id: equipmentId,
      weight_kg: parseFloat(weightKg),
      sets: parseInt(sets),
      reps: parseInt(reps),
    })

    setLoading(false)

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Treino registrado com sucesso!' })
      setWeightKg('')
      setSets('')
      setReps('')
    }
  }

  return (
    <div className="card">
      <h2>Registrar Treino</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Data
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>

        <label>
          Exercício
          <select value={exerciseId} onChange={e => setExerciseId(e.target.value)}>
            <option value="">Selecione...</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </label>

        <label>
          Equipamento
          <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)}>
            <option value="">Selecione...</option>
            {equipment.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </label>

        <label>
          Carga (kg)
          <input type="number" step="0.5" min="0" placeholder="Ex: 50" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
        </label>

        <label>
          Séries
          <input type="number" min="1" placeholder="Ex: 4" value={sets} onChange={e => setSets(e.target.value)} />
        </label>

        <label>
          Repetições
          <input type="number" min="1" placeholder="Ex: 10" value={reps} onChange={e => setReps(e.target.value)} />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Treino'}
        </button>

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
      </form>
    </div>
  )
}
