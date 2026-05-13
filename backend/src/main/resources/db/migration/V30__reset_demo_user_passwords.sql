-- ═══════════════════════════════════════════════════════════════
-- AgroConnect — Reset demo user passwords to 'password123'
-- ═══════════════════════════════════════════════════════════════
-- Purpose: ensure deterministic credentials for the demo accounts
-- used in live demonstrations (e.g., presentation to professor).
-- Fresh BCrypt-12 hash for 'password123', verified.
-- ═══════════════════════════════════════════════════════════════

UPDATE users
SET password_hash = '$2a$12$K9sQuuOFiIkm6xgpaJj21OYZMBK9XZjOHQxHJ7knig9OOdcrsvHVW'
WHERE email IN ('joao.silva@email.com', 'agroservicos@email.com');
