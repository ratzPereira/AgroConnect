package com.agroconnect.unit;

import com.agroconnect.service.InventoryMath;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InventoryMathTest {

    @Test
    void newWeightedAverageCost_givenEmptyStock_shouldReturnAddedUnitCost() {
        BigDecimal wac = InventoryMath.newWeightedAverageCost(
                new BigDecimal("0.000"), new BigDecimal("0.0000"),
                new BigDecimal("100.000"), new BigDecimal("2.5000"));

        assertEquals(new BigDecimal("2.5000"), wac);
    }

    @Test
    void newWeightedAverageCost_givenSamePrice_shouldKeepWac() {
        BigDecimal wac = InventoryMath.newWeightedAverageCost(
                new BigDecimal("50.000"), new BigDecimal("1.2000"),
                new BigDecimal("50.000"), new BigDecimal("1.2000"));

        assertEquals(new BigDecimal("1.2000"), wac);
    }

    @Test
    void newWeightedAverageCost_givenHigherPriceBatch_shouldRaiseWac() {
        // 100 @ 1.0000 + 100 @ 2.0000 = 200 @ 1.5000
        BigDecimal wac = InventoryMath.newWeightedAverageCost(
                new BigDecimal("100.000"), new BigDecimal("1.0000"),
                new BigDecimal("100.000"), new BigDecimal("2.0000"));

        assertEquals(new BigDecimal("1.5000"), wac);
    }

    @Test
    void newWeightedAverageCost_givenLowerPriceBatch_shouldLowerWac() {
        // 200 @ 1.5000 + 100 @ 0.6000 = 300 → (300 + 60) / 300 = 1.2000
        BigDecimal wac = InventoryMath.newWeightedAverageCost(
                new BigDecimal("200.000"), new BigDecimal("1.5000"),
                new BigDecimal("100.000"), new BigDecimal("0.6000"));

        assertEquals(new BigDecimal("1.2000"), wac);
    }

    @Test
    void newWeightedAverageCost_givenRecurringDecimal_shouldRoundHalfUpToFourScale() {
        // 1 @ 1.0000 + 2 @ 2.0000 = 3 @ (1 + 4) / 3 = 1.6666...
        BigDecimal wac = InventoryMath.newWeightedAverageCost(
                BigDecimal.ONE, BigDecimal.ONE,
                new BigDecimal("2"), new BigDecimal("2"));

        assertEquals(new BigDecimal("1.6667"), wac);
    }

    @Test
    void toQty_shouldRoundToThreeDecimals() {
        assertEquals(new BigDecimal("12.346"), InventoryMath.toQty(new BigDecimal("12.3456")));
    }

    @Test
    void toCost_shouldRoundToFourDecimals() {
        assertEquals(new BigDecimal("0.1235"), InventoryMath.toCost(new BigDecimal("0.12345")));
    }

    @Test
    void newWeightedAverageCost_givenNullOldWac_shouldTreatAsZero() {
        // legacy row with cost_per_unit = NULL: must not NPE
        BigDecimal wac = InventoryMath.newWeightedAverageCost(
                new BigDecimal("10.000"), null,
                new BigDecimal("20.000"), new BigDecimal("3.0000"));
        // (10*0 + 20*3) / 30 = 60/30 = 2.0000
        assertEquals(new BigDecimal("2.0000"), wac);
    }

    @Test
    void newWeightedAverageCost_givenZeroDenominator_shouldReturnAddedUnitCost() {
        // both old and added quantities are zero — divide-by-zero edge case.
        // The only sensible answer is the added unit cost.
        BigDecimal wac = InventoryMath.newWeightedAverageCost(
                BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("4.2500"));
        assertEquals(new BigDecimal("4.2500"), wac);
    }
}
