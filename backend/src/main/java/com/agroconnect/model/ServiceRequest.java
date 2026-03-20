package com.agroconnect.model;

import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_requests", indexes = {
        @Index(name = "idx_requests_client", columnList = "client_id"),
        @Index(name = "idx_requests_category", columnList = "category_id"),
        @Index(name = "idx_requests_status", columnList = "status"),
        @Index(name = "idx_requests_created_at", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ServiceCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private RequestStatus status = RequestStatus.DRAFT;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "location", nullable = false, columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Column(name = "parish", length = 255)
    private String parish;

    @Column(name = "municipality", length = 255)
    private String municipality;

    @Column(name = "island", length = 100)
    private String island;

    @Column(name = "area")
    private Double area;

    @Column(name = "area_unit", length = 20)
    @Builder.Default
    private String areaUnit = "hectares";

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency", nullable = false, length = 10)
    @Builder.Default
    private Urgency urgency = Urgency.MEDIUM;

    @Column(name = "preferred_date_from")
    private LocalDate preferredDateFrom;

    @Column(name = "preferred_date_to")
    private LocalDate preferredDateTo;

    @Column(name = "form_data", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String formData;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @OneToMany(mappedBy = "request", cascade = CascadeType.PERSIST, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<RequestPhoto> photos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
