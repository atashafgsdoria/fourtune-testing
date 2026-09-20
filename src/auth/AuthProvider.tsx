import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react'

import type {
    Session,
    User,
} from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'

export type UserRole = 'Patient' | 'Worker'

export type UserProfile = {
  role: UserRole
  patient_id: string | null
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    displayName: string,
    nameParts: {
      firstName: string
      middleName: string
      lastName: string
    }
  ) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function loadUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('role, patient_id')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return data as UserProfile
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)
      setProfileLoading(true)
      if (session?.user) {
        try {
          setProfile(await loadUserProfile(session.user.id))
        } catch (error) {
          console.error('Failed to load user profile:', error)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setProfileLoading(false)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setProfileLoading(true)

        if (session?.user) {
          loadUserProfile(session.user.id)
            .then(setProfile)
            .catch((error) => {
              console.error('Failed to load user profile:', error)
              setProfile(null)
            })
            .finally(() => setProfileLoading(false))
        } else {
          setProfile(null)
          setProfileLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      throw error
    }
  }

  async function signUp(
    email: string,
    password: string,
    displayName: string,
    nameParts: {
      firstName: string
      middleName: string
      lastName: string
    }
  ) {
    const { error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            first_name: nameParts.firstName,
            middle_name: nameParts.middleName,
            last_name: nameParts.lastName,
          },
        },
      })

    if (error) {
      throw error
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
         profile,
        loading: loading || profileLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}