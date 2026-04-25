import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const token     = searchParams.get('token')
    const userParam = searchParams.get('user')
    const error     = searchParams.get('error')

    if (error) { navigate(`/login?error=${error}`); return }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        loginWithToken(token, user)
        navigate('/dashboard')
      } catch {
        navigate('/login?error=callback_failed')
      }
    } else {
      navigate('/login?error=missing_token')
    }
  }, [searchParams, navigate, loginWithToken])

  // Brief loading screen — dark background matching CommuteSmart theme
  return (
    <div style={{
      minHeight: '100vh', background: '#0a1411',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column' as const, gap: '12px',
    }}>
      <div style={{ fontSize: '32px' }}>🚌</div>
      <div style={{ color: '#fff', fontSize: '15px' }}>Signing you in...</div>
    </div>
  )
}

export default AuthCallback
