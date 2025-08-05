import { supabase } from './client'

export interface UserSignUpData {
  email: string
  first_name?: string
  last_name?: string
  image_url?: string
}

/**
 * Sync user data to Supabase when a new user signs up
 */
export async function syncUserToDatabase(userData: UserSignUpData) {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single()

    if (existingUser) {
      console.log('User already exists in database:', userData.email)
      return { success: true, user: existingUser, isNew: false }
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error('Error creating user in database:', error)
      throw error
    }

    console.log('User created in database:', newUser.id)
    return { success: true, user: newUser, isNew: true }
  } catch (error) {
    console.error('Error syncing user to database:', error)
    throw error
  }
}

/**
 * Update user data in Supabase
 */
export async function updateUserInDatabase(userId: string, updates: Partial<UserSignUpData>) {
  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user in database:', error)
      throw error
    }

    console.log('User updated in database:', updatedUser.id)
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error('Error updating user in database:', error)
    throw error
  }
}

/**
 * Get user from database by email
 */
export async function getUserFromDatabase(email: string) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching user from database:', error)
      throw error
    }

    return user
  } catch (error) {
    console.error('Error getting user from database:', error)
    throw error
  }
} 