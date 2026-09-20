import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const runtimeConfig = Constants.expoConfig?.extra as
  | {
      supabaseUrl?: string
      supabasePublishableKey?: string
    }
  | undefined

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  runtimeConfig?.supabaseUrl
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  runtimeConfig?.supabasePublishableKey

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.'
  )
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null)
    }

    return SecureStore.getItemAsync(key)
  },

  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value)
      return Promise.resolve()
    }

    return SecureStore.setItemAsync(key, value)
  },

  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key)
      return Promise.resolve()
    }

    return SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)