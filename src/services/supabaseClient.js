import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aqgjxbgkxetpvjqtweii.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZ2p4YmdreGV0cHZqcXR3ZWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTQ4MzQsImV4cCI6MjA5NTAzMDgzNH0.tLvHMc7Iz7TgMY5U25PMZWUXH4W2Ebq2sn9gcvviPAw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
