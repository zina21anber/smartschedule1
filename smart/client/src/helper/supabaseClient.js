import { createClient } from "@supabase/supabase-js"
const supabaseUrl = "https://grvsbkuyqvnfofmpisde.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdydnNia3V5cXZuZm9mbXBpc2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTYwMzYsImV4cCI6MjA3NjQ3MjAzNn0.DvUFmEI7mLwTBqJ5w3A19de8HJMsWLlPxGs1Ko13_qs"
const supabase = createClient(supabaseUrl, supabaseKey)
export default supabase;