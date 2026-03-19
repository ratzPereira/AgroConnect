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
@Table(name = "client_profiles", indexes = {
        @Index(name = "idx_client_profiles_user_id", columnList = "user_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

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

    @Column(name = "farm_type", length = 100)
    private String farmType;

    @Column(name = "total_area_ha")
    private Double totalAreaHa;

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    @Column(name = "bio", length = 1000)
    private String bio;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
