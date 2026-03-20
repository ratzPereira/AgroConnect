package com.agroconnect.fixture;

import com.agroconnect.model.RequestPhoto;
import com.agroconnect.model.ServiceCategory;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.Urgency;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class ServiceRequestFixture {

    private static final int SRID_WGS84 = 4326;
    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), SRID_WGS84);

    private ServiceRequestFixture() {}

    public static Point createPoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }

    public static ServiceCategory.ServiceCategoryBuilder aCategory() {
        return ServiceCategory.builder()
                .id(1L)
                .name("Preparação de Solo")
                .slug("preparacao-solo")
                .description("Serviços de lavoura e preparação de terrenos")
                .active(true)
                .sortOrder(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }

    public static ServiceRequest.ServiceRequestBuilder aRequest() {
        return ServiceRequest.builder()
                .id(1L)
                .title("Lavoura de 2 hectares")
                .description("Necessito de lavoura profunda em terreno de 2 hectares para plantação de milho")
                .status(RequestStatus.DRAFT)
                .location(createPoint(-27.2167, 38.6667))
                .parish("São Sebastião")
                .municipality("Angra do Heroísmo")
                .island("Terceira")
                .area(2.0)
                .areaUnit("hectares")
                .urgency(Urgency.MEDIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now());
    }

    public static ServiceRequest.ServiceRequestBuilder aPublishedRequest() {
        return aRequest()
                .status(RequestStatus.PUBLISHED)
                .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
    }

    public static ServiceRequest.ServiceRequestBuilder aRequestWithProposals() {
        return aRequest()
                .status(RequestStatus.WITH_PROPOSALS)
                .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
    }

    public static RequestPhoto.RequestPhotoBuilder aPhoto() {
        return RequestPhoto.builder()
                .id(1L)
                .photoUrl("http://minio:9000/agroconnect/requests/1/photo1.jpg")
                .sortOrder(0)
                .uploadedAt(Instant.now());
    }
}
