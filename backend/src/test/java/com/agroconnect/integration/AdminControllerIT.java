package com.agroconnect.integration;

import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.Listing;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ListingCategory;
import com.agroconnect.model.enums.ListingStatus;
import com.agroconnect.model.enums.Role;
import com.agroconnect.repository.ListingRepository;
import com.agroconnect.repository.UserRepository;
import com.agroconnect.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdminControllerIT extends TestContainersConfig {

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ListingRepository listingRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    private static String adminToken;
    private static Long sellerId;
    private static Long listingId;

    @Test
    @Order(1)
    void setup_createAdminUser() throws Exception {
        // Admin users need to be created directly (no public registration for ADMIN role)
        User admin = User.builder()
                .email("admin-it@test.pt")
                .passwordHash(passwordEncoder.encode("Password1"))
                .role(Role.ADMIN)
                .emailVerified(true)
                .active(true)
                .build();
        admin = userRepository.save(admin);
        adminToken = jwtService.generateAccessToken(admin);

        User seller = User.builder()
                .email("seller-admin-it@test.pt")
                .passwordHash(passwordEncoder.encode("Password1"))
                .role(Role.CLIENT)
                .emailVerified(true)
                .active(true)
                .build();
        seller = userRepository.save(seller);
        sellerId = seller.getId();

        Point location = GF.createPoint(new Coordinate(-25.67, 37.74));
        location.setSRID(4326);
        Listing listing = Listing.builder()
                .seller(seller)
                .title("Test admin listing")
                .description("Listing used in admin IT")
                .category(ListingCategory.PRODUCE)
                .price(new BigDecimal("50.00"))
                .priceNegotiable(false)
                .status(ListingStatus.ACTIVE)
                .location(location)
                .locationName("Ponta Delgada")
                .parish("São Sebastião")
                .municipality("Ponta Delgada")
                .island("São Miguel")
                .viewsCount(0)
                .build();
        listing = listingRepository.save(listing);
        listingId = listing.getId();
    }

    @Test
    @Order(2)
    void getDashboard_givenAdmin_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers", notNullValue()))
                .andExpect(jsonPath("$.totalRequests", notNullValue()));
    }

    @Test
    @Order(3)
    void listUsers_givenAdmin_shouldReturnUsers() throws Exception {
        mockMvc.perform(get("/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(4)
    void getDashboard_givenNoAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/v1/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(5)
    void getUserDetail_givenAdmin_shouldReturnUser() throws Exception {
        mockMvc.perform(get("/v1/admin/users/" + sellerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sellerId));
    }

    @Test
    @Order(6)
    void banUser_givenAdmin_shouldReturn204() throws Exception {
        mockMvc.perform(post("/v1/admin/users/" + sellerId + "/ban")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @Order(7)
    void unbanUser_givenAdmin_shouldReturn204() throws Exception {
        mockMvc.perform(post("/v1/admin/users/" + sellerId + "/unban")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @Order(8)
    void listDisputes_givenAdmin_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/v1/admin/disputes")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(9)
    void listListings_givenAdmin_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/v1/admin/listings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(10)
    void listListings_givenStatusFilter_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/v1/admin/listings?status=ACTIVE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(11)
    void getListingDetail_givenAdmin_shouldReturnListing() throws Exception {
        mockMvc.perform(get("/v1/admin/listings/" + listingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listingId));
    }

    @Test
    @Order(12)
    void removeListing_givenAdmin_shouldReturnRemovedListing() throws Exception {
        mockMvc.perform(delete("/v1/admin/listings/" + listingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listingId))
                .andExpect(jsonPath("$.status").value("REMOVED"));
    }
}
