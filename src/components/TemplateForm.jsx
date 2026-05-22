import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { TECHNIQUE_TYPES, getTechniqueLabel } from '../services/techniqueDefaults'

let idCounter = 0
function newId() { return ++idCounter }

function createExerciseRow(blockType) {
  return {
    _key: newId(),
    exercise_id: '',
    equipment_id: '',
    technique_type: blockType === 'warmup' ? '' : '',
  }
}

export default function TemplateForm({ onBack, editTemplate }) {
  const [name, setName] = useState(editTemplate?.name || '')
  const [warmupExercises, setWarmupExercises] = useState([])
  const [mainExercises, setMainExercises] = useState([])
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchCatalog()
    if (editTemplate) loadTemplate()
  }, [])

  async function fetchCatalog() {
    const [exRes, eqRes] = await Promise.all([
      supabase.from('exercises').select('*').order('name'),
      supabase.from('equipment').select('*').order('name'),
    ])
    if (exRes.data) setExercises(exRes.data)
    if (eqRes.data) setEquipment(eqRes.data)
  }

  async function loadTemplate() {
    const { data } = await supabase
      .from('template_exercises')
      .select('*')
      .eq('template_id', editTemplate.id)
      .order('order_index')

    if (!data) return
    const warm = data.filter(e => e.block_type === 'warmup').map(e => ({
      _key: newId(), exercise_id: e.exercise_id, equipment_id: e.equipment_id || '',
      technique_type: e.technique_type || '',
      _savedId: e.id,
    }))
    const main = data.filter(e => e.block_type === 'main').map(e => ({
      _key: newId(), exercise_id: e.exercise_id, equipment_id: e.equipment_id || '',
      technique_type: e.technique_type || '',
      _savedId: e.id,
    }))
    setWarmupExercises(warm.length ? warm : [createExerciseRow('warmup')])
    setMainExercises(main.length ? main : [createExerciseRow('main')])
  }

  function addWarmup() { setWarmupExercises(p => [...p, createExerciseRow('warmup')]) }
  function addMain() { setMainExercises(p => [...p, createExerciseRow('main')]) }

  function removeWarmup(key) { setWarmupExercises(p => p.filter(r => r._key !== key)) }
  function removeMain(key) { setMainExercises(p => p.filter(r => r._key !== key)) }

  function updateWarmup(key, field, value) {
    setWarmupExercises(p => p.map(r => r._key === key ? { ...r, [field]: value } : r))
  }
  function updateMain(key, field, value) {
    setMainExercises(p => p.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  function isValid() {
    if (!name.trim()) return false
    const allMainOk = mainExercises.some(r => r.exercise_id)
    if (!allMainOk) return false
    return true
  }

  async function handleSave() {
    if (!isValid()) {
      setMessage({ type: 'error', text: 'Defina um nome e pelo menos 1 exercício principal.' })
      return
    }
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: template, error: tmplErr } = await supabase
      .from('workout_templates')
      .upsert({ id: editTemplate?.id || undefined, name: name.trim(), user_id: user.id })
      .select()
      .single()

    if (tmplErr) { setSaving(false); setMessage({ type: 'error', text: tmplErr.message }); return }

    const allExercises = [
      ...warmupExercises.map((r, i) => ({ ...r, block_type: 'warmup', order_index: i })),
      ...mainExercises.map((r, i) => ({ ...r, block_type: 'main', order_index: warmupExercises.length + i })),
    ]

    const toSave = allExercises
      .filter(r => r.exercise_id)
      .map(r => ({
        template_id: template.id,
        exercise_id: r.exercise_id,
        equipment_id: r.equipment_id || null,
        technique_type: r.block_type === 'warmup' ? null : (r.technique_type || null),
        technique_config: {},
        block_type: r.block_type,
        order_index: r.order_index,
        user_id: user.id,
      }))

    if (editTemplate) {
      await supabase.from('template_exercises').delete().eq('template_id', editTemplate.id)
    }

    const { error: insErr } = await supabase.from('template_exercises').insert(toSave)
    setSaving(false)
    if (insErr) { setMessage({ type: 'error', text: insErr.message }) }
    else { onBack() }
  }

  return (
    <div className="card">
      <div className="profile-header">
        <button className="btn-back" onClick={onBack}>← Voltar</button>
        <h2>{editTemplate ? 'Editar' : 'Criar'} Modelo de Treino</h2>
      </div>

      <label className="field-label">
        Nome do Modelo
        <input type="text" placeholder="Ex: Treino A - Superior" value={name} onChange={e => setName(e.target.value)} />
      </label>

      <div className="tmpl-block">
        <h3 className="tmpl-block-title">🔥 Aquecimento</h3>
        {warmupExercises.map((row, i) => (
          <div key={row._key} className="tmpl-row">
            <span className="tmpl-idx">{i + 1}</span>
            <select value={row.exercise_id} onChange={e => updateWarmup(row._key, 'exercise_id', e.target.value)}>
              <option value="">Exercício</option>
              {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <select value={row.equipment_id} onChange={e => updateWarmup(row._key, 'equipment_id', e.target.value)}>
              <option value="">Equipamento</option>
              {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
            {warmupExercises.length > 1 && (
              <button className="btn-remove-row" onClick={() => removeWarmup(row._key)}>✕</button>
            )}
          </div>
        ))}
        <button className="btn-add-row" onClick={addWarmup}>+ Adicionar Exercício</button>
      </div>

      <div className="tmpl-block">
        <h3 className="tmpl-block-title">💪 Parte Principal</h3>
        {mainExercises.map((row, i) => (
          <div key={row._key} className="tmpl-row">
            <span className="tmpl-idx">{i + 1}</span>
            <select value={row.exercise_id} onChange={e => updateMain(row._key, 'exercise_id', e.target.value)}>
              <option value="">Exercício</option>
              {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
            <select value={row.equipment_id} onChange={e => updateMain(row._key, 'equipment_id', e.target.value)}>
              <option value="">Equipamento</option>
              {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
            <select value={row.technique_type} onChange={e => updateMain(row._key, 'technique_type', e.target.value)}>
              <option value="">Técnica</option>
              {TECHNIQUE_TYPES.map(t => <option key={t.name} value={t.name}>{t.label}</option>)}
            </select>
            {mainExercises.length > 1 && (
              <button className="btn-remove-row" onClick={() => removeMain(row._key)}>✕</button>
            )}
          </div>
        ))}
        <button className="btn-add-row" onClick={addMain}>+ Adicionar Exercício</button>
      </div>

      <button className="btn-save" disabled={saving || !isValid()} onClick={handleSave}>
        {saving ? 'Salvando...' : 'Salvar Modelo'}
      </button>
      {message && <div className={`message ${message.type}`}>{message.text}</div>}
    </div>
  )
}
