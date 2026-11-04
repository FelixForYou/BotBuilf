CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"env" text NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"rotated_from" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_email" text DEFAULT 'system' NOT NULL,
	"action" text NOT NULL,
	"target_type" text DEFAULT '' NOT NULL,
	"target_id" text DEFAULT '' NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"status_code" integer,
	"response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedupe_key" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 8 NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env" text NOT NULL,
	"kind" text NOT NULL,
	"owner_user_id" uuid,
	"normal_side" text NOT NULL,
	"allow_negative" boolean DEFAULT false NOT NULL,
	"balance" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_accounts_nonneg" CHECK ("ledger_accounts"."allow_negative" OR "ledger_accounts"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"journal_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit" bigint DEFAULT 0 NOT NULL,
	"credit" bigint DEFAULT 0 NOT NULL,
	"balance_after" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_one_side" CHECK (("ledger_entries"."debit" > 0 AND "ledger_entries"."credit" = 0) OR ("ledger_entries"."credit" > 0 AND "ledger_entries"."debit" = 0))
);
--> statement-breakpoint
CREATE TABLE "ledger_journals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env" text NOT NULL,
	"type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" text NOT NULL,
	"memo" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"success" boolean NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"audience" text DEFAULT 'user' NOT NULL,
	"env" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"payment_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"source" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"env" text NOT NULL,
	"provider" text NOT NULL,
	"purpose" text DEFAULT 'payment' NOT NULL,
	"partner_reference_no" text NOT NULL,
	"order_ref" text DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"customer_name" text DEFAULT '' NOT NULL,
	"customer_email" text DEFAULT '' NOT NULL,
	"amount" bigint NOT NULL,
	"fee" bigint NOT NULL,
	"net" bigint NOT NULL,
	"fee_bearer" text DEFAULT 'merchant' NOT NULL,
	"base_amount" bigint NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"status" text DEFAULT 'CREATED' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"provider_reference_no" text,
	"provider_redirect_url" text,
	"provider_payment_code" text,
	"provider_status" text,
	"payment_method" text DEFAULT 'redirect' NOT NULL,
	"paid_at" timestamp with time zone,
	"late_callback" boolean DEFAULT false NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"review_reason" text,
	"refunded_amount" bigint DEFAULT 0 NOT NULL,
	"captured_journal_id" uuid,
	"held_until" timestamp with time zone,
	"released_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	"settlement_id" uuid,
	"idempotency_key" text,
	"created_via" text DEFAULT 'dashboard' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amounts" CHECK ("payments"."amount" > 0 AND "payments"."fee" >= 0 AND "payments"."net" >= 0 AND "payments"."net" + "payments"."fee" = "payments"."amount"),
	CONSTRAINT "payments_refund_le" CHECK ("payments"."refunded_amount" >= 0 AND "payments"."refunded_amount" <= "payments"."amount")
);
--> statement-breakpoint
CREATE TABLE "provider_configs" (
	"env" text PRIMARY KEY NOT NULL,
	"product" text DEFAULT 'payment_gateway' NOT NULL,
	"partner_id" text DEFAULT '' NOT NULL,
	"merchant_id" text DEFAULT '' NOT NULL,
	"sub_merchant_id" text DEFAULT '' NOT NULL,
	"external_store_id" text DEFAULT '' NOT NULL,
	"origin" text DEFAULT '' NOT NULL,
	"mcc" text DEFAULT '' NOT NULL,
	"private_key_enc" text,
	"dana_public_key_enc" text,
	"client_secret_enc" text,
	"qris_enabled" boolean DEFAULT false NOT NULL,
	"disbursement_enabled" boolean DEFAULT false NOT NULL,
	"merchant_approval" text DEFAULT 'not_started' NOT NULL,
	"merchant_approval_note" text DEFAULT '' NOT NULL,
	"last_validated_at" timestamp with time zone,
	"last_validation" jsonb,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env" text NOT NULL,
	"provider" text DEFAULT 'dana' NOT NULL,
	"path" text NOT NULL,
	"headers" jsonb NOT NULL,
	"body" text NOT NULL,
	"body_hash" text NOT NULL,
	"signature_valid" boolean NOT NULL,
	"verified_with" text,
	"partner_reference_no" text,
	"payment_id" uuid,
	"outcome" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reconciliation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env" text NOT NULL,
	"status" text NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"mismatches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"env" text NOT NULL,
	"amount" bigint NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"partner_refund_no" text NOT NULL,
	"provider_refund_no" text,
	"provider_response_code" text,
	"failure_reason" text,
	"requested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_amount_pos" CHECK ("refunds"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"mfa_passed" boolean DEFAULT false NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"env" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"expected_amount" bigint NOT NULL,
	"received_amount" bigint NOT NULL,
	"payment_count" integer NOT NULL,
	"bank_reference" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"journal_id" uuid,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid,
	"category" text NOT NULL,
	"scenario" text NOT NULL,
	"status" text NOT NULL,
	"request" jsonb,
	"response" jsonb,
	"response_code" text,
	"duration_ms" integer,
	"error" text,
	"note" text,
	"evidence_url" text,
	"run_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"store_name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"frozen_reason" text,
	"email_verified_at" timestamp with time zone,
	"totp_secret_enc" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"totp_last_step" bigint,
	"onboarded_at" timestamp with time zone,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"env" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_response_code" integer,
	"last_error" text,
	"next_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"env" text NOT NULL,
	"url" text NOT NULL,
	"secret_enc" text NOT NULL,
	"events" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawal_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"withdrawal_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_id" uuid,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"env" text NOT NULL,
	"amount" bigint NOT NULL,
	"fee" bigint NOT NULL,
	"net" bigint NOT NULL,
	"destination_type" text NOT NULL,
	"destination_bank" text DEFAULT '' NOT NULL,
	"destination_account" text NOT NULL,
	"destination_name" text NOT NULL,
	"status" text DEFAULT 'PENDING_REVIEW' NOT NULL,
	"method" text DEFAULT 'manual' NOT NULL,
	"reject_reason" text,
	"proof_reference" text,
	"proof_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "withdrawals_amounts" CHECK ("withdrawals"."amount" > 0 AND "withdrawals"."fee" >= 0 AND "withdrawals"."net" > 0 AND "withdrawals"."net" + "withdrawals"."fee" = "withdrawals"."amount")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journal_id_ledger_journals_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."ledger_journals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_events" ADD CONSTRAINT "withdrawal_events_withdrawal_id_withdrawals_id_fk" FOREIGN KEY ("withdrawal_id") REFERENCES "public"."withdrawals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_hash_uq" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_user_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_hash_uq" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_scope_key_uq" ON "idempotency_records" USING btree ("scope","key");--> statement-breakpoint
CREATE INDEX "jobs_ready_idx" ON "jobs" USING btree ("status","run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_dedupe_uq" ON "jobs" USING btree ("dedupe_key") WHERE status in ('queued','running');--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_accounts_uq" ON "ledger_accounts" USING btree ("env","kind",coalesce("owner_user_id", '00000000-0000-0000-0000-000000000000'::uuid));--> statement-breakpoint
CREATE INDEX "ledger_entries_account_idx" ON "ledger_entries" USING btree ("account_id","id");--> statement-breakpoint
CREATE INDEX "ledger_entries_journal_idx" ON "ledger_entries" USING btree ("journal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_journals_idem_uq" ON "ledger_journals" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "ledger_journals_ref_idx" ON "ledger_journals" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "login_events_user_idx" ON "login_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_events_payment_idx" ON "payment_events" USING btree ("payment_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_public_uq" ON "payments" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_partner_ref_uq" ON "payments" USING btree ("env","partner_reference_no");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idem_uq" ON "payments" USING btree ("user_id","env","idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "payments" USING btree ("user_id","env","created_at");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("env","status");--> statement-breakpoint
CREATE INDEX "provider_notifications_env_idx" ON "provider_notifications" USING btree ("env","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_partner_no_uq" ON "refunds" USING btree ("partner_refund_no");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_uq" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_runs_scenario_idx" ON "test_runs" USING btree ("category","scenario","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "webhook_deliveries_user_idx" ON "webhook_deliveries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawals_idem_uq" ON "withdrawals" USING btree ("user_id","env","idempotency_key");--> statement-breakpoint
CREATE INDEX "withdrawals_status_idx" ON "withdrawals" USING btree ("env","status");