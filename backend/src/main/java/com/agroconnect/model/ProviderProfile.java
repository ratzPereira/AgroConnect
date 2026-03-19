package com.agroconnect.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.Instant;

@Entity
@Table(name = "provider_profiles", indexes = {
        @Index(name = "idx_provider_profiles_user_id", columnList = "user_id"),
        @Index(name = "idx_provider_profiles_nif", columnList = "nif")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(name = "nif", nullable = false, unique = true, length = 20)
    private String nif;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "location", columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Column(name = "parish", length = 255)
    private String parish;

    @Column(name = "municipality", length = 255)
    private String municipality;

    @Column(name = "island", length = 100)
    private String island;

    @Column(name = "service_radius_km", nullable = false)
    @Builder.Default
    private double serviceRadiusKm = 25;

    @Column(name = "avg_rating", nullable = false)
    @Builder.Default
    private double avgRating = 0;

    @Column(name = "total_reviews", nullable = false)
    @Builder.Default
    private int totalReviews = 0;

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    @Column(name = "bio", length = 1000)
    private String bio;

    @Column(name = "verified", nullable = false)
    @Builder.Default
    private boolean verified = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
