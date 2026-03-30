package com.agroconnect.unit;

import com.agroconnect.dto.response.ExecutionAssignmentResponse;
import com.agroconnect.dto.response.ExecutionPhotoResponse;
import com.agroconnect.dto.response.ServiceExecutionResponse;
import com.agroconnect.mapper.ExecutionMapper;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.ExecutionPhoto;
import com.agroconnect.model.Machine;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.enums.TeamMemberRole;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExecutionMapperTest {

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    private ServiceRequest buildRequest() {
        return ServiceRequest.builder().id(100L).build();
    }

    private Proposal buildProposal() {
        return Proposal.builder().id(10L).request(buildRequest()).build();
    }

    private TeamMember buildTeamMember() {
        return TeamMember.builder()
                .id(5L)
                .name("João Silva")
                .role(TeamMemberRole.OPERATOR)
                .build();
    }

    private Machine buildMachine() {
        return Machine.builder()
                .id(3L)
                .name("Trator John Deere")
                .build();
    }

    @Test
    void toResponse_givenFullExecution_shouldMapAllFields() {
        Point checkinPoint = GF.createPoint(new Coordinate(-27.2167, 38.6667));
        Instant now = Instant.now();
        LocalDate scheduledDate = LocalDate.of(2025, 6, 1);
        LocalDate scheduledEndDate = LocalDate.of(2025, 6, 2);

        ExecutionAssignment assignment = ExecutionAssignment.builder()
                .id(1L)
                .teamMember(buildTeamMember())
                .machine(buildMachine())
                .assignedAt(now)
                .build();

        ExecutionPhoto photo = ExecutionPhoto.builder()
                .id(1L)
                .photoUrl("http://example.com/photo.jpg")
                .location(checkinPoint)
                .takenAt(now)
                .uploadedAt(now)
                .build();

        ServiceExecution exec = ServiceExecution.builder()
                .id(1L)
                .proposal(buildProposal())
                .scheduledDate(scheduledDate)
                .scheduledEndDate(scheduledEndDate)
                .checkinLocation(checkinPoint)
                .checkinTime(now)
                .checkoutTime(now)
                .notes("test notes")
                .materialsUsed("water")
                .completedAt(now)
                .createdAt(now)
                .assignments(Set.of(assignment))
                .photos(Set.of(photo))
                .build();

        ServiceExecutionResponse response = ExecutionMapper.toResponse(exec);

        assertEquals(1L, response.id());
        assertEquals(10L, response.proposalId());
        assertEquals(100L, response.requestId());
        assertEquals(scheduledDate, response.scheduledDate());
        assertEquals(scheduledEndDate, response.scheduledEndDate());
        assertEquals(38.6667, response.checkinLatitude(), 0.0001);
        assertEquals(-27.2167, response.checkinLongitude(), 0.0001);
        assertEquals(now, response.checkinTime());
        assertEquals(now, response.checkoutTime());
        assertEquals("test notes", response.notes());
        assertEquals("water", response.materialsUsed());
        assertEquals(now, response.completedAt());
        assertEquals(now, response.createdAt());
        assertEquals(1, response.assignments().size());
        assertEquals(1, response.photos().size());
    }

    @Test
    void toResponse_givenNullCheckinLocation_shouldReturnNullLatLng() {
        ServiceExecution exec = ServiceExecution.builder()
                .id(2L)
                .proposal(buildProposal())
                .checkinLocation(null)
                .assignments(Set.of())
                .photos(Set.of())
                .build();

        ServiceExecutionResponse response = ExecutionMapper.toResponse(exec);

        assertNull(response.checkinLatitude());
        assertNull(response.checkinLongitude());
    }

    @Test
    void toResponse_givenNullAssignments_shouldReturnEmptyList() {
        ServiceExecution exec = ServiceExecution.builder()
                .id(3L)
                .proposal(buildProposal())
                .assignments(null)
                .photos(Set.of())
                .build();

        ServiceExecutionResponse response = ExecutionMapper.toResponse(exec);

        assertNotNull(response.assignments());
        assertTrue(response.assignments().isEmpty());
    }

    @Test
    void toResponse_givenNullPhotos_shouldReturnEmptyList() {
        ServiceExecution exec = ServiceExecution.builder()
                .id(4L)
                .proposal(buildProposal())
                .assignments(Set.of())
                .photos(null)
                .build();

        ServiceExecutionResponse response = ExecutionMapper.toResponse(exec);

        assertNotNull(response.photos());
        assertTrue(response.photos().isEmpty());
    }

    @Test
    void toAssignmentResponse_givenAssignmentWithMachine_shouldMapMachineFields() {
        Instant assignedAt = Instant.now();
        ExecutionAssignment assignment = ExecutionAssignment.builder()
                .id(1L)
                .teamMember(buildTeamMember())
                .machine(buildMachine())
                .assignedAt(assignedAt)
                .build();

        ExecutionAssignmentResponse response = ExecutionMapper.toAssignmentResponse(assignment);

        assertEquals(1L, response.id());
        assertEquals(5L, response.teamMemberId());
        assertEquals("João Silva", response.teamMemberName());
        assertEquals("OPERATOR", response.teamMemberRole());
        assertEquals(3L, response.machineId());
        assertEquals("Trator John Deere", response.machineName());
        assertEquals(assignedAt, response.assignedAt());
    }

    @Test
    void toAssignmentResponse_givenAssignmentWithoutMachine_shouldReturnNullMachineFields() {
        Instant assignedAt = Instant.now();
        ExecutionAssignment assignment = ExecutionAssignment.builder()
                .id(2L)
                .teamMember(buildTeamMember())
                .machine(null)
                .assignedAt(assignedAt)
                .build();

        ExecutionAssignmentResponse response = ExecutionMapper.toAssignmentResponse(assignment);

        assertEquals(2L, response.id());
        assertEquals(5L, response.teamMemberId());
        assertEquals("João Silva", response.teamMemberName());
        assertEquals("OPERATOR", response.teamMemberRole());
        assertNull(response.machineId());
        assertNull(response.machineName());
    }

    @Test
    void toPhotoResponse_givenPhotoWithLocation_shouldMapLatLng() {
        Point location = GF.createPoint(new Coordinate(-25.6700, 37.7400));
        Instant takenAt = Instant.now();
        Instant uploadedAt = Instant.now();

        ExecutionPhoto photo = ExecutionPhoto.builder()
                .id(1L)
                .photoUrl("http://example.com/photo.jpg")
                .location(location)
                .takenAt(takenAt)
                .uploadedAt(uploadedAt)
                .build();

        ExecutionPhotoResponse response = ExecutionMapper.toPhotoResponse(photo);

        assertEquals(1L, response.id());
        assertEquals("http://example.com/photo.jpg", response.photoUrl());
        assertEquals(37.7400, response.latitude(), 0.0001);
        assertEquals(-25.6700, response.longitude(), 0.0001);
        assertEquals(takenAt, response.takenAt());
        assertEquals(uploadedAt, response.uploadedAt());
    }

    @Test
    void toPhotoResponse_givenPhotoWithoutLocation_shouldReturnNullLatLng() {
        Instant takenAt = Instant.now();
        Instant uploadedAt = Instant.now();

        ExecutionPhoto photo = ExecutionPhoto.builder()
                .id(2L)
                .photoUrl("http://example.com/photo2.jpg")
                .location(null)
                .takenAt(takenAt)
                .uploadedAt(uploadedAt)
                .build();

        ExecutionPhotoResponse response = ExecutionMapper.toPhotoResponse(photo);

        assertEquals(2L, response.id());
        assertNull(response.latitude());
        assertNull(response.longitude());
    }
}
