/**
 * Skema database FxB Pay.
 *
 * Prinsip keuangan:
 * - Nominal disimpan sebagai BIGINT rupiah (bukan floating point).
 * - ledger_journals + ledger_entries adalah sumber kebenaran saldo (double-entry, immutable;
 *   dijaga trigger di migration `0001_guards.sql`).
 * - ledger_accounts.balance adalah cache yang diperbarui di transaksi DB yang sama dengan entri,
 *   dengan CHECK constraint agar akun yang tidak boleh negatif tidak pernah minus.
 * - Setiap baris finansial memiliki kolom `env` ('sandbox' | 'production') — dipisah penuh.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const money = (name: string) => bigint(name, { mode: "bigint" });
const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();

// ───────────────────────────── Akun & autentikasi ─────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    storeName: text("store_name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
    status: text("status", { enum: ["active", "frozen"] }).notNull().default("active"),
    frozenReason: text("frozen_reason"),
    emailVerifiedAt: ts("email_verified_at"),
    totpSecretEnc: text("totp_secret_enc"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    totpLastStep: bigint("totp_last_step", { mode: "number" }),
    onboardedAt: ts("onboarded_at"),
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: ts("locked_until"),
    passwordChangedAt: ts("password_changed_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    mfaPassed: boolean("mfa_passed").notNull().default(false),
    ip: text("ip").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: createdAt(),
    lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
    expiresAt: ts("expires_at").notNull(),
    revokedAt: ts("revoked_at"),
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

export const loginEvents = pgTable(
  "login_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    success: boolean("success").notNull(),
    reason: text("reason").notNull().default(""),
    ip: text("ip").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("login_events_user_idx").on(t.userId, t.createdAt)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["verify_email", "reset_password"] }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("auth_tokens_hash_uq").on(t.tokenHash)],
);

export const emailOutbox = pgTable("email_outbox", {
  id: uuid("id").primaryKey().defaultRandom(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["queued", "sent", "logged", "failed"] }).notNull().default("queued"),
  error: text("error"),
  createdAt: createdAt(),
  sentAt: ts("sent_at"),
});

// ───────────────────────────── Ledger ─────────────────────────────

export const ACCOUNT_KINDS = [
  "user_available", // saldo tersedia pengguna (liabilitas, normal kredit)
  "user_held", // saldo tertahan / menunggu settlement
  "user_reserved", // dicadangkan untuk penarikan / refund yang sedang diproses
  "platform_fee", // pendapatan biaya platform
  "provider_clearing", // piutang dari DANA (aset, normal debit)
  "settlement_bank", // rekening bank platform yang menampung settlement (aset, normal debit)
  "platform_adjustment", // ekuitas/penyesuaian koreksi admin (boleh negatif)
] as const;
export type AccountKind = (typeof ACCOUNT_KINDS)[number];

export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    env: text("env", { enum: ["sandbox", "production"] }).notNull(),
    kind: text("kind", { enum: ACCOUNT_KINDS }).notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "restrict" }),
    normalSide: text("normal_side", { enum: ["debit", "credit"] }).notNull(),
    allowNegative: boolean("allow_negative").notNull().default(false),
    balance: money("balance").notNull().default(sql`0`),
    currency: text("currency").notNull().default("IDR"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("ledger_accounts_uq").on(t.env, t.kind, sql`coalesce(${t.ownerUserId}, '00000000-0000-0000-0000-000000000000'::uuid)`),
    check("ledger_accounts_nonneg", sql`${t.allowNegative} OR ${t.balance} >= 0`),
  ],
);

export const ledgerJournals = pgTable(
  "ledger_journals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    env: text("env", { enum: ["sandbox", "production"] }).notNull(),
    type: text("type").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    referenceType: text("reference_type").notNull(),
    referenceId: text("reference_id").notNull(),
    memo: text("memo").notNull().default(""),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("ledger_journals_idem_uq").on(t.idempotencyKey),
    index("ledger_journals_ref_idx").on(t.referenceType, t.referenceId),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    journalId: uuid("journal_id").notNull().references(() => ledgerJournals.id, { onDelete: "restrict" }),
    accountId: uuid("account_id").notNull().references(() => ledgerAccounts.id, { onDelete: "restrict" }),
    debit: money("debit").notNull().default(sql`0`),
    credit: money("credit").notNull().default(sql`0`),
    balanceAfter: money("balance_after").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("ledger_entries_account_idx").on(t.accountId, t.id),
    index("ledger_entries_journal_idx").on(t.journalId),
    check("ledger_entries_one_side", sql`(${t.debit} > 0 AND ${t.credit} = 0) OR (${t.credit} > 0 AND ${t.debit} = 0)`),
  ],
);

// ───────────────────────────── Pembayaran ─────────────────────────────

export const PAYMENT_STATUSES = [
  "CREATED",
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
  "CANCELLED",
  "REFUND_PENDING",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("public_id").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    env: text("env", { enum: ["sandbox", "production"] }).notNull(),
    provider: text("provider", { enum: ["dana", "demo"] }).notNull(),
    purpose: text("purpose", { enum: ["payment", "topup"] }).notNull().default("payment"),
    partnerReferenceNo: text("partner_reference_no").notNull(),
    orderRef: text("order_ref").notNull().default(""),
    description: text("description").notNull(),
    customerName: text("customer_name").notNull().default(""),
    customerEmail: text("customer_email").notNull().default(""),
    amount: money("amount").notNull(), // nominal yang ditagihkan ke pembeli (bruto)
    fee: money("fee").notNull(),
    net: money("net").notNull(), // amount - fee → dikreditkan ke merchant
    feeBearer: text("fee_bearer", { enum: ["merchant", "customer"] }).notNull().default("merchant"),
    baseAmount: money("base_amount").notNull(), // nominal sebelum biaya (input merchant)
    currency: text("currency").notNull().default("IDR"),
    status: text("status", { enum: PAYMENT_STATUSES }).notNull().default("CREATED"),
    expiresAt: ts("expires_at").notNull(),
    providerReferenceNo: text("provider_reference_no"),
    providerRedirectUrl: text("provider_redirect_url"),
    providerPaymentCode: text("provider_payment_code"),
    providerStatus: text("provider_status"),
    paymentMethod: text("payment_method", { enum: ["redirect", "qris"] }).notNull().default("redirect"),
    paidAt: ts("paid_at"),
    lateCallback: boolean("late_callback").notNull().default(false),
    needsReview: boolean("needs_review").notNull().default(false),
    reviewReason: text("review_reason"),
    refundedAmount: money("refunded_amount").notNull().default(sql`0`),
    capturedJournalId: uuid("captured_journal_id"),
    heldUntil: ts("held_until"),
    releasedAt: ts("released_at"),
    settledAt: ts("settled_at"),
    settlementId: uuid("settlement_id"),
    idempotencyKey: text("idempotency_key"),
    createdVia: text("created_via", { enum: ["dashboard", "api", "uat"] }).notNull().default("dashboard"),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payments_public_uq").on(t.publicId),
    uniqueIndex("payments_partner_ref_uq").on(t.env, t.partnerReferenceNo),
    uniqueIndex("payments_idem_uq").on(t.userId, t.env, t.idempotencyKey),
    index("payments_user_idx").on(t.userId, t.env, t.createdAt),
    index("payments_status_idx").on(t.env, t.status),
    check("payments_amounts", sql`${t.amount} > 0 AND ${t.fee} >= 0 AND ${t.net} >= 0 AND ${t.net} + ${t.fee} = ${t.amount}`),
    check("payments_refund_le", sql`${t.refundedAmount} >= 0 AND ${t.refundedAmount} <= ${t.amount}`),
  ],
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    source: text("source", { enum: ["system", "api", "dashboard", "webhook", "query", "job", "admin", "demo", "uat"] }).notNull(),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("payment_events_payment_idx").on(t.paymentId, t.id)],
);

export const providerNotifications = pgTable(
  "provider_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    env: text("env", { enum: ["sandbox", "production"] }).notNull(),
    provider: text("provider").notNull().default("dana"),
    path: text("path").notNull(),
    headers: jsonb("headers").notNull(),
    body: text("body").notNull(),
    bodyHash: text("body_hash").notNull(),
    signatureValid: boolean("signature_valid").notNull(),
    verifiedWith: text("verified_with"), // 'dana' | 'local_harness'
    partnerReferenceNo: text("partner_reference_no"),
    paymentId: uuid("payment_id"),
    outcome: text("outcome").notNull(),
    detail: text("detail").notNull().default(""),
    receivedAt: ts("received_at").notNull().defaultNow(),
  },
  (t) => [index("provider_notifications_env_idx").on(t.env, t.receivedAt)],
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "restrict" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    env: text("env", { enum: ["sandbox", "production"] }).notNull(),
    amount: money("amount").notNull(),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["PENDING", "SUCCEEDED", "FAILED", "UNCERTAIN"] }).notNull().default("PENDING"),
    partnerRefundNo: text("partner_refund_no").notNull(),
    providerRefundNo: text("provider_refund_no"),
    providerResponseCode: text("provider_response_code"),
    failureReason: text("failure_reason"),
    requestedBy: uuid("requested_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("refunds_partner_no_uq").on(t.partnerRefundNo), check("refunds_amount_pos", sql`${t.amount} > 0`)],
);

export const WITHDRAWAL_STATUSES = ["PENDING_REVIEW", "APPROVED", "PROCESSING", "PAID", "REJECTED", "FAILED", "UNCERTAIN"] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const withdrawals = pgTable(
  "withdrawals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    env: text("env", { enum: ["sandbox", "production"] }).notNull(),
    amount: money("amount").notNull(),
    fee: money("fee").notNull(),
    net: money("net").notNull(),
    destinationType: text("destination_type", { enum: ["bank", "dana"] }).notNull(),
    destinationBank: text("destination_bank").notNull().default(""),
    destinationAccount: text("destination_account").notNull(),
    destinationName: text("destination_name").notNull(),
    status: text("status", { enum: WITHDRAWAL_STATUSES }).notNull().default("PENDING_REVIEW"),
    method: text("method", { enum: ["manual", "dana_disbursement"] }).notNull().default("manual"),
    rejectReason: text("reject_reason"),
    proofReference: text("proof_reference"),
    proofNote: text("proof_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: ts("reviewed_at"),
    paidAt: ts("paid_at"),
    idempotencyKey: text("idempotency_key"),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("withdrawals_idem_uq").on(t.userId, t.env, t.idempotencyKey),
    index("withdrawals_status_idx").on(t.env, t.status),
    check("withdrawals_amounts", sql`${t.amount} > 0 AND ${t.fee} >= 0 AND ${t.net} > 0 AND ${t.net} + ${t.fee} = ${t.amount}`),
  ],
);

export const withdrawalEvents = pgTable("withdrawal_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  withdrawalId: uuid("withdrawal_id").notNull().references(() => withdrawals.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorId: uuid("actor_id"),
  note: text("note").notNull().default(""),
  createdAt: createdAt(),
});

export const settlements = pgTable("settlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  env: text("env", { enum: ["sandbox", "production"] }).notNull(),
  periodStart: ts("period_start").notNull(),
  periodEnd: ts("period_end").notNull(),
  expectedAmount: money("expected_amount").notNull(),
  receivedAmount: money("received_amount").notNull(),
  paymentCount: integer("payment_count").notNull(),
  bankReference: text("bank_reference").notNull(),
  note: text("note").notNull().default(""),
  journalId: uuid("journal_id"),
  recordedBy: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const reconciliationRuns = pgTable("reconciliation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  env: text("env", { enum: ["sandbox", "production"] }).notNull(),
  status: text("status", { enum: ["running", "ok", "mismatch", "error"] }).notNull(),
  summary: jsonb("summary").notNull().default({}),
  mismatches: jsonb("mismatches").notNull().default([]),
  startedBy: uuid("started_by"),
  createdAt: createdAt(),
  finishedAt: ts("finished_at"),
});

// ───────────────────────────── API & webhook merchant ─────────────────────────────

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    env: text("env", { enum: ["sandbox", "production"] }).notNull(),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    expiresAt: ts("expires_at"),
    revokedAt: ts("revoked_at"),
    lastUsedAt: ts("last_used_at"),
    rotatedFrom: uuid("rotated_from"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("api_keys_hash_uq").on(t.keyHash), index("api_keys_user_idx").on(t.userId)],
);

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  env: text("env", { enum: ["sandbox", "production"] }).notNull(),
  url: text("url").notNull(),
  secretEnc: text("secret_enc").notNull(),
  events: jsonb("events").$type<string[]>().notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endpointId: uuid("endpoint_id").notNull().references(() => webhookEndpoints.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    env: text("env", { enum: ["sandbox", "production"] }).notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status", { enum: ["pending", "succeeded", "failed"] }).notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastResponseCode: integer("last_response_code"),
    lastError: text("last_error"),
    nextAttemptAt: ts("next_attempt_at"),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("webhook_deliveries_user_idx").on(t.userId, t.createdAt)],
);

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: text("scope").notNull(),
    key: text("key").notNull(),
    requestHash: text("request_hash").notNull(),
    statusCode: integer("status_code"),
    response: jsonb("response"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("idempotency_scope_key_uq").on(t.scope, t.key)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: ts("window_start").notNull(),
  count: integer("count").notNull(),
});

// ───────────────────────────── Operasional ─────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // null = untuk semua admin
    audience: text("audience", { enum: ["user", "admin"] }).notNull().default("user"),
    env: text("env"),
    type: text("type", { enum: ["payment", "withdrawal", "refund", "integration", "security", "system"] }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    readAt: ts("read_at"),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: uuid("actor_id"),
    actorEmail: text("actor_email").notNull().default("system"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull().default(""),
    targetId: text("target_id").notNull().default(""),
    detail: jsonb("detail").notNull().default({}),
    ip: text("ip").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by"),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const providerConfigs = pgTable("provider_configs", {
  env: text("env", { enum: ["sandbox", "production"] }).primaryKey(),
  product: text("product", { enum: ["payment_gateway"] }).notNull().default("payment_gateway"),
  partnerId: text("partner_id").notNull().default(""),
  merchantId: text("merchant_id").notNull().default(""),
  subMerchantId: text("sub_merchant_id").notNull().default(""),
  externalStoreId: text("external_store_id").notNull().default(""),
  origin: text("origin").notNull().default(""),
  mcc: text("mcc").notNull().default(""),
  privateKeyEnc: text("private_key_enc"),
  danaPublicKeyEnc: text("dana_public_key_enc"),
  clientSecretEnc: text("client_secret_enc"),
  qrisEnabled: boolean("qris_enabled").notNull().default(false),
  disbursementEnabled: boolean("disbursement_enabled").notNull().default(false),
  merchantApproval: text("merchant_approval", { enum: ["not_started", "uat_in_progress", "approved", "rejected"] })
    .notNull()
    .default("not_started"),
  merchantApprovalNote: text("merchant_approval_note").notNull().default(""),
  lastValidatedAt: ts("last_validated_at"),
  lastValidation: jsonb("last_validation"),
  updatedBy: uuid("updated_by"),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const testRuns = pgTable(
  "test_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id"),
    category: text("category", { enum: ["local", "sandbox", "official"] }).notNull(),
    scenario: text("scenario").notNull(),
    status: text("status", { enum: ["PASSED", "FAILED", "RUNNING", "NOT_TESTED", "MANUAL"] }).notNull(),
    request: jsonb("request"),
    response: jsonb("response"),
    responseCode: text("response_code"),
    durationMs: integer("duration_ms"),
    error: text("error"),
    note: text("note"),
    evidenceUrl: text("evidence_url"),
    runBy: uuid("run_by"),
    createdAt: createdAt(),
    finishedAt: ts("finished_at"),
  },
  (t) => [index("test_runs_scenario_idx").on(t.category, t.scenario, t.createdAt)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    dedupeKey: text("dedupe_key"),
    status: text("status", { enum: ["queued", "running", "done", "failed"] }).notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(8),
    runAt: ts("run_at").notNull().defaultNow(),
    lockedAt: ts("locked_at"),
    lastError: text("last_error"),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [index("jobs_ready_idx").on(t.status, t.runAt), uniqueIndex("jobs_dedupe_uq").on(t.dedupeKey).where(sql`status in ('queued','running')`)],
);
