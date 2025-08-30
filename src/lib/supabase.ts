import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Goal = {
  id: number
  created_at: string
  year: string | null
  buyer_transactions_closed: number | null
  seller_transactions_closed: number | null
  total_transactions_closed: number | null
  sales_volume_buyers: number | null
  sales_volume_sellers: number | null
  total_sales_volume: number | null
  commission_income_buyers: number | null
  commission_income_sellers: number | null
  total_commission_income: number | null
  user_id: string
  actual_buyer_transactions_closed: number | null
  actual_seller_transactions_closed: number | null
  actual_total_transactions_closed: number | null
  actual_sales_volume_buyers: number | null
  actual_sales_volume_sellers: number | null
  actual_total_sales_volume: number | null
  actual_commission_income_buyers: number | null
  actual_commission_income_sellers: number | null
  actual_total_commission_income: number | null
}
