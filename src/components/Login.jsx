import { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/Login.css'

export default function Login({ onSkip }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      alert('Check your email for the confirmation link!')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>UCUP MENJELAJAH NUSANTARA</h1>
        <div className="game-subtitle">🏝️ Petualangan di Nusantara 🏝️</div>
        <p className="login-subtitle">Masuk untuk menyimpan progres dan tampil di papan peringkat</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Kata Sandi</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? 'Memuat...' : 'Masuk'}
            </button>
            <button type="button" onClick={handleSignUp} disabled={loading}>
              {loading ? 'Memuat...' : 'Daftar'}
            </button>
          </div>
        </form>
        <div className="skip-section">
          <button type="button" onClick={onSkip} className="skip-button">
            Lanjutkan sebagai Tamu
          </button>
        </div>
      </div>
    </div>
  )
} 