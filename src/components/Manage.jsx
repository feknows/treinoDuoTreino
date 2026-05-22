import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

function ItemManager({ title, table, items, setItems, color }) {
  const [newName, setNewName] = useState('')

  async function fetchItems() {
    const { data } = await supabase.from(table).select('*').order('name')
    if (data) setItems(data)
  }

  async function addItem() {
    const name = newName.trim()
    if (!name) return

    const { error } = await supabase.from(table).insert({ name })
    if (error) {
      alert(error.message)
      return
    }
    setNewName('')
    fetchItems()
  }

  async function deleteItem(id) {
    if (!window.confirm(`Excluir este ${title.toLowerCase()}?`)) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error) fetchItems()
  }

  return (
    <div className="manage-section" style={{ borderLeftColor: color }}>
      <h3>{title}</h3>
      <div className="add-row">
        <input
          type="text"
          placeholder={`Novo ${title.toLowerCase()}...`}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
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

export default function Manage() {
  const [exercises, setExercises] = useState([])
  const [equipment, setEquipment] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState(null)

  async function handleInvite(e) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) {
      setInviteMsg({ type: 'error', text: 'Digite o email da pessoa.' })
      return
    }
    setInviting(true)
    setInviteMsg(null)
    const { error } = await supabase.auth.signUp({ email })
    setInviting(false)
    if (error) {
      setInviteMsg({ type: 'error', text: error.message })
    } else {
      setInviteMsg({ type: 'success', text: `Convite enviado para ${email}!` })
      setInviteEmail('')
    }
  }

  return (
    <div className="card">
      <h2>Gerenciar Catálogo</h2>
      <p className="manage-info">
        Cadastre aqui os exercícios e equipamentos que você usa nos treinos.
      </p>

      <ItemManager
        title="Exercícios"
        table="exercises"
        items={exercises}
        setItems={setExercises}
        color="#00e676"
      />

      <ItemManager
        title="Equipamentos"
        table="equipment"
        items={equipment}
        setItems={setEquipment}
        color="#7c4dff"
      />

      <div className="manage-section invite-section" style={{ borderLeftColor: '#ff6d00' }}>
        <h3>👤 Convidar Usuário</h3>
        <p className="manage-info">Convide uma pessoa para usar o app. Ela receberá um email para criar a senha.</p>
        <form onSubmit={handleInvite} className="add-row">
          <input
            type="email"
            placeholder="Email da pessoa..."
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
          />
          <button type="submit" disabled={inviting}>
            {inviting ? 'Enviando...' : 'Convidar'}
          </button>
        </form>
        {inviteMsg && <div className={`message ${inviteMsg.type}`}>{inviteMsg.text}</div>}
      </div>
    </div>
  )
}
