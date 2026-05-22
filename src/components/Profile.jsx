import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

export default function Profile({ user, onBack }) {
  const [tab, setTab] = useState('info')

  return (
    <div className="card">
      <div className="profile-header">
        <button className="btn-back" onClick={onBack}>← Voltar</button>
        <h2>Configurações da Conta</h2>
      </div>

      <div className="profile-tabs">
        <button className={`profile-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
          Informações
        </button>
        <button className={`profile-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
          Alterar Senha
        </button>
        <button className={`profile-tab ${tab === 'email' ? 'active' : ''}`} onClick={() => setTab('email')}>
          Alterar Email
        </button>
      </div>

      {tab === 'info' && <ProfileInfo user={user} />}
      {tab === 'password' && <ChangePassword />}
      {tab === 'email' && <ChangeEmail user={user} />}
    </div>
  )
}

function ProfileInfo({ user }) {
  return (
    <div className="profile-section">
      <div className="profile-avatar-large">
        {user.email?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="profile-field">
        <span className="profile-field-label">Email</span>
        <span className="profile-field-value">{user.email}</span>
      </div>
      <div className="profile-field">
        <span className="profile-field-label">Membro desde</span>
        <span className="profile-field-value">
          {new Date(user.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
      <div className="profile-field">
        <span className="profile-field-label">Último login</span>
        <span className="profile-field-value">
          {user.last_sign_in_at
            ? new Date(user.last_sign_in_at).toLocaleString('pt-BR')
            : '-'}
        </span>
      </div>
    </div>
  )
}

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Preencha todos os campos.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Nova senha e confirmação não conferem.' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mínimo de 6 caracteres.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user.email,
      password: currentPassword,
    })

    if (signInError) {
      setLoading(false)
      setMessage({ type: 'error', text: 'Senha atual incorreta.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <form className="profile-section" onSubmit={handleSubmit}>
      <label>
        Senha Atual
        <input type="password" placeholder="Sua senha atual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
      </label>
      <label>
        Nova Senha
        <input type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      </label>
      <label>
        Confirmar Nova Senha
        <input type="password" placeholder="Repita a nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Alterando...' : 'Alterar Senha'}
      </button>
      {message && <div className={`message ${message.type}`}>{message.text}</div>}
    </form>
  )
}

function ChangeEmail({ user }) {
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newEmail || !password) {
      setMessage({ type: 'error', text: 'Preencha todos os campos.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (signInError) {
      setLoading(false)
      setMessage({ type: 'error', text: 'Senha incorreta.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: `Email de confirmação enviado para ${newEmail}. Verifique sua caixa de entrada.`,
      })
      setNewEmail('')
      setPassword('')
    }
  }

  return (
    <form className="profile-section" onSubmit={handleSubmit}>
      <label>
        Email Atual
        <input type="email" value={user.email} disabled />
      </label>
      <label>
        Novo Email
        <input type="email" placeholder="Novo email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
      </label>
      <label>
        Confirme sua Senha
        <input type="password" placeholder="Sua senha atual" value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Alterando...' : 'Alterar Email'}
      </button>
      <p className="profile-note">
        Um email de confirmação será enviado para o novo endereço.
      </p>
      {message && <div className={`message ${message.type}`}>{message.text}</div>}
    </form>
  )
}
