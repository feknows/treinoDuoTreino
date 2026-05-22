import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import TemplateForm from './TemplateForm'

function ItemManager({ title, table, items, setItems, color, showTechnique }) {
  const [newName, setNewName] = useState('')

  async function fetchItems() {
    const { data } = await supabase.from(table).select('*').order('name')
    if (data) setItems(data)
  }

  async function addItem() {
    const name = newName.trim()
    if (!name) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from(table).insert({ name, user_id: user.id })
    if (error) { alert(error.message); return }
    setNewName('')
    fetchItems()
  }

  async function deleteItem(id) {
    if (!window.confirm(`Excluir este ${title.toLowerCase()}?`)) return
    await supabase.from(table).delete().eq('id', id)
    fetchItems()
  }

  return (
    <div className="manage-section" style={{ borderLeftColor: color }}>
      <h3>{title}</h3>
      <div className="add-row">
        <input type="text" placeholder={`Novo ${title.toLowerCase()}...`} value={newName}
          onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} />
        <button onClick={addItem}>Adicionar</button>
      </div>
      {items.length === 0 ? (
        <p className="empty">Nenhum {title.toLowerCase()} cadastrado.</p>
      ) : (
        <ul className="item-list">
          {items.map(item => (
            <li key={item.id}>
              <span>{item.name}</span>
              <button className="btn-delete" onClick={() => deleteItem(item.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TemplateManager({ templates, onEdit, onRefresh }) {
  const [shares, setShares] = useState({})

  useEffect(() => { fetchShares() }, [templates])

  async function fetchShares() {
    if (templates.length === 0) return
    const ids = templates.map(t => t.id)
    const { data } = await supabase.from('template_shares').select('*').in('template_id', ids)
    if (data) {
      const map = {}
      for (const s of data) {
        if (!map[s.template_id]) map[s.template_id] = []
        map[s.template_id].push(s.shared_with_user_id)
      }
      setShares(map)
    }
  }

  async function deleteTemplate(id) {
    if (!window.confirm('Excluir este modelo?')) return
    await supabase.from('workout_templates').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div className="manage-section" style={{ borderLeftColor: '#ff6d00' }}>
      <h3>📋 Modelos de Treino</h3>
      {templates.length === 0 ? (
        <p className="empty">Nenhum modelo criado.</p>
      ) : (
        <ul className="item-list">
          {templates.map(t => (
            <li key={t.id}>
              <span>{t.name}</span>
              <div className="item-actions">
                {shares[t.id]?.length > 0 && <span className="shared-badge">{shares[t.id].length} 👥</span>}
                <button className="btn-edit" onClick={() => onEdit(t)}>✎</button>
                <button className="btn-delete" onClick={() => deleteTemplate(t.id)}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Manage() {
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [templates, setTemplates] = useState([])
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editTemplate, setEditTemplate] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareTemplate, setShareTemplate] = useState('')
  const [shareMsg, setShareMsg] = useState(null)

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const { data } = await supabase.from('workout_templates').select('*').order('name')
    if (data) setTemplates(data)
  }

  async function handleInvite(e) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) { setInviteMsg({ type: 'error', text: 'Digite o email.' }); return }
    setInviting(true); setInviteMsg(null)
    const { error } = await supabase.auth.signUp({ email })
    setInviting(false)
    if (error) setInviteMsg({ type: 'error', text: error.message })
    else { setInviteMsg({ type: 'success', text: `Convite enviado para ${email}!` }); setInviteEmail('') }
  }

  async function handleShare(e) {
    e.preventDefault()
    if (!shareEmail || !shareTemplate) { setShareMsg({ type: 'error', text: 'Preencha todos os campos.' }); return }

    const { error } = await supabase.from('template_shares').insert({
      template_id: shareTemplate,
      shared_with_email: shareEmail.trim(),
    })
    if (error) setShareMsg({ type: 'error', text: error.message })
    else { setShareMsg({ type: 'success', text: 'Modelo compartilhado!' }); setShareEmail('') }
  }

  function handleCreateTemplate() { setEditTemplate(null); setShowTemplateForm(true) }
  function handleEditTemplate(t) { setEditTemplate(t); setShowTemplateForm(true) }
  function handleBackFromForm() { setShowTemplateForm(false); setEditTemplate(null); fetchTemplates() }

  if (showTemplateForm) {
    return <TemplateForm onBack={handleBackFromForm} editTemplate={editTemplate} />
  }

  return (
    <div className="card">
      <h2>Gerenciar</h2>

      <ItemManager title="Exercícios" table="exercises" items={exercises} setItems={setExercises} color="#00e676" />
      <ItemManager title="Equipamentos" table="equipment" items={equipment} setItems={setEquipment} color="#7c4dff" />

      <TemplateManager templates={templates} onEdit={handleEditTemplate} onRefresh={fetchTemplates} />
      <button className="btn-save" style={{ marginBottom: 20 }} onClick={handleCreateTemplate}>
        + Criar Modelo de Treino
      </button>

      <div className="manage-section" style={{ borderLeftColor: '#ff6d00' }}>
        <h3>👤 Convidar Usuário</h3>
        <p className="manage-info">Convide uma pessoa para usar o app.</p>
        <form onSubmit={handleInvite} className="add-row">
          <input type="email" placeholder="Email da pessoa..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <button type="submit" disabled={inviting}>{inviting ? 'Enviando...' : 'Convidar'}</button>
        </form>
        {inviteMsg && <div className={`message ${inviteMsg.type}`}>{inviteMsg.text}</div>}
      </div>

      {templates.length > 0 && (
        <div className="manage-section" style={{ borderLeftColor: '#448aff' }}>
          <h3>🔗 Compartilhar Modelo</h3>
          <p className="manage-info">Compartilhe um modelo de treino com outro usuário.</p>
          <form onSubmit={handleShare} className="add-row share-row">
            <select value={shareTemplate} onChange={e => setShareTemplate(e.target.value)}>
              <option value="">Selecione o modelo</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input type="email" placeholder="Email do usuário..." value={shareEmail} onChange={e => setShareEmail(e.target.value)} />
            <button type="submit">Compartilhar</button>
          </form>
          {shareMsg && <div className={`message ${shareMsg.type}`}>{shareMsg.text}</div>}
        </div>
      )}
    </div>
  )
}
