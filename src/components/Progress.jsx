import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function estimate1RM(weight, reps) {
  if (!weight || !reps) return null
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export default function Progress() {
  const [exercises, setExercises] = useState([])
  const [exerciseId, setExerciseId] = useState('')
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    supabase.from('exercises').select('*').order('name').then(({ data }) => {
      if (data) setExercises(data)
    })
  }, [])

  useEffect(() => {
    if (exerciseId) fetchData()
  }, [exerciseId])

  async function fetchData() {
    const { data } = await supabase
      .from('session_exercises')
      .select('*, workout_sessions!inner(date)')
      .eq('exercise_id', exerciseId)
      .eq('technique_type', 'valid_set')
      .eq('completed', true)
      .order('workout_sessions(date)', { ascending: true })

    if (!data || data.length === 0) {
      setChartData(null)
      return
    }

    const dates = data.map(d => d.workout_sessions?.date || d.created_at?.split('T')[0])
    const loads = data.map(d => parseFloat(d.technique_data?.load) || 0)
    const reps = data.map(d => parseInt(d.technique_data?.reps) || 0)
    const oneRMs = data.map(d => estimate1RM(parseFloat(d.technique_data?.load), parseInt(d.technique_data?.reps)))

    setChartData({
      labels: dates,
      datasets: [
        {
          label: 'Carga (kg)',
          data: loads,
          borderColor: '#00e676',
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
        },
        ...(oneRMs.some(v => v !== null) ? [{
          label: '1RM Estimado',
          data: oneRMs,
          borderColor: '#7c4dff',
          backgroundColor: 'rgba(124, 77, 255, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          borderDash: [5, 5],
        }] : []),
      ],
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#aaa' } },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  }

  return (
    <div className="card">
      <h2>Progresso (Série Válida)</h2>

      <div className="filters">
        <label>
          Exercício
          <select value={exerciseId} onChange={e => setExerciseId(e.target.value)}>
            <option value="">Selecione...</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </label>
      </div>

      {!exerciseId ? (
        <p className="empty">Selecione um exercício para ver a evolução.</p>
      ) : !chartData ? (
        <p className="empty">Nenhuma Série Válida concluída para este exercício.</p>
      ) : (
        <div className="chart-wrapper">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  )
}
