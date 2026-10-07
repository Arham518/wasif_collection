import { create } from 'zustand'
import { toast } from 'sonner'
import { supabase, requireSupabase, errorMessage } from '../lib/supabase'
import { useCart } from './cart'
import { useWishlist } from './wishlist'

// Cart and wishlist are stored per user; switch them whenever the signed-in user changes.
function syncOwner(userId) {
  useCart.getState().setOwner(userId)
  useWishlist.getState().setOwner(userId)
}

// Supabase Auth session + the user's row in public.profiles (role: customer | admin).
// Supabase itself persists the session; this store only mirrors it for React.
let started = false
let profileRequest = null

export const useAuth = create((set, get) => ({
  ready: false, // first session check finished
  session: null,
  user: null,
  profile: null,
  profileLoading: false,
  profileError: null,

  init: () => {
    if (started) return
    started = true
    if (!supabase) { set({ ready: true }); return }
    supabase.auth.getSession()
      .then(({ data }) => get().applySession(data.session))
      .catch(() => {})
      .finally(() => set({ ready: true }))
    supabase.auth.onAuthStateChange((_event, session) => {
      // Don't call Supabase inside this callback (can deadlock) - defer it.
      setTimeout(() => get().applySession(session), 0)
    })
  },

  applySession: (session) => {
    const user = session?.user ?? null
    const prev = get()
    if (!user) {
      syncOwner(null)
      set({ session: null, user: null, profile: null, profileLoading: false, profileError: null })
      return Promise.resolve(null)
    }
    syncOwner(user.id)
    const needsProfile = prev.user?.id !== user.id || !prev.profile
    set({ session, user, profileLoading: needsProfile ? true : prev.profileLoading, profile: prev.user?.id === user.id ? prev.profile : null })
    return needsProfile ? get().loadProfile() : Promise.resolve(prev.profile)
  },

  loadProfile: () => {
    const user = get().user
    if (!user || !supabase) return Promise.resolve(null)
    if (profileRequest?.uid === user.id) return profileRequest.promise
    set({ profileLoading: true })
    const promise = (async () => {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (!error && !data) {
        // Signed up before the profiles trigger existed: create our own customer row.
        const meta = user.user_metadata || {}
        const ins = await supabase.from('profiles')
          .insert({ id: user.id, email: user.email, full_name: meta.full_name || null, phone: meta.phone || null, role: 'customer' })
          .select('*').maybeSingle()
        data = ins.data
        error = ins.error
      }
      if (get().user?.id !== user.id) return null
      if (error) {
        console.warn('Could not load profile', error)
        set({ profile: null, profileError: errorMessage(error), profileLoading: false })
        toast.error(errorMessage(error, 'Could not load your profile.'), { id: 'profile-error' })
        return null
      }
      set({ profile: data, profileError: null, profileLoading: false })
      return data
    })().finally(() => { if (profileRequest?.promise === promise) profileRequest = null })
    profileRequest = { uid: user.id, promise }
    return promise
  },

  signIn: async (email, password) => {
    const sb = requireSupabase()
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
    const profile = await get().applySession(data.session)
    return { user: data.user, profile }
  },

  signUp: async ({ email, password, fullName, phone }) => {
    const sb = requireSupabase()
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName?.trim() || '', phone: phone?.trim() || '' },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    // Supabase returns a user with no identities when the email is already registered.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('This email is already registered. Please log in.')
    }
    if (data.session) {
      const profile = await get().applySession(data.session)
      return { needsConfirmation: false, profile }
    }
    return { needsConfirmation: true, profile: null }
  },

  signOut: async () => {
    try { await supabase?.auth.signOut() } catch { /* ignore */ }
    syncOwner(null)
      set({ session: null, user: null, profile: null, profileLoading: false, profileError: null })
  },

  updateProfile: async (patch) => {
    const sb = requireSupabase()
    const user = get().user
    if (!user) throw new Error('Please log in first.')
    const allowed = {}
    for (const k of ['full_name', 'phone', 'address', 'city']) if (k in patch) allowed[k] = patch[k]
    const { data, error } = await sb.from('profiles').update(allowed).eq('id', user.id).select('*').single()
    if (error) throw error
    set({ profile: data })
    return data
  },
}))

export const useIsAdmin = () => useAuth((s) => s.profile?.role === 'admin')

/** Only allow internal redirects like "/checkout" (never "//evil.com"). */
export function safeNext(next, fallback) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}