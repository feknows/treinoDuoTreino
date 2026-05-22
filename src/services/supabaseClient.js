import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aqgjxbgkxetpvjqtweii.supabase.co'
const supabaseAnonKey = 'sb_secret_AMwcMrAb8pD9NydB9nFBkA_G8s4xWTY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
