package com.agroconnect.unit;

import com.agroconnect.dto.response.RequestPhotoResponse;
import com.agroconnect.dto.response.ServiceRequestResponse;
import com.agroconnect.dto.response.ServiceRequestSummaryResponse;
import com.agroconnect.mapper.ServiceRequestMapper;
import com.agroconnect.model.RequestPhoto;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ServiceRequestMapperTest {

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    private User buildClient() {
        return User.builder().id(1L).build();
    }

    private ServiceCategory buildCategory() {
        return ServiceCategory.builder()
                .id(10L)
                .name("Lavoura")
                .slug("lavoura")
                .build();
    }

    private RequestPhoto buildPhoto(Long id, String url, int sortOrder, Instant uploadedAt) {
        return RequestPhoto.builder()
                .id(id)
                .photoUrl(url)
                .sortOrder(sortOrder)
                .uploadedAt(uploadedAt)
                .build();
    }

    @Test
    void toResponse_givenFullRequest_shouldMapAllFields() {
        Point location = GF.createPoint(new Coordinate(-27.2167, 38.6667));
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(86400);
        LocalDate dateFrom = LocalDate.of(2025, 7, 1);
        LocalDate dateTo = LocalDate.of(2025, 7, 15);
        RequestPhoto photo = buildPhoto(1L, "http://example.com/field.jpg", 0, now);

        ServiceRequest sr = ServiceRequest.builder()
                .id(50L)
                .client(buildClient())
                .category(buildCategory())
                .status(RequestStatus.PUBLISHED)
                .title("Lavoura de terreno")
                .description("Preciso de lavoura para 2 hectares")
                .location(location)
                .parish("Fajã de Baixo")
                .municipality("Ponta Delgada")
                .island("São Miguel")
                .area(2.0)
                .areaUnit("hectares")
                .urgency(Urgency.HIGH)
                .preferredDateFrom(dateFrom)
                .preferredDateTo(dateTo)
                .formData("{\"soilType\":\"clay\"}")
                .expiresAt(expiresAt)
                .photos(List.of(photo))
                .createdAt(now)
                .updatedAt(now)
                .build();

        ServiceRequestResponse response = ServiceRequestMapper.toResponse(sr, "Maria Santos", 3);

        assertEquals(50L, response.id());
        assertEquals(1L, response.clientId());
        assertEquals("Maria Santos", response.clientName());
        assertEquals(10L, response.categoryId());
        assertEquals("Lavoura", response.categoryName());
        assertEquals(RequestStatus.PUBLISHED, response.status());
        assertEquals("Lavoura de terreno", response.title());
        assertEquals("Preciso de lavoura para 2 hectares", response.description());
        assertEquals(38.6667, response.latitude(), 0.0001);
        assertEquals(-27.2167, response.longitude(), 0.0001);
        assertEquals("Fajã de Baixo", response.parish());
        assertEquals("Ponta Delgada", response.municipality());
        assertEquals("São Miguel", response.island());
        assertEquals(2.0, response.area());
        assertEquals("hectares", response.areaUnit());
        assertEquals(Urgency.HIGH, response.urgency());
        assertEquals(dateFrom, response.preferredDateFrom());
        assertEquals(dateTo, response.preferredDateTo());
        assertEquals("{\"soilType\":\"clay\"}", response.formData());
        assertEquals(expiresAt, response.expiresAt());
        assertEquals(1, response.photos().size());
        assertEquals(3, response.proposalCount());
        assertEquals(now, response.createdAt());
        assertEquals(now, response.updatedAt());
    }

    @Test
    void toResponse_givenNullLocation_shouldReturnNullLatLng() {
        Instant now = Instant.now();
        ServiceRequest sr = ServiceRequest.builder()
                .id(51L)
                .client(buildClient())
                .category(buildCategory())
                .status(RequestStatus.DRAFT)
                .title("Teste")
                .description("Descrição")
                .location(null)
                .photos(List.of())
                .createdAt(now)
                .updatedAt(now)
                .build();

        ServiceRequestResponse response = ServiceRequestMapper.toResponse(sr, "Cliente Teste", 0);

        assertNull(response.latitude());
        assertNull(response.longitude());
    }

    @Test
    void toResponse_givenNullPhotos_shouldReturnEmptyList() {
        Instant now = Instant.now();
        Point location = GF.createPoint(new Coordinate(-27.0, 38.0));
        ServiceRequest sr = ServiceRequest.builder()
                .id(52L)
                .client(buildClient())
                .category(buildCategory())
                .status(RequestStatus.DRAFT)
                .title("Teste")
                .description("Descrição")
                .location(location)
                .photos(null)
                .createdAt(now)
                .updatedAt(now)
                .build();

        ServiceRequestResponse response = ServiceRequestMapper.toResponse(sr, "Cliente Teste", 0);

        assertNotNull(response.photos());
        assertTrue(response.photos().isEmpty());
    }

    @Test
    void toSummaryResponse_shouldMapSummaryFields() {
        Instant now = Instant.now();
        ServiceRequest sr = ServiceRequest.builder()
                .id(60L)
                .client(buildClient())
                .category(buildCategory())
                .status(RequestStatus.WITH_PROPOSALS)
                .title("Pulverização de vinha")
                .description("Descrição detalhada")
                .parish("Ribeira Grande")
                .municipality("Ribeira Grande")
                .island("São Miguel")
                .area(5.0)
                .areaUnit("hectares")
                .urgency(Urgency.LOW)
                .createdAt(now)
                .updatedAt(now)
                .build();

        ServiceRequestSummaryResponse response = ServiceRequestMapper.toSummaryResponse(sr, 2);

        assertEquals(60L, response.id());
        assertEquals("Lavoura", response.categoryName());
        assertEquals(RequestStatus.WITH_PROPOSALS, response.status());
        assertEquals("Pulverização de vinha", response.title());
        assertEquals("Ribeira Grande", response.parish());
        assertEquals("Ribeira Grande", response.municipality());
        assertEquals("São Miguel", response.island());
        assertEquals(5.0, response.area());
        assertEquals("hectares", response.areaUnit());
        assertEquals(Urgency.LOW, response.urgency());
        assertEquals(2, response.proposalCount());
        assertEquals(now, response.createdAt());
    }

    @Test
    void toPhotoResponse_shouldMapPhotoFields() {
        Instant uploadedAt = Instant.now();
        RequestPhoto photo = RequestPhoto.builder()
                .id(7L)
                .photoUrl("http://minio.local/photos/field-01.jpg")
                .sortOrder(2)
                .uploadedAt(uploadedAt)
                .build();

        RequestPhotoResponse response = ServiceRequestMapper.toPhotoResponse(photo);

        assertEquals(7L, response.id());
        assertEquals("http://minio.local/photos/field-01.jpg", response.photoUrl());
        assertEquals(2, response.sortOrder());
        assertEquals(uploadedAt, response.uploadedAt());
    }
}
