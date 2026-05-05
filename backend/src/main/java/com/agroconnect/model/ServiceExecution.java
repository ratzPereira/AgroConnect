package com.agroconnect.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "service_executions", indexes = {
        @Index(name = "idx_executions_proposal", columnList = "proposal_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false, unique = true)
    private Proposal proposal;

    @Column(name = "checkin_location", columnDefinition = "geometry(Point, 4326)")
    private Point checkinLocation;

    @Column(name = "checkin_time")
    private Instant checkinTime;

    @Column(name = "checkout_time")
    private Instant checkoutTime;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "materials_used", columnDefinition = "text")
    private String materialsUsed;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "scheduled_end_date")
    private LocalDate scheduledEndDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "execution", cascade = CascadeType.PERSIST)
    @Builder.Default
    private Set<ExecutionAssignment> assignments = new HashSet<>();

    @OneToMany(mappedBy = "execution", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @Builder.Default
    private Set<ExecutionPhoto> photos = new HashSet<>();
}
