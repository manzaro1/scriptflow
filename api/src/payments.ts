import type { Context } from 'hono';
import { db } from './db';
import { createHmac } from 'crypto';

// PayChangu configuration
const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY || '';
const PAYCHANGU_PUBLIC_KEY = process.env.PAYCHANGU_PUBLIC_KEY || '';
const PAYCHANGU_WEBHOOK_SECRET = process.env.PAYCHANGU_WEBHOOK_SECRET || '';
const PAYCHANGU_BASE_URL = 'https://api.paychangu.com';

// ============================================
// SCRIPTFLOW FULL PRICING PLAN
// ============================================

export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free Tier',
    description: 'Perfect for starting your screenwriting journey',
    priceMonthlyMWK: 0,
    priceYearlyMWK: 0,
    priceMonthlyUSD: 0,
    priceYearlyUSD: 0,
    currency: 'MWK',
    features: {
      // Script Writing
      maxScripts: 1,
      industryFormatting: true,
      exportFormats: ['PDF'],
      autoSave: true,
      weeklyBackup: false,
      
      // AI Features
      sceneGenerationsPerMonth: 3,
      aiAutocomplete: false,
      dialogueFeedback: false,
      characterChat: true,
      aiPrioritySpeed: false,
      
      // Telegram Bot
      telegramLinking: true,
      telegramViewScripts: true,
      telegramViewCharacters: true,
      telegramChatMessagesPerDay: 30,
      telegramConversationHistory: false,
      
      // Collaboration
      collaboration: false,
      rolePermissions: false,
      commentSystem: false,
      versionHistory: false,
      
      // Extras
      prioritySupport: false,
      earlyAccess: false,
      customAIModel: false,
    },
    featureList: [
      '1 script at a time',
      'Industry-standard formatting',
      'Export to PDF',
      'Auto-save',
      'Scene generation (3 per month)',
      'Basic AI suggestions',
      'Telegram bot: /link, /scripts, /characters',
      'Character chat: 30 messages/day',
    ],
    limitations: [
      'No collaboration',
      'No conversation history',
      'No backups',
      'Standard AI speed',
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Everything needed for serious creators',
    priceMonthlyMWK: 25000, // ~$15
    priceYearlyMWK: 250000, // ~$149 (save MWK 50,000)
    priceMonthlyUSD: 15,
    priceYearlyUSD: 149, // 17% discount
    currency: 'MWK',
    features: {
      // Script Writing
      maxScripts: -1, // unlimited
      industryFormatting: true,
      exportFormats: ['PDF', 'TXT', 'DOCX'],
      autoSave: true,
      weeklyBackup: true,
      
      // AI Features
      sceneGenerationsPerMonth: -1, // unlimited
      aiAutocomplete: true,
      dialogueFeedback: true,
      characterChat: true,
      aiPrioritySpeed: true,
      
      // Telegram Bot
      telegramLinking: true,
      telegramViewScripts: true,
      telegramViewCharacters: true,
      telegramChatMessagesPerDay: -1, // unlimited
      telegramConversationHistory: true, // 30 days saved
      
      // Collaboration
      collaboration: true,
      rolePermissions: true,
      commentSystem: true,
      versionHistory: true,
      
      // Extras
      prioritySupport: true,
      earlyAccess: true,
      customAIModel: true,
    },
    featureList: [
      'UNLIMITED scripts',
      'Industry-standard formatting',
      'Export to PDF, TXT, DOCX',
      'Auto-save',
      'Weekly automatic backup',
      'UNLIMITED scene generation',
      'AI autocomplete for scenes',
      'Dialogue feedback scoring',
      'Character development chat',
      'Priority AI response speed',
      'UNLIMITED character chat',
      'Conversation history (30 days)',
      'Real-time collaboration',
      'Role-based permissions',
      'Comment system',
      'Version history',
      'Priority support',
      'Early access to new features',
      'Custom AI model selection',
    ],
    limitations: []
  }
};

// Initialize payments database tables
export function initPaymentsDb() {
  // Subscription plans
  db.run(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price_monthly_mwk INTEGER NOT NULL,
      price_yearly_mwk INTEGER NOT NULL,
      price_monthly_usd INTEGER NOT NULL,
      price_yearly_usd INTEGER NOT NULL,
      currency TEXT DEFAULT 'MWK',
      features TEXT,
      feature_list TEXT,
      limitations TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User subscriptions
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      plan_id TEXT NOT NULL DEFAULT 'free',
      status TEXT DEFAULT 'active',
      billing_cycle TEXT DEFAULT 'monthly',
      current_period_start DATETIME DEFAULT CURRENT_TIMESTAMP,
      current_period_end DATETIME,
      cancelled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Payments table
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'MWK',
      status TEXT DEFAULT 'pending',
      billing_cycle TEXT DEFAULT 'monthly',
      tx_ref TEXT UNIQUE,
      paychangu_tx_id TEXT,
      paychangu_checkout_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // AI usage tracking (monthly)
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      month_year TEXT NOT NULL,
      scene_generations INTEGER DEFAULT 0,
      ai_autocomplete_calls INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, month_year)
    )
  `);

  // Telegram daily usage
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_daily_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      usage_date TEXT NOT NULL,
      chat_messages INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(telegram_id, usage_date)
    )
  `);

  // Insert default plans if not exist
  const existingPlans = db.query('SELECT COUNT(*) as count FROM subscription_plans').get() as any;
  if (!existingPlans || existingPlans.count === 0) {
    for (const [id, plan] of Object.entries(PRICING_PLANS)) {
      db.run(`
        INSERT INTO subscription_plans (
          id, name, description, 
          price_monthly_mwk, price_yearly_mwk,
          price_monthly_usd, price_yearly_usd,
          currency, features, feature_list, limitations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        plan.name,
        plan.description,
        plan.priceMonthlyMWK,
        plan.priceYearlyMWK,
        plan.priceMonthlyUSD,
        plan.priceYearlyUSD,
        plan.currency,
        JSON.stringify(plan.features),
        JSON.stringify(plan.featureList),
        JSON.stringify(plan.limitations),
      ]);
    }
  }

  // Create default free subscription for all users without one
  db.run(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_end)
    SELECT 'sub_' || id, id, 'free', 'active', datetime('now', '+100 years')
    FROM users 
    WHERE id NOT IN (SELECT user_id FROM subscriptions)
  `);

  console.log('Payments database initialized');
}

// Get all subscription plans
export function getPlans() {
  const plans = db.query('SELECT * FROM subscription_plans WHERE is_active = 1').all();
  return plans.map((p: any) => ({
    ...p,
    features: JSON.parse(p.features || '{}'),
    featureList: JSON.parse(p.feature_list || '[]'),
    limitations: JSON.parse(p.limitations || '[]'),
  }));
}

// Get user's active subscription
export function getUserSubscription(userId: string) {
  let subscription = db.query(`
    SELECT s.*, sp.name, sp.description, sp.features, sp.feature_list, sp.limitations,
           sp.price_monthly_mwk, sp.price_yearly_mwk,
           sp.price_monthly_usd, sp.price_yearly_usd
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = ?
  `).get(userId) as any;

  if (!subscription) {
    // Create free subscription
    const subId = `sub_${Date.now()}_${userId.substring(0, 8)}`;
    db.run(`
      INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_end)
      VALUES (?, ?, 'free', 'active', datetime('now', '+100 years'))
    `, [subId, userId]);
    
    subscription = {
      plan_id: 'free',
      status: 'active',
      features: JSON.stringify(PRICING_PLANS.free.features),
      feature_list: JSON.stringify(PRICING_PLANS.free.featureList),
      limitations: JSON.stringify(PRICING_PLANS.free.limitations),
    };
  }

  return {
    ...subscription,
    features: JSON.parse(subscription.features || '{}'),
    featureList: JSON.parse(subscription.feature_list || '[]'),
    limitations: JSON.parse(subscription.limitations || '[]'),
  };
}

// Initiate payment via PayChangu Standard Checkout
export async function initiatePayment(params: {
  userId: string;
  planId: string;
  billingCycle?: 'monthly' | 'yearly';
  email: string;
  amount?: number;
  currency?: string;
}) {
  const { userId, planId, billingCycle = 'monthly', email } = params;
  const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
  if (!plan) {
    return { error: 'Invalid plan' };
  }

  const amount = billingCycle === 'yearly' ? plan.priceYearlyMWK : plan.priceMonthlyMWK;
  const amountUSD = billingCycle === 'yearly' ? plan.priceYearlyUSD : plan.priceMonthlyUSD;
  const txRef = `SF-${Date.now()}-${userId.substring(0, 8)}`;
  const paymentId = `pay_${Date.now()}`;

  // For test mode (no PayChangu secret key)
  if (!PAYCHANGU_SECRET_KEY) {
    db.run(`
      INSERT INTO payments (user_id, plan_id, amount, currency, status, billing_cycle, tx_ref)
      VALUES (?, ?, ?, 'MWK', 'pending', ?, ?)
    `, [userId, planId, amount, billingCycle, txRef]);

    return {
      tx_ref: txRef,
      checkout_url: `https://scriptflow-zaro.zocomputer.io/pricing?test=1&ref=${txRef}`,
      amount,
      amount_usd: amountUSD,
      currency: 'MWK',
      test_mode: true,
      message: 'Test mode - PayChangu not configured',
    };
  }

  try {
    const response = await fetch(`${PAYCHANGU_BASE_URL}/payment`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYCHANGU_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'MWK',
        email: email,
        first_name: email.split('@')[0],
        last_name: 'User',
        tx_ref: txRef,
        callback_url: 'https://scriptflow-zaro.zocomputer.io/api/payments/webhook',
        return_url: `https://scriptflow-zaro.zocomputer.io/pricing?success=1&ref=${txRef}`,
        customization: {
          title: `ScriptFlow ${plan.name}`,
          description: `${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} ${plan.name} Subscription`,
          logo: 'https://scriptflow-zaro.zocomputer.io/logo.png',
        },
        meta: {
          user_id: userId,
          plan_id: planId,
          billing_cycle: billingCycle,
        },
      }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.data?.checkout_url) {
      db.run(`
        INSERT INTO payments (user_id, plan_id, amount, currency, status, billing_cycle, tx_ref, paychangu_tx_id, paychangu_checkout_url)
        VALUES (?, ?, ?, 'MWK', 'pending', ?, ?, ?, ?)
      `, [userId, planId, amount, billingCycle, txRef, data.data?.tx_ref || data.data?.data?.tx_ref, data.data.checkout_url]);

      return {
        success: true,
        tx_ref: txRef,
        checkout_url: data.data.checkout_url,
        amount,
        currency: 'MWK',
      };
    }

    return { error: data.message || 'Payment initiation failed' };
  } catch (error: any) {
    console.error('PayChangu error:', error);
    return { error: 'Payment service unavailable' };
  }
}

// Handle successful payment - update payment and subscription
export function handleSuccessfulPayment(txRef: string, data: any) {
  const payment = db.query('SELECT * FROM payments WHERE tx_ref = ?').get(txRef) as any;
  
  if (!payment) {
    console.error('Payment not found for txRef:', txRef);
    return false;
  }

  const plan = PRICING_PLANS[payment.plan_id as keyof typeof PRICING_PLANS];
  const durationMonths = payment.billing_cycle === 'yearly' ? 12 : 1;

  // Update payment status
  db.run(`
    UPDATE payments SET status = 'success', completed_at = datetime('now')
    WHERE tx_ref = ?
  `, [txRef]);

  // Update subscription
  const periodEnd = durationMonths === 12 
    ? "datetime('now', '+12 months')"
    : "datetime('now', '+1 month')";

  db.run(`
    UPDATE subscriptions SET 
      plan_id = ?,
      status = 'active',
      billing_cycle = ?,
      current_period_start = datetime('now'),
      current_period_end = ${periodEnd},
      updated_at = datetime('now'),
      cancelled_at = NULL
    WHERE user_id = ?
  `, [payment.plan_id, payment.billing_cycle, payment.user_id]);

  console.log(`Payment ${txRef} completed for user ${payment.user_id}`);
  return true;
}

// Verify webhook signature from PayChangu
export function verifyWebhookSignature(signature: string, payload: string): boolean {
  if (!PAYCHANGU_WEBHOOK_SECRET) return true; // Skip in test mode
  
  const expectedSignature = createHmac('sha256', PAYCHANGU_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Handle PayChangu webhook
export async function handlePaymentWebhook(c: Context) {
  const signature = c.req.header('Signature') || c.req.header('X-PayChangu-Signature') || '';
  const payload = await c.req.text();
  
  // Verify signature
  if (!verifyWebhookSignature(signature, payload)) {
    console.error('Invalid webhook signature');
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const body = JSON.parse(payload);
  const { tx_ref, status, reference, event_type } = body;

  console.log('PayChangu webhook:', { tx_ref, status, reference, event_type });

  // Find payment by tx_ref
  const payment = db.query('SELECT * FROM payments WHERE tx_ref = ?').get(tx_ref) as any;
  
  if (!payment) {
    console.error('Payment not found:', tx_ref);
    return c.json({ received: true, error: 'Payment not found' });
  }

  if (status === 'success' || event_type === 'api.charge.payment') {
    const plan = PRICING_PLANS[payment.plan_id as keyof typeof PRICING_PLANS];
    const durationMonths = payment.billing_cycle === 'yearly' ? 12 : 1;
    
    // Update payment status
    db.run(`
      UPDATE payments SET status = 'success', completed_at = datetime('now')
      WHERE tx_ref = ?
    `, [tx_ref]);

    // Update subscription
    const periodEnd = durationMonths === 12 
      ? "datetime('now', '+12 months')"
      : "datetime('now', '+1 month')";

    db.run(`
      UPDATE subscriptions SET 
        plan_id = ?,
        status = 'active',
        billing_cycle = ?,
        current_period_start = datetime('now'),
        current_period_end = ${periodEnd},
        updated_at = datetime('now'),
        cancelled_at = NULL
      WHERE user_id = ?
    `, [payment.plan_id, payment.billing_cycle, payment.user_id]);

    console.log(`Payment ${tx_ref} completed for user ${payment.user_id}`);
  }

  return c.json({ received: true });
}

// Verify transaction status
export async function verifyTransaction(txRef: string) {
  const payment = db.query('SELECT * FROM payments WHERE tx_ref = ?').get(txRef) as any;
  
  if (!payment) {
    return { status: 'not_found' };
  }

  return { status: payment.status, payment };
}

// Check if user can use a feature
export function canUseFeature(userId: string, feature: string): { allowed: boolean; reason?: string; limit?: number; used?: number } {
  const subscription = getUserSubscription(userId);
  const tier = subscription.plan_id || 'free';
  const plan = PRICING_PLANS[tier as keyof typeof PRICING_PLANS] || PRICING_PLANS.free;

  switch (feature) {
    case 'create_script': {
      if (plan.features.maxScripts === -1) return { allowed: true };
      
      const scripts = db.query('SELECT COUNT(*) as count FROM scripts WHERE user_id = ?').get(userId) as any;
      if (scripts.count >= plan.features.maxScripts) {
        return { 
          allowed: false, 
          reason: `Free tier limited to ${plan.features.maxScripts} script. Upgrade to Premium for unlimited scripts.`,
          limit: plan.features.maxScripts,
          used: scripts.count,
        };
      }
      return { allowed: true };
    }

    case 'scene_generation': {
      if (plan.features.sceneGenerationsPerMonth === -1) return { allowed: true };
      
      const monthYear = new Date().toISOString().slice(0, 7);
      const usage = db.query(`
        SELECT scene_generations FROM ai_usage WHERE user_id = ? AND month_year = ?
      `).get(userId, monthYear) as any;

      const used = usage?.scene_generations || 0;
      if (used >= plan.features.sceneGenerationsPerMonth) {
        return { 
          allowed: false, 
          reason: `Free tier limited to ${plan.features.sceneGenerationsPerMonth} scene generations/month. Upgrade to Premium for unlimited.`,
          limit: plan.features.sceneGenerationsPerMonth,
          used,
        };
      }
      return { allowed: true, limit: plan.features.sceneGenerationsPerMonth, used };
    }

    case 'telegram_chat': {
      if (plan.features.telegramChatMessagesPerDay === -1) return { allowed: true };
      
      const today = new Date().toISOString().slice(0, 10);
      const link = db.query('SELECT telegram_id FROM telegram_links WHERE user_id = ?').get(userId) as any;
      if (!link) return { allowed: true };

      const usage = db.query(`
        SELECT chat_messages FROM telegram_daily_usage WHERE telegram_id = ? AND usage_date = ?
      `).get(link.telegram_id, today) as any;

      const used = usage?.chat_messages || 0;
      if (used >= plan.features.telegramChatMessagesPerDay) {
        return { 
          allowed: false, 
          reason: `Daily message limit reached (${plan.features.telegramChatMessagesPerDay}). Upgrade to Premium for unlimited chat!`,
          limit: plan.features.telegramChatMessagesPerDay,
          used,
        };
      }
      return { allowed: true, limit: plan.features.telegramChatMessagesPerDay, used };
    }

    case 'collaboration': {
      if (!plan.features.collaboration) {
        return { 
          allowed: false, 
          reason: 'Collaboration is a Premium feature. Upgrade to collaborate on scripts.',
        };
      }
      return { allowed: true };
    }

    case 'ai_autocomplete': {
      if (!plan.features.aiAutocomplete) {
        return { 
          allowed: false, 
          reason: 'AI Autocomplete is a Premium feature. Upgrade for AI-powered scene completion.',
        };
      }
      return { allowed: true };
    }

    case 'dialogue_feedback': {
      if (!plan.features.dialogueFeedback) {
        return { 
          allowed: false, 
          reason: 'Dialogue Feedback is a Premium feature. Upgrade for AI dialogue scoring.',
        };
      }
      return { allowed: true };
    }

    case 'weekly_backup': {
      if (!plan.features.weeklyBackup) {
        return { 
          allowed: false, 
          reason: 'Weekly backup is a Premium feature. Upgrade for automatic backups.',
        };
      }
      return { allowed: true };
    }

    default:
      return { allowed: true };
  }
}

// Increment usage counter
export function incrementUsage(userId: string, feature: string) {
  const monthYear = new Date().toISOString().slice(0, 7);

  switch (feature) {
    case 'scene_generation':
      db.run(`
        INSERT INTO ai_usage (user_id, month_year, scene_generations)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, month_year) DO UPDATE SET 
          scene_generations = scene_generations + 1,
          updated_at = datetime('now')
      `, [userId, monthYear]);
      break;

    case 'ai_autocomplete':
      db.run(`
        INSERT INTO ai_usage (user_id, month_year, ai_autocomplete_calls)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, month_year) DO UPDATE SET 
          ai_autocomplete_calls = ai_autocomplete_calls + 1,
          updated_at = datetime('now')
      `, [userId, monthYear]);
      break;
  }
}

// Increment Telegram daily usage
export function incrementTelegramUsage(telegramId: string): { allowed: boolean; reason?: string } {
  const today = new Date().toISOString().slice(0, 10);

  // Get user's subscription tier
  const link = db.query('SELECT user_id FROM telegram_links WHERE telegram_id = ?').get(telegramId) as any;
  if (!link) return { allowed: true };

  const subscription = getUserSubscription(link.user_id);
  const tier = subscription.plan_id || 'free';
  const plan = PRICING_PLANS[tier as keyof typeof PRICING_PLANS] || PRICING_PLANS.free;

  // Unlimited for premium
  if (plan.features.telegramChatMessagesPerDay === -1) {
    return { allowed: true };
  }

  // Check current usage
  const usage = db.query(`
    SELECT chat_messages FROM telegram_daily_usage WHERE telegram_id = ? AND usage_date = ?
  `).get(telegramId, today) as any;

  const used = usage?.chat_messages || 0;

  if (used >= plan.features.telegramChatMessagesPerDay) {
    return { 
      allowed: false, 
      reason: `Daily message limit reached (${plan.features.telegramChatMessagesPerDay}). Upgrade to Premium for unlimited chat!`,
    };
  }

  // Increment usage
  db.run(`
    INSERT INTO telegram_daily_usage (telegram_id, usage_date, chat_messages)
    VALUES (?, ?, 1)
    ON CONFLICT(telegram_id, usage_date) DO UPDATE SET chat_messages = chat_messages + 1
  `, [telegramId, today]);

  return { allowed: true };
}

// Get usage stats for user
export function getUsageStats(userId: string) {
  const monthYear = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  const aiUsage = db.query(`
    SELECT scene_generations, ai_autocomplete_calls FROM ai_usage 
    WHERE user_id = ? AND month_year = ?
  `).get(userId, monthYear) as any;

  const link = db.query('SELECT telegram_id FROM telegram_links WHERE user_id = ?').get(userId) as any;
  let telegramUsage = 0;
  if (link) {
    const tgUse = db.query(`
      SELECT chat_messages FROM telegram_daily_usage WHERE telegram_id = ? AND usage_date = ?
    `).get(link.telegram_id, today) as any;
    telegramUsage = tgUse?.chat_messages || 0;
  }

  const scripts = db.query('SELECT COUNT(*) as count FROM scripts WHERE user_id = ?').get(userId) as any;

  return {
    scripts: scripts.count || 0,
    sceneGenerations: aiUsage?.scene_generations || 0,
    aiAutocompleteCalls: aiUsage?.ai_autocomplete_calls || 0,
    telegramMessagesToday: telegramUsage,
  };
}
