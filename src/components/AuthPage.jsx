import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [recoveryToken, setRecoveryToken] = useState(null)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken) {
        setRecoveryToken({ access_token: accessToken, refresh_token: refreshToken })
        setMode('updatePassword')
        window.location.hash = ''
      }
    }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Preencha email e senha.' })
      return
    }
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage({ type: 'error', text: error.message })
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email) {
      setMessage({ type: 'error', text: 'Digite seu email.' })
      return
    }
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://feknows.github.io/treinoDuoTreino/',
    })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Email de recuperação enviado! Verifique sua caixa de entrada.' })
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    if (!password) {
      setMessage({ type: 'error', text: 'Digite a nova senha.' })
      return
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Senha deve ter no mínimo 6 caracteres.' })
      return
    }

    if (recoveryToken) {
      await supabase.auth.setSession({
        access_token: recoveryToken.access_token,
        refresh_token: recoveryToken.refresh_token,
      })
    }

    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' })
      setTimeout(() => setMode('login'), 2000)
    }
  }

  function switchMode(newMode) {
    setMode(newMode)
    setMessage(null)
    setPassword('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💪 TreinoDuoTreino</h1>
          <p className="subtitle">Controle sua evolução na academia</p>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <h2>Entrar</h2>
            <label>
              Email
              <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label>
              Senha
              <input type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <div className="auth-links">
              <button type="button" className="link-btn" onClick={() => switchMode('forgot')}>
                Esqueceu a senha?
              </button>
            </div>
            {message && <div className={`message ${message.type}`}>{message.text}</div>}
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <h2>Recuperar Senha</h2>
            <p className="auth-description">Digite seu email para receber o link de recuperação.</p>
            <label>
              Email
              <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Link'}
            </button>
            <div className="auth-links">
              <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                Voltar ao login
              </button>
            </div>
            {message && <div className={`message ${message.type}`}>{message.text}</div>}
          </form>
        )}

        {mode === 'updatePassword' && (
          <form onSubmit={handleUpdatePassword}>
            <h2>Nova Senha</h2>
            <label>
              Nova Senha
              <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
            {message && <div className={`message ${message.type}`}>{message.text}</div>}
          </form>
        )}
      </div>
    </div>
  )
}
