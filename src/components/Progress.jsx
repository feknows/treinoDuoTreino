import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function estimate1RM(weight, reps) {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export default function Progress() {
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [exerciseId, setExerciseId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [dataType, setDataType] = useState('1rm')
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    fetchExercises()
    fetchEquipment()
  }, [])

  useEffect(() => {
    if (exerciseId) fetchData()
  }, [exerciseId, equipmentId, dataType])

  async function fetchExercises() {
    const { data } = await supabase.from('exercises').select('*').order('name')
    if (data) setExercises(data)
  }

  async function fetchEquipment() {
    const { data } = await supabase.from('equipment').select('*').order('name')
    if (data) setEquipment(data)
  }

  async function fetchData() {
    let query = supabase
      .from('workout_logs')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('date', { ascending: true })

    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId)
    }

    const { data } = await query
    if (!data || data.length === 0) {
      setChartData(null)
      return
    }

    const grouped = {}
    for (const row of data) {
      if (!grouped[row.date]) {
        grouped[row.date] = []
      }
      grouped[row.date].push(row)
    }

    const dates = Object.keys(grouped).sort()
    const values = dates.map(date => {
      const entries = grouped[date]
      if (dataType === '1rm') {
        return Math.max(...entries.map(e => estimate1RM(e.weight_kg, e.reps)))
      }
      if (dataType === 'volume') {
        return entries.reduce((sum, e) => sum + e.weight_kg * e.sets * e.reps, 0)
      }
      return Math.max(...entries.map(e => e.weight_kg))
    })

    setChartData({
      labels: dates,
      datasets: [
        {
          label: dataType === '1rm' ? '1RM Estimado (kg)' : dataType === 'volume' ? 'Volume Total (kg)' : 'Carga Máxima (kg)',
          data: values,
          borderColor: '#00e676',
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
      ],
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.parsed.y.toFixed(1)} kg`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  }

  return (
    <div className="card">
      <h2>Progresso</h2>

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

        <label>
          Equipamento (opcional)
          <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)}>
            <option value="">Todos</option>
            {equipment.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </label>

        <label>
          Métrica
          <select value={dataType} onChange={e => setDataType(e.target.value)}>
            <option value="1rm">1RM Estimado</option>
            <option value="max">Carga Máxima</option>
            <option value="volume">Volume Total</option>
          </select>
        </label>
      </div>

      {!exerciseId ? (
        <p className="empty">Selecione um exercício para ver o gráfico.</p>
      ) : !chartData ? (
        <p className="empty">Nenhum dado encontrado para este exercício.</p>
      ) : (
        <div className="chart-wrapper">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  )
}
