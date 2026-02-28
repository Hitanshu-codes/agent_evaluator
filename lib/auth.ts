import { cookies } from 'next/headers'
import { supabase } from './supabase'

const COOKIE_NAME = 'nudgeable_session'

export async function getUserFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAME)
  
  if (!sessionCookie) {
    return null
  }
  
  return sessionCookie.value
}

export async function getOrCreateUser(username: string) {
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (existingUser) {
    return existingUser
  }

  if (selectError && selectError.code !== 'PGRST116') {
    throw selectError
  }

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({ username })
    .select()
    .single()

  if (insertError) {
    throw insertError
  }

  return newUser
}
