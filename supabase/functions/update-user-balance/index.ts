import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendVerificationEmail(
  email: string,
  fullName: string,
  status: 'approved' | 'rejected',
  notes?: string,
  key?: string
) {
  try {
    const result = await sendTemplateEmail('verification-status', email, {
      templateData: { fullName, status, notes },
      idempotencyKey: `verification-${key ?? crypto.randomUUID()}`,
    })
    console.log('Verification email result:', JSON.stringify(result))
  } catch (error) {
    console.error('Error sending verification email:', error)
  }
}

async function sendBankAccountEmail(
  email: string,
  fullName: string,
  status: 'approved' | 'rejected',
  bankName?: string,
  accountNumber?: string,
  key?: string
) {
  try {
    const result = await sendTemplateEmail('bank-account-status', email, {
      templateData: { fullName, status, bankName, accountNumber },
      idempotencyKey: `bank-account-${key ?? crypto.randomUUID()}`,
    })
    console.log('Bank account email result:', JSON.stringify(result))
  } catch (error) {
    console.error('Error sending bank account email:', error)
  }
}

async function sendTransferRequestEmail(
  email: string,
  fullName: string,
  status: 'approved' | 'rejected',
  bankName?: string,
  accountNumber?: string,
  amount?: number,
  currency?: string,
  key?: string
) {
  try {
    const result = await sendTemplateEmail('transfer-request-status', email, {
      templateData: { fullName, status, bankName, accountNumber, amount, currency },
      idempotencyKey: `transfer-request-${key ?? crypto.randomUUID()}`,
    })
    console.log('Transfer request email result:', JSON.stringify(result))
  } catch (error) {
    console.error('Error sending transfer request email:', error)
  }
}

interface TransactionEmailData {
  email: string
  fullName: string
  type: string
  currency: string
  amount: number
  usdValue?: number
  transactionHash?: string
  description?: string
  date?: string
  transactionId: string
}

async function sendTransactionEmail(data: TransactionEmailData) {
  try {
    console.log(`Sending transaction email to: ${data.email}`)
    const result = await sendTemplateEmail('transaction-notification', data.email, {
      templateData: {
        fullName: data.fullName,
        type: data.type,
        currency: data.currency,
        amount: data.amount,
        usdValue: data.usdValue,
        description: data.description,
        transactionHash: data.transactionHash,
        date: data.date,
      },
      idempotencyKey: `transaction-${data.transactionId}`,
    })
    console.log('Transaction email result:', JSON.stringify(result))
  } catch (error) {
    console.error('Error sending transaction email:', error)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const {
      userId,
      balances,
      status,
      country,
      transaction,
      verification_status,
      verification_notes,
      verification_reviewed_at,
      activation,
      bank_account_review,
      transfer_request_review,
    } = await req.json()

    if (!userId) {
      throw new Error('userId is required')
    }

    console.log(`Updating user ${userId} with balances:`, balances)

    const updateData: Record<string, any> = {}

    if (balances) {
      if (balances.btc !== undefined) updateData.btc = balances.btc
      if (balances.eth !== undefined) updateData.eth = balances.eth
      if (balances.bnb !== undefined) updateData.bnb = balances.bnb
      if (balances.usdt !== undefined) updateData.usdt = balances.usdt
      if (balances.ltc !== undefined) updateData.ltc = balances.ltc
      if (balances.usd !== undefined) updateData.usd = balances.usd
    }

    if (status) updateData.status = status
    if (country) updateData.country = country
    if (verification_status) updateData.verification_status = verification_status
    if (verification_notes !== undefined) updateData.verification_notes = verification_notes
    if (verification_reviewed_at) updateData.verification_reviewed_at = verification_reviewed_at

    if (activation) {
      if (activation.activation_amount !== undefined) updateData.activation_amount = activation.activation_amount
      if (activation.usdt_address !== undefined) updateData.usdt_address = activation.usdt_address
      if (activation.is_activated !== undefined) updateData.is_activated = activation.is_activated
      console.log('Updating activation settings:', activation)
    }

    const hasProfileUpdates = Object.keys(updateData).length > 0

    const { data, error } = hasProfileUpdates
      ? await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single()
      : await supabase
          .from('profiles')
          .select()
          .eq('user_id', userId)
          .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    console.log('Profile updated successfully for user:', data.user_id)

    if (verification_status && (verification_status === 'approved' || verification_status === 'rejected')) {
      await sendVerificationEmail(
        data.email,
        data.full_name,
        verification_status,
        verification_notes,
        `${data.user_id}-${verification_status}-${verification_reviewed_at ?? ''}`
      )
    }

    if (
      bank_account_review &&
      (bank_account_review.status === 'approved' || bank_account_review.status === 'rejected')
    ) {
      await sendBankAccountEmail(
        data.email,
        data.full_name,
        bank_account_review.status,
        bank_account_review.bank_name,
        bank_account_review.account_number,
        `${data.user_id}-${bank_account_review.status}-${bank_account_review.reviewed_at ?? ''}`
      )
    }

    let updatedProfile = data

    if (
      transfer_request_review &&
      transfer_request_review.status === 'approved' &&
      Number(transfer_request_review.amount) > 0
    ) {
      const currency = String(transfer_request_review.currency || 'USD').toLowerCase()
      const column = ['btc', 'eth', 'bnb', 'usdt', 'ltc', 'usd'].includes(currency) ? currency : 'usd'
      const current = Number((data as Record<string, any>)[column] || 0)
      const newBalance = Math.max(0, current - Number(transfer_request_review.amount))
      console.log(`Deducting ${transfer_request_review.amount} ${column} from ${current} -> ${newBalance}`)
      const { data: balanceData, error: balanceError } = await supabase
        .from('profiles')
        .update({ [column]: newBalance })
        .eq('user_id', userId)
        .select()
        .single()
      if (balanceError) {
        console.error('Error deducting transfer amount:', balanceError)
      } else {
        updatedProfile = balanceData
        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'withdrawal',
          crypto: column.toUpperCase(),
          amount: Number(transfer_request_review.amount),
          usd_value: column === 'usd' ? Number(transfer_request_review.amount) : null,
          status: 'completed',
          description: `Transferencia aprobada a ${transfer_request_review.bank_name || 'banco externo'}`,
        })
      }
    }

    if (
      transfer_request_review &&
      (transfer_request_review.status === 'approved' || transfer_request_review.status === 'rejected')
    ) {
      await sendTransferRequestEmail(
        data.email,
        data.full_name,
        transfer_request_review.status,
        transfer_request_review.bank_name,
        transfer_request_review.account_number,
        transfer_request_review.amount !== undefined ? Number(transfer_request_review.amount) : undefined,
        transfer_request_review.currency || 'USD',
        `${transfer_request_review.request_id ?? data.user_id}-${transfer_request_review.status}`
      )
    }

    let transactionData = null
    if (transaction) {
      console.log('Creating transaction:', transaction)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: transaction.type || 'deposit',
          crypto: transaction.crypto,
          amount: transaction.amount,
          usd_value: transaction.usd_value,
          description: transaction.description,
          transaction_hash: transaction.transaction_hash,
          status: transaction.status || 'completed',
          created_at: transaction.created_at || new Date().toISOString(),
        })
        .select()
        .single()

      if (txError) {
        console.error('Error creating transaction:', txError)
      } else {
        transactionData = txData
        console.log('Transaction created:', txData.id)

        await sendTransactionEmail({
          email: data.email,
          fullName: data.full_name,
          type: transaction.type || 'deposit',
          currency: transaction.crypto,
          amount: Number(transaction.amount),
          usdValue: transaction.usd_value ? Number(transaction.usd_value) : undefined,
          transactionHash: transaction.transaction_hash,
          description: transaction.description,
          date: new Date(txData.created_at).toLocaleDateString('es-ES'),
          transactionId: txData.id,
        })
      }
    }

    return new Response(
      JSON.stringify({ profile: updatedProfile, transaction: transactionData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in update-user-balance:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
