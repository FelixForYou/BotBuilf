-- Pengaman integritas keuangan di tingkat database.
-- 1) Ledger, audit log, dan event status bersifat append-only (tidak bisa UPDATE/DELETE).
-- 2) Setiap jurnal wajib seimbang (total debit = total kredit) saat COMMIT.

CREATE OR REPLACE FUNCTION fxb_forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabel % bersifat immutable: % tidak diizinkan', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER ledger_entries_immutable BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION fxb_forbid_mutation();
--> statement-breakpoint
CREATE TRIGGER ledger_journals_immutable BEFORE UPDATE OR DELETE ON ledger_journals
  FOR EACH ROW EXECUTE FUNCTION fxb_forbid_mutation();
--> statement-breakpoint
CREATE TRIGGER audit_logs_immutable BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION fxb_forbid_mutation();
--> statement-breakpoint
CREATE TRIGGER payment_events_immutable BEFORE UPDATE ON payment_events
  FOR EACH ROW EXECUTE FUNCTION fxb_forbid_mutation();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION fxb_check_journal_balanced() RETURNS trigger AS $$
DECLARE
  d numeric;
  c numeric;
  n integer;
BEGIN
  SELECT coalesce(sum(debit),0), coalesce(sum(credit),0), count(*) INTO d, c, n
    FROM ledger_entries WHERE journal_id = NEW.journal_id;
  IF n < 2 OR d <> c THEN
    RAISE EXCEPTION 'Jurnal % tidak seimbang (debit %, kredit %, entri %)', NEW.journal_id, d, c, n;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER ledger_entries_balanced AFTER INSERT ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fxb_check_journal_balanced();
--> statement-breakpoint
-- Cegah perubahan nilai uang inti pada pembayaran setelah dibuat.
CREATE OR REPLACE FUNCTION fxb_payment_amount_frozen() RETURNS trigger AS $$
BEGIN
  IF NEW.amount <> OLD.amount OR NEW.fee <> OLD.fee OR NEW.net <> OLD.net OR NEW.env <> OLD.env OR NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Nominal, env, dan pemilik pembayaran tidak boleh diubah';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER payments_amount_frozen BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION fxb_payment_amount_frozen();
