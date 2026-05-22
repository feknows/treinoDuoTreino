export const TECHNIQUE_TYPES = [
  { name: 'pump_set', label: 'Pump Set', description: 'Apenas 1 série de 15-25 repetições, com intenção de jogar sangue no músculo.' },
  { name: 'loading_set', label: 'Loading Set', description: 'Duas repetições com cargas diferentes para carregamento.' },
  { name: 'valid_set', label: 'Série Válida', description: '1 única série, ideal 6 repetições.' },
  { name: 'muscle_round', label: 'Muscle Round', description: 'Blocos de 4 repetições. Adicione quantos blocos fizer, com opção de Drop Sets.' },
]

export function getTechnique(name) {
  return TECHNIQUE_TYPES.find(t => t.name === name)
}

export function getTechniqueLabel(name) {
  return getTechnique(name)?.label || name
}

export function renderTechniqueForm(name, data, onChange) {
  switch (name) {
    case 'pump_set':
      return renderPumpSet(data, onChange)
    case 'loading_set':
      return renderLoadingSet(data, onChange)
    case 'valid_set':
      return renderValidSet(data, onChange)
    case 'muscle_round':
      return renderMuscleRound(data, onChange)
    default:
      return null
  }
}

function NumberField({ label, value, onChange, step, min, placeholder, suffix }) {
  return (
    <label className="tech-field">
      {label}
      <div className="tech-input-wrap">
        <input
          type="number"
          step={step ?? 1}
          min={min ?? 0}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
        />
        {suffix && <span className="tech-suffix">{suffix}</span>}
      </div>
    </label>
  )
}

function renderPumpSet(data, onChange) {
  return (
    <div className="tech-form">
      <p className="tech-description">1 série de 15-25 repetições. Marque como concluído ao finalizar.</p>
      <label className="tech-checkbox">
        <input
          type="checkbox"
          checked={data?.completed ?? false}
          onChange={e => onChange({ ...data, completed: e.target.checked })}
        />
        Concluído
      </label>
    </div>
  )
}

function renderLoadingSet(data, onChange) {
  const d = data || {}
  return (
    <div className="tech-form tech-loading-set">
      <p className="tech-description">Duas repetições com cargas diferentes.</p>
      <div className="tech-loading-pair">
        <NumberField label="Carga 1 (kg)" value={d.load_1} onChange={v => onChange({ ...d, load_1: v })} step={0.5} />
        <NumberField label="Reps 1" value={d.reps_1} onChange={v => onChange({ ...d, reps_1: v })} min={1} />
      </div>
      <div className="tech-loading-pair">
        <NumberField label="Carga 2 (kg)" value={d.load_2} onChange={v => onChange({ ...d, load_2: v })} step={0.5} />
        <NumberField label="Reps 2" value={d.reps_2} onChange={v => onChange({ ...d, reps_2: v })} min={1} />
      </div>
    </div>
  )
}

function renderValidSet(data, onChange) {
  const d = data || {}
  return (
    <div className="tech-form">
      <p className="tech-description">1 série. Ideal 6 repetições.</p>
      <div className="tech-loading-pair">
        <NumberField label="Carga (kg)" value={d.load} onChange={v => onChange({ ...d, load: v })} step={0.5} />
        <NumberField label="Repetições" value={d.reps} onChange={v => onChange({ ...d, reps: v })} min={1} />
      </div>
    </div>
  )
}

function renderMuscleRound(data, onChange) {
  const d = data || {}
  const blocks = d.blocks || [{ load: '' }]
  const defaultLoad = d.defaultLoad || ''
  const defaultDropLoad = d.defaultDropLoad || ''

  function updateBlock(i, load) {
    const next = blocks.map((b, j) => j === i ? { ...b, load } : b)
    onChange({ ...d, blocks: next })
  }

  function setDefaultLoad(val) {
    const load = val === '' ? '' : parseFloat(val)
    const next = blocks.map(b => b.drop ? b : { ...b, load })
    onChange({ ...d, defaultLoad: val, blocks: next })
  }

  function setDefaultDropLoad(val) {
    const load = val === '' ? '' : parseFloat(val)
    const next = blocks.map(b => b.drop ? { ...b, load } : b)
    onChange({ ...d, defaultDropLoad: val, blocks: next })
  }

  function addBlock(drop) {
    const load = drop
      ? (defaultDropLoad !== '' ? (typeof defaultDropLoad === 'string' ? parseFloat(defaultDropLoad) : defaultDropLoad) : '')
      : (defaultLoad !== '' ? (typeof defaultLoad === 'string' ? parseFloat(defaultLoad) : defaultLoad) : '')
    onChange({ ...d, blocks: [...blocks, { load, drop }] })
  }

  function removeBlock(i) {
    if (blocks.length <= 1) return
    const next = blocks.filter((_, j) => j !== i)
    onChange({ ...d, blocks: next })
  }

  return (
    <div className="tech-form">
      <p className="tech-description">Blocos de 4 repetições. Adicione quantos blocos fizer.</p>
      <div className="tech-default-loads">
      <div className="tech-default-load">
        <p className="tech-default-load-hint">Preenche automaticamente todos os blocos normais</p>
        <label className="tech-field">
          <span>Carga padrão (kg)</span>
          <div className="tech-input-wrap">
            <input
              type="number" step={0.5} min={0} placeholder="kg"
              value={defaultLoad}
              onChange={e => setDefaultLoad(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
            <span className="tech-suffix">kg</span>
          </div>
        </label>
      </div>
      <div className="tech-default-load tech-drop-load">
        <p className="tech-default-load-hint">Preenche todos os blocos DROP</p>
        <label className="tech-field">
          <span>Carga DROP (kg)</span>
          <div className="tech-input-wrap">
            <input
              type="number" step={0.5} min={0} placeholder="kg"
              value={defaultDropLoad}
              onChange={e => setDefaultDropLoad(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
            <span className="tech-suffix">kg</span>
          </div>
        </label>
      </div>
      </div>
      {blocks.map((block, i) => (
        <div key={i} className={`tech-round-block ${block.drop ? 'tech-drop' : ''}`}>
          <span className="tech-round-label">
            Bloco {i + 1}
            {block.drop && <span className="tech-drop-badge">DROP</span>}
            <span className="tech-round-reps">4 reps</span>
          </span>
          <div className="tech-input-wrap">
            <input
              type="number"
              step={0.5}
              min={0}
              placeholder="kg"
              value={block.load ?? ''}
              onChange={e => updateBlock(i, e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
            <span className="tech-suffix">kg</span>
          </div>
          {blocks.length > 1 && (
            <button className="btn-round-remove" onClick={() => removeBlock(i)}>✕</button>
          )}
        </div>
      ))}
      <div className="tech-round-actions">
        <button className="btn-small-outline" onClick={() => addBlock(false)}>+ Adicionar Bloco</button>
        <button className="btn-small-outline btn-add-drop" onClick={() => addBlock(true)}>+ Adicionar Drop</button>
      </div>
    </div>
  )
}

export function renderTechniqueSummary(name, data) {
  if (!data) return '-'
  switch (name) {
    case 'pump_set':
      return data.completed ? '✔ Concluído' : 'Pendente'
    case 'loading_set':
      return `${data.load_1 ?? '?'}kg x ${data.reps_1 ?? '?'} → ${data.load_2 ?? '?'}kg x ${data.reps_2 ?? '?'}`
    case 'valid_set':
      return `${data.load ?? '?'}kg x ${data.reps ?? '?'} reps`
    case 'muscle_round':
      const blocks = data.blocks || []
      return blocks.map(b => `${b.load ?? '?'}kg`).join(' | ')
    default:
      return '-'
  }
}
