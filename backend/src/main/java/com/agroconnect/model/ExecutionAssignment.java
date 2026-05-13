package com.agroconnect.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "execution_assignments",
        uniqueConstraints = @UniqueConstraint(name = "uq_execution_member",
                columnNames = {"execution_id", "team_member_id"}),
        indexes = {
                @Index(name = "idx_exec_assignments_execution", columnList = "execution_id"),
                @Index(name = "idx_exec_assignments_member", columnList = "team_member_id")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    private ServiceExecution execution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_member_id", nullable = false)
    private TeamMember teamMember;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id")
    private Machine machine;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;

    @Column(name = "hours_worked", precision = 6, scale = 2)
    private BigDecimal hoursWorked;

    @Column(name = "machine_hours", precision = 6, scale = 2)
    private BigDecimal machineHours;

    // Snapshotted from teamMember.hourlyRate when execution is completed
    // so historical labor cost is immutable to later rate edits.
    @Column(name = "hourly_rate_snapshot", precision = 8, scale = 2)
    private BigDecimal hourlyRateSnapshot;
}
