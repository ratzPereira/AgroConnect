package com.agroconnect.mapper;

import com.agroconnect.dto.response.ExecutionAssignmentResponse;
import com.agroconnect.dto.response.ExecutionPhotoResponse;
import com.agroconnect.dto.response.ServiceExecutionResponse;
import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.ExecutionPhoto;
import com.agroconnect.model.ServiceExecution;

import java.util.List;

public final class ExecutionMapper {

    private ExecutionMapper() {}

    public static ServiceExecutionResponse toResponse(ServiceExecution exec) {
        Double checkinLat = null;
        Double checkinLng = null;
        if (exec.getCheckinLocation() != null) {
            checkinLat = exec.getCheckinLocation().getY();
            checkinLng = exec.getCheckinLocation().getX();
        }

        List<ExecutionAssignmentResponse> assignments = exec.getAssignments() != null
                ? exec.getAssignments().stream().map(ExecutionMapper::toAssignmentResponse).toList()
                : List.of();

        List<ExecutionPhotoResponse> photos = exec.getPhotos() != null
                ? exec.getPhotos().stream().map(ExecutionMapper::toPhotoResponse).toList()
                : List.of();

        return new ServiceExecutionResponse(
                exec.getId(),
                exec.getProposal().getId(),
                exec.getProposal().getRequest().getId(),
                checkinLat,
                checkinLng,
                exec.getCheckinTime(),
                exec.getCheckoutTime(),
                exec.getNotes(),
                exec.getMaterialsUsed(),
                exec.getCompletedAt(),
                exec.getCreatedAt(),
                assignments,
                photos
        );
    }

    public static ExecutionAssignmentResponse toAssignmentResponse(ExecutionAssignment assignment) {
        return new ExecutionAssignmentResponse(
                assignment.getId(),
                assignment.getTeamMember().getId(),
                assignment.getTeamMember().getName(),
                assignment.getTeamMember().getRole().name(),
                assignment.getMachine() != null ? assignment.getMachine().getId() : null,
                assignment.getMachine() != null ? assignment.getMachine().getName() : null,
                assignment.getAssignedAt()
        );
    }

    public static ExecutionPhotoResponse toPhotoResponse(ExecutionPhoto photo) {
        Double lat = null;
        Double lng = null;
        if (photo.getLocation() != null) {
            lat = photo.getLocation().getY();
            lng = photo.getLocation().getX();
        }

        return new ExecutionPhotoResponse(
                photo.getId(),
                photo.getPhotoUrl(),
                lat,
                lng,
                photo.getTakenAt(),
                photo.getUploadedAt()
        );
    }
}
