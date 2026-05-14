package com.agroconnect.unit;

import com.agroconnect.dto.response.CalendarAlertsResponse;
import com.agroconnect.dto.response.CalendarAlertsResponse.ConflictAlert;
import com.agroconnect.dto.response.CalendarAlertsResponse.MaintenanceAlert;
import com.agroconnect.dto.response.CalendarAlertsResponse.PaymentAlert;
import com.agroconnect.dto.response.CalendarAlertsResponse.ProposalAlert;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CalendarAlertsResponseTest {

    @Test
    void conflictAlert_shouldExposeAllAccessors() {
        ConflictAlert alert = new ConflictAlert(
                LocalDate.of(2026, 5, 1), "TEAM_MEMBER", 42L, "Maria Costa", 3);

        assertThat(alert.date()).isEqualTo(LocalDate.of(2026, 5, 1));
        assertThat(alert.resourceType()).isEqualTo("TEAM_MEMBER");
        assertThat(alert.resourceId()).isEqualTo(42L);
        assertThat(alert.resourceName()).isEqualTo("Maria Costa");
        assertThat(alert.overlappingCount()).isEqualTo(3);
    }

    @Test
    void maintenanceAlert_shouldExposeAllAccessors() {
        MaintenanceAlert alert = new MaintenanceAlert(
                10L, 20L, "Tractor John Deere", LocalDate.of(2026, 5, 15), "Oil change");

        assertThat(alert.maintenanceLogId()).isEqualTo(10L);
        assertThat(alert.machineId()).isEqualTo(20L);
        assertThat(alert.machineName()).isEqualTo("Tractor John Deere");
        assertThat(alert.dueDate()).isEqualTo(LocalDate.of(2026, 5, 15));
        assertThat(alert.description()).isEqualTo("Oil change");
    }

    @Test
    void paymentAlert_shouldExposeAllAccessors() {
        PaymentAlert alert = new PaymentAlert(
                500L, "Lavoura terreno A", LocalDate.of(2026, 4, 20), 7);

        assertThat(alert.executionId()).isEqualTo(500L);
        assertThat(alert.requestTitle()).isEqualTo("Lavoura terreno A");
        assertThat(alert.completedOn()).isEqualTo(LocalDate.of(2026, 4, 20));
        assertThat(alert.daysAwaiting()).isEqualTo(7);
    }

    @Test
    void proposalAlert_shouldExposeAllAccessors() {
        ProposalAlert alert = new ProposalAlert(
                88L, "Pulverização vinha", 4, LocalDate.of(2026, 4, 25));

        assertThat(alert.requestId()).isEqualTo(88L);
        assertThat(alert.requestTitle()).isEqualTo("Pulverização vinha");
        assertThat(alert.competingProposals()).isEqualTo(4);
        assertThat(alert.submittedOn()).isEqualTo(LocalDate.of(2026, 4, 25));
    }

    @Test
    void response_shouldExposeAllAccessors() {
        List<ConflictAlert> conflicts = List.of(
                new ConflictAlert(LocalDate.of(2026, 5, 1), "MACHINE", 1L, "Trator", 2));
        List<MaintenanceAlert> maintenance = List.of(
                new MaintenanceAlert(1L, 2L, "Trator", LocalDate.of(2026, 5, 10), "Filter"));
        List<PaymentAlert> payments = List.of(
                new PaymentAlert(99L, "Job X", LocalDate.of(2026, 4, 18), 9));
        List<ProposalAlert> proposals = List.of(
                new ProposalAlert(7L, "Job Y", 2, LocalDate.of(2026, 4, 27)));

        CalendarAlertsResponse response = new CalendarAlertsResponse(
                conflicts, maintenance, payments, proposals);

        assertThat(response.conflicts()).isEqualTo(conflicts);
        assertThat(response.maintenance()).isEqualTo(maintenance);
        assertThat(response.payments()).isEqualTo(payments);
        assertThat(response.proposals()).isEqualTo(proposals);
    }
}
