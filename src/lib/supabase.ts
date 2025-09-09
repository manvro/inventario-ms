import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://kdhtfzkqlkyfhcjrvscv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaHRmemtxbGt5ZmhjanJ2c2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NjIwNTksImV4cCI6MjA2ODQzODA1OX0.Q3k-ic8QXJrhhgVt5VzjcOmQNplhd5NNWM8HjibdKrg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);