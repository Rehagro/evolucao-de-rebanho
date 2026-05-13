import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, type Profile } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (novaSenha: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      handleSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      handleSession(session)
    })

    async function handleSession(session: Session | null) {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .maybeSingle()
        if (mounted) setProfile(data ?? null)
      } else {
        setProfile(null)
      }
      if (mounted) setLoading(false)
    }

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const redirectTo = `${window.location.origin}/redefinir-senha`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { error: error as Error | null }
  }

  const updatePassword = async (novaSenha: string) => {
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>')
  return ctx
}
