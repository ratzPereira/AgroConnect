package com.agroconnect.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Pure arithmetic helpers for inventory accounting.
 *
 * <p>All public methods are deterministic and side-effect free; they take
 * the inputs they need and return the result. Scale conventions match the
 * database column definitions:
 * <ul>
 *   <li>quantity, alert threshold: {@code NUMERIC(14,3)} → scale 3</li>
 *   <li>unit cost, weighted-average cost: {@code NUMERIC(10,4)} → scale 4</li>
 * </ul>
 */
public final class InventoryMath {

    /** Scale for quantities (matches NUMERIC(14,3) columns). */
    public static final int QTY_SCALE = 3;

    /** Scale for monetary unit values (matches NUMERIC(10,4) columns). */
    public static final int COST_SCALE = 4;

    /** Computation precision (more than the column scales to absorb rounding). */
    public static final MathContext MC = MathContext.DECIMAL64;

    private InventoryMath() {}

    /**
     * Recomputes the weighted-average cost after an inbound movement.
     *
     * <pre>
     *   newWac = (oldQty * oldWac + addedQty * addedUnitCost) / (oldQty + addedQty)
     * </pre>
     *
     * @param oldQty         current stock quantity (≥ 0)
     * @param oldWac         current weighted-average cost (≥ 0); null is treated as zero
     *                       to absorb legacy rows where cost_per_unit was never set
     * @param addedQty       quantity being added (> 0)
     * @param addedUnitCost  unit cost paid for the new batch (≥ 0)
     * @return the new weighted-average cost rounded to {@link #COST_SCALE} (HALF_UP);
     *         when {@code oldQty + addedQty} is zero the added unit cost is returned
     *         (the only sensible answer — division would be undefined)
     */
    public static BigDecimal newWeightedAverageCost(BigDecimal oldQty,
                                                    BigDecimal oldWac,
                                                    BigDecimal addedQty,
                                                    BigDecimal addedUnitCost) {
        BigDecimal safeOldWac = oldWac != null ? oldWac : BigDecimal.ZERO;
        BigDecimal denominator = oldQty.add(addedQty, MC);
        if (denominator.signum() == 0) {
            return addedUnitCost.setScale(COST_SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal numerator = oldQty.multiply(safeOldWac, MC)
                .add(addedQty.multiply(addedUnitCost, MC), MC);
        return numerator.divide(denominator, COST_SCALE, RoundingMode.HALF_UP);
    }

    /** Normalizes a quantity to the canonical {@link #QTY_SCALE}. */
    public static BigDecimal toQty(BigDecimal value) {
        return value.setScale(QTY_SCALE, RoundingMode.HALF_UP);
    }

    /** Normalizes a unit cost / WAC to the canonical {@link #COST_SCALE}. */
    public static BigDecimal toCost(BigDecimal value) {
        return value.setScale(COST_SCALE, RoundingMode.HALF_UP);
    }
}
