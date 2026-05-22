import { useState, useEffect, Component } from 'react'
import { supabase } from '../services/supabaseClient'
import { renderTechniqueForm, renderTechniqueSummary, getTechniqueLabel } from '../services/techniqueDefaults'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ borderLeft: '3px solid var(--danger)', padding: '16px' }}>
          <h3 style={{ color: 'var(--danger)' }}>Erro ao carregar treino</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 8, whiteSpace: 'pre-wrap' }}>
            {this.state.error.message || String(this.state.error)}
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 8 }}>
            Verifique o console do navegador (F12) para mais detalhes.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

export default function WorkoutSession() {
  return (
    <ErrorBoundary>
      <WorkoutSessionInner />
    </ErrorBoundary>
  )
}

function WorkoutSessionInner() {
  const [session, setSession] = useState(null)
  const [exercises, setExercises] = useState([])
  const [activeIdx, setActiveIdx] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadToday()
    loadTemplates()
  }, [])

  async function loadToday() {
    setLoading(true)
    try {
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('date', today)
        .limit(1)

      if (error) {
        setMessage({ type: 'error', text: `Erro ao carregar: ${error.message}` })
        setLoading(false)
        return
      }

      if (sessions && sessions.length > 0 && !sessions[0].completed) {
        setSession(sessions[0])
        await loadExercises(sessions[0].id)
      } else if (sessions && sessions.length > 0 && sessions[0].completed) {
        setSession(sessions[0])
        await loadExercises(sessions[0].id)
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Erro inesperado: ${err.message}` })
    }
    setLoading(false)
  }

  async function loadExercises(sessionId) {
    const { data, error } = await supabase
      .from('session_exercises')
      .select('*, exercise:exercise_id(name), equipment:equipment_id(name)')
      .eq('session_id', sessionId)
      .order('order_index')

    if (error) {
      setMessage({ type: 'error', text: `Erro ao carregar exercícios: ${error.message}` })
      return
    }

    if (data) {
      setExercises(data)
      if (data.length === 0) {
        setActiveIdx(null)
      } else {
        const firstIncomplete = data.findIndex(e => !e.completed)
        setActiveIdx(firstIncomplete >= 0 ? firstIncomplete : 0)
      }
    }
  }

  async function loadTemplates() {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .order('name')

    if (error) {
      setMessage({ type: 'error', text: `Erro ao carregar modelos: ${error.message}` })
      return
    }
    setTemplates(data || [])
  }

  async function startFromTemplate(templateId) {
    const { data, error } = await supabase.rpc('start_session_from_template', {
      p_template_id: templateId,
      p_date: today,
    })

    if (error) {
      if (error.message.includes('duplicate key')) {
        setMessage({ type: 'error', text: 'Você já iniciou um treino hoje.' })
      } else {
        setMessage({ type: 'error', text: error.message })
      }
      return
    }

    setMessage(null)
    const { data: newSession } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', data)
      .single()

    setSession(newSession)
    await loadExercises(data)
  }

  async function startEmpty() {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ date: today, notes: '' })
      .select()
      .single()

    if (error) {
      if (error.message.includes('duplicate key')) {
        setMessage({ type: 'error', text: 'Você já iniciou um treino hoje.' })
      } else {
        setMessage({ type: 'error', text: error.message })
      }
      return
    }

    setMessage(null)
    setSession(data)
    setExercises([])
    setActiveIdx(null)
  }

  async function updateExercise(idx, techniqueData) {
    const exercise = exercises[idx]
    const { error } = await supabase
      .from('session_exercises')
      .update({ technique_data: techniqueData, completed: true })
      .eq('id', exercise.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setMessage(null)
    const next = [...exercises]
    next[idx] = { ...next[idx], technique_data: techniqueData, completed: true }
    setExercises(next)

    const allDone = next.every(e => e.completed)
    if (allDone) {
      await supabase.from('workout_sessions').update({ completed: true }).eq('id', session.id)
      setSession(p => ({ ...p, completed: true }))
      return
    }

    const nextIdx = next.findIndex((e, i) => !e.completed && i > idx)
    setActiveIdx(nextIdx >= 0 ? nextIdx : null)
  }

  async function completeWarmup(idx) {
    const exercise = exercises[idx]
    const { error } = await supabase
      .from('session_exercises')
      .update({ warmup_data: {}, completed: true })
      .eq('id', exercise.id)

    if (!error) {
      const next = [...exercises]
      next[idx] = { ...next[idx], warmup_data: {}, completed: true }
      setExercises(next)
      const allDone = next.every(e => e.completed)
      if (allDone) {
        await supabase.from('workout_sessions').update({ completed: true }).eq('id', session.id)
        setSession(p => ({ ...p, completed: true }))
        return
      }
      const nextIdx = next.findIndex((e, i) => !e.completed && i > idx)
      setActiveIdx(nextIdx >= 0 ? nextIdx : null)
    }
  }

  async function addAvulsoExercise() {
    const { data: exData } = await supabase.from('exercises').select('*').order('name')
    if (!exData || exData.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    const order = exercises.length

    const { error } = await supabase
      .from('session_exercises')
      .insert({
        session_id: session.id,
        exercise_id: exData[0].id,
        technique_type: 'valid_set',
        block_type: 'main',
        order_index: order,
        user_id: user.id,
      })

    if (!error) {
      await loadExercises(session.id)
      setActiveIdx(order)
    }
  }

  async function finishSession() {
    await supabase.from('workout_sessions').update({ completed: true }).eq('id', session.id)
    setSession(p => ({ ...p, completed: true }))
  }

  if (loading) return <div className="card"><p className="loading">Carregando...</p></div>

  if (!session) {
    return (
      <div className="card">
        <h2>Treino de Hoje</h2>
        <p className="manage-info">Inicie o treino de hoje selecionando um modelo ou criando um avulso.</p>

        <StartSessionPanel
          onStartFromTemplate={startFromTemplate}
          onStartEmpty={startEmpty}
          templates={templates}
        />

        {message && <div className={`message ${message.type}`}>{message.text}</div>}
      </div>
    )
  }

  if (session.completed) {
    return (
      <div className="card">
        <button className="btn-save" style={{ marginBottom: 16 }} onClick={() => { setSession(null); setExercises([]); setActiveIdx(null) }}>
          🆕 Novo Treino
        </button>
        <div className="session-complete-header">
          <span className="session-complete-icon">✅</span>
          <h2>Treino Finalizado!</h2>
        </div>
        <p className="manage-info">{session.date} — {exercises.filter(e => e.completed).length}/{exercises.length} exercícios concluídos</p>

        <ExerciseListView
          exercises={exercises}
          activeIdx={null}
          onCompleteWarmup={null}
          onUpdateExercise={null}
          readOnly
        />
      </div>
    )
  }

  return (
    <div className="card">
      <h2>🏋️ Treino de Hoje</h2>
      <p className="manage-info">
        {session.date}
        {exercises.filter(e => e.completed).length}/{exercises.length} concluídos
      </p>

      {activeIdx !== null ? (
        <ExerciseForm
          exercise={exercises[activeIdx]}
          index={activeIdx}
          total={exercises.length}
          onComplete={updateExercise}
          onCompleteWarmup={completeWarmup}
          onBack={() => setActiveIdx(null)}
        />
      ) : (
        <>
          <ExerciseListView
            exercises={exercises}
            activeIdx={activeIdx}
            onCompleteWarmup={completeWarmup}
            onUpdateExercise={updateExercise}
            onSelect={setActiveIdx}
          />

          <button className="btn-small-outline" style={{ marginTop: 8 }} onClick={addAvulsoExercise}>
            + Adicionar Exercício
          </button>

          {message && <div className={`message ${message.type}`}>{message.text}</div>}
        </>
      )}
    </div>
  )
}

function StartSessionPanel({ onStartFromTemplate, onStartEmpty, templates }) {
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    if (!selected) return
    setLoading(true)
    onStartFromTemplate(selected)
  }

  return (
    <div className="start-session">
      <div className="start-field">
        <label className="field-label">Escolher Modelo</label>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Selecione um modelo...</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button style={{ marginTop: 8 }} disabled={!selected || loading} onClick={handleStart}>
          {loading ? 'Iniciando...' : 'Iniciar Treino'}
        </button>
      </div>

      <div className="start-divider">ou</div>

      <button className="btn-small-outline" onClick={onStartEmpty}>
        🆕 Começar Avulso (sem modelo)
      </button>
    </div>
  )
}

function ExerciseForm({ exercise, index, total, onComplete, onCompleteWarmup, onBack }) {
  const [data, setData] = useState(exercise.technique_data || {})
  const isWarmup = exercise.block_type === 'warmup' && !exercise.technique_type

  function handleComplete() {
    if (isWarmup) {
      onCompleteWarmup(index)
    } else {
      onComplete(index, data)
    }
  }

  return (
    <div className="ex-form">
      <div className="ex-form-header">
        <span className="ex-form-num">{index + 1}/{total}</span>
        <h3>{exercise.exercise?.name || 'Exercício'}</h3>
        <button className="btn-back-small" onClick={onBack}>←</button>
      </div>

      {exercise.equipment_id && (
        <p className="ex-form-equip">{exercise.equipment?.name || 'Equipamento'}</p>
      )}

      {!isWarmup && exercise.technique_type && (
        <div className="ex-form-tech">
          <span className="tech-badge">{getTechniqueLabel(exercise.technique_type)}</span>
        </div>
      )}

      {isWarmup ? (
        <div className="tech-form">
          <p className="tech-description">Realize o aquecimento e marque como concluído.</p>
          <button className="btn-save" style={{ marginTop: 12 }} onClick={handleComplete}>
            Concluir
          </button>
        </div>
      ) : exercise.technique_type ? (
        renderTechniqueForm(exercise.technique_type, data, setData)
      ) : null}

      {!isWarmup && exercise.technique_type && (
        <button className="btn-save" style={{ marginTop: 12 }} onClick={handleComplete}>
          {index === total - 1 ? '✅ Concluir Treino' : 'Próximo →'}
        </button>
      )}
    </div>
  )
}

function ExerciseListView({ exercises, activeIdx, onCompleteWarmup, onUpdateExercise, onSelect, readOnly }) {
  const warmup = exercises.filter(e => e.block_type === 'warmup')
  const main = exercises.filter(e => e.block_type === 'main')

  function renderGroup(items, label, icon) {
    if (items.length === 0) return null
    return (
      <div className="ex-list-group">
        <h4 className="ex-list-group-title">{icon} {label}</h4>
        {items.map((ex, i) => (
          <div
            key={ex.id}
            className={`ex-list-item ${ex.completed ? 'done' : ''} ${activeIdx === exercises.indexOf(ex) ? 'active' : ''}`}
            onClick={() => {
              if (ex.completed && readOnly) return
              if (!readOnly) onSelect?.(exercises.indexOf(ex))
            }}
          >
            <div className="ex-list-item-info">
              <span className="ex-list-item-name">{ex.exercise?.name || 'Exercício'}</span>
              {ex.technique_type && (
                <span className="ex-list-item-tech">{getTechniqueLabel(ex.technique_type)}</span>
              )}
              {ex.block_type === 'warmup' && !ex.technique_type && (
                <span className="ex-list-item-tech">🔥 Aquecimento</span>
              )}
            </div>
            <div className="ex-list-item-data">
              {renderTechniqueSummary(ex.technique_type, ex.technique_data)}
            </div>
            {ex.completed && <span className="ex-list-item-check">✔</span>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="ex-list">
      {renderGroup(warmup, 'Aquecimento', '🔥')}
      {renderGroup(main, 'Parte Principal', '💪')}
    </div>
  )
}
