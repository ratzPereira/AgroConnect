package com.agroconnect.model.enums;

/**
 * Type of an inventory ledger movement. Movements are immutable once created;
 * reversals are modeled as compensating movements (ADJUSTMENT_IN) so the audit
 * trail is preserved.
 */
public enum MovementType {
    /** Backfilled opening balance for items that existed before V31. */
    INITIAL,
    /** Provider bought stock; recomputes weighted-average cost. */
    PURCHASE,
    /** Stock was consumed by a service execution; preserves WAC. */
    CONSUMPTION,
    /** Manual addition (correction, gift, found stock). Optional unit cost. */
    ADJUSTMENT_IN,
    /** Manual removal (spoilage, theft, write-off). Preserves WAC. */
    ADJUSTMENT_OUT
}
