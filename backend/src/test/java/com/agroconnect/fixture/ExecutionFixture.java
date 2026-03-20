package com.agroconnect.fixture;

import com.agroconnect.model.ExecutionAssignment;
import com.agroconnect.model.Machine;
import com.agroconnect.model.ServiceExecution;
import com.agroconnect.model.TeamMember;
import com.agroconnect.model.enums.MachineStatus;
import com.agroconnect.model.enums.TeamMemberRole;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import java.time.Instant;

public final class ExecutionFixture {

    private static final int SRID_WGS84 = 4326;
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), SRID_WGS84);

    private ExecutionFixture() {}

    public static Point createPoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }

    public static ServiceExecution.ServiceExecutionBuilder anExecution() {
        return ServiceExecution.builder()
                .id(1L)
                .createdAt(Instant.now());
    }

    public static ServiceExecution.ServiceExecutionBuilder aCheckedInExecution() {
        return anExecution()
                .checkinLocation(createPoint(-27.2167, 38.6667))
                .checkinTime(Instant.now());
    }

    public static ServiceExecution.ServiceExecutionBuilder aCompletedExecution() {
        return aCheckedInExecution()
                .completedAt(Instant.now())
                .checkoutTime(Instant.now())
                .notes("Trabalho concluído sem problemas");
    }

    public static TeamMember.TeamMemberBuilder aTeamMember() {
        return TeamMember.builder()
                .id(1L)
                .name("Manuel Santos")
                .email("manuel@agroservicos.pt")
                .phone("+351913000000")
                .role(TeamMemberRole.OPERATOR)
                .active(true)
                .invitedAt(Instant.now());
    }

    public static Machine.MachineBuilder aMachine() {
        return Machine.builder()
                .id(1L)
                .name("Trator John Deere 6120M")
                .type("Trator")
                .description("120cv com cabine climatizada")
                .status(MachineStatus.AVAILABLE)
                .licensePlate("AA-00-BB")
                .createdAt(Instant.now());
    }

    public static ExecutionAssignment.ExecutionAssignmentBuilder anAssignment() {
        return ExecutionAssignment.builder()
                .id(1L)
                .assignedAt(Instant.now());
    }
}
