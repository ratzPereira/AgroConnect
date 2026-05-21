package com.agroconnect.integration;

import com.agroconnect.dto.request.CreateListingDto;
import com.agroconnect.dto.request.LoginRequest;
import com.agroconnect.dto.request.RegisterRequest;
import com.agroconnect.dto.request.SendListingMessageDto;
import com.agroconnect.dto.request.UpdateListingDto;
import com.agroconnect.fixture.TestContainersConfig;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.ListingCategory;
import com.agroconnect.model.enums.ListingCondition;
import com.agroconnect.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ListingControllerIT extends TestContainersConfig {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private static String sellerToken;
    private static String buyerToken;
    private static Long listingId;

    @Test
    @Order(1)
    void setup_registerSellerAndBuyer() throws Exception {
        // Register seller
        RegisterRequest sellerReg = new RegisterRequest(
                "list-seller@test.pt", "Password1", "Password1",
                "Listing Seller", "+351900000050", "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sellerReg)))
                .andExpect(status().isCreated());

        User sellerUser = userRepository.findByEmail("list-seller@test.pt").orElseThrow();
        sellerUser.setEmailVerified(true);
        userRepository.save(sellerUser);

        LoginRequest sellerLogin = new LoginRequest("list-seller@test.pt", "Password1");
        MvcResult sellerResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sellerLogin)))
                .andExpect(status().isOk())
                .andReturn();

        sellerToken = objectMapper.readTree(sellerResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Register buyer
        RegisterRequest buyerReg = new RegisterRequest(
                "list-buyer@test.pt", "Password1", "Password1",
                "Listing Buyer", "+351900000051", "CLIENT", null, null);

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerReg)))
                .andExpect(status().isCreated());

        User buyerUser = userRepository.findByEmail("list-buyer@test.pt").orElseThrow();
        buyerUser.setEmailVerified(true);
        userRepository.save(buyerUser);

        LoginRequest buyerLogin = new LoginRequest("list-buyer@test.pt", "Password1");
        MvcResult buyerResult = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerLogin)))
                .andExpect(status().isOk())
                .andReturn();

        buyerToken = objectMapper.readTree(buyerResult.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @Order(2)
    void search_givenNoAuth_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(3)
    void create_givenValidData_shouldReturn201() throws Exception {
        CreateListingDto dto = new CreateListingDto(
                "Vitelos Holstein — 6 meses",
                "Vendo 3 vitelos Holstein com 6 meses, vacinados e desparasitados.",
                new BigDecimal("1500.00"),
                true,
                ListingCategory.ANIMALS,
                ListingCondition.NEW,
                new BigDecimal("3"),
                "cabeças",
                38.7167,
                -27.2167,
                "Angra do Heroísmo",
                "Sé",
                "Angra do Heroísmo",
                "Terceira");

        MvcResult result = mockMvc.perform(post("/v1/listings")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title").value("Vitelos Holstein — 6 meses"))
                .andReturn();

        listingId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id").asLong();
    }

    @Test
    @Order(4)
    void getById_givenExistingListing_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/listings/" + listingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listingId))
                .andExpect(jsonPath("$.title").value("Vitelos Holstein — 6 meses"));
    }

    @Test
    @Order(5)
    void getById_givenNonExistent_shouldReturn404() throws Exception {
        mockMvc.perform(get("/v1/listings/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(6)
    void update_givenOwner_shouldReturn200() throws Exception {
        UpdateListingDto dto = new UpdateListingDto(
                "Vitelos Holstein — 8 meses",
                "Vendo 3 vitelos Holstein com 8 meses, vacinados.",
                new BigDecimal("1800.00"),
                false,
                ListingCategory.ANIMALS,
                ListingCondition.NEW,
                new BigDecimal("3"),
                "cabeças",
                38.7167,
                -27.2167,
                "Angra do Heroísmo",
                "Sé",
                "Angra do Heroísmo",
                "Terceira");

        mockMvc.perform(put("/v1/listings/" + listingId)
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Vitelos Holstein — 8 meses"));
    }

    @Test
    @Order(7)
    void myListings_givenAuthenticated_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/listings/me")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @Order(8)
    void myStats_givenAuthenticated_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/listings/me/stats")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()));
    }

    @Test
    @Order(9)
    void toggleFavorite_givenBuyer_shouldReturn200() throws Exception {
        mockMvc.perform(post("/v1/listings/" + listingId + "/favorite")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.favorited").value(true));
    }

    @Test
    @Order(10)
    void getFavorites_givenBuyer_shouldReturn200() throws Exception {
        mockMvc.perform(get("/v1/listings/favorites")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @Order(11)
    void markAsSold_givenOwner_shouldReturn200() throws Exception {
        mockMvc.perform(post("/v1/listings/" + listingId + "/sold")
                        .header("Authorization", "Bearer " + sellerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SOLD"));
    }

    @Test
    @Order(12)
    void create_givenNoAuth_shouldReturn401() throws Exception {
        CreateListingDto dto = new CreateListingDto(
                "Unauthorized Listing",
                "Should not be created",
                new BigDecimal("100.00"),
                false,
                ListingCategory.PRODUCE,
                null,
                null,
                null,
                38.7167,
                -27.2167,
                "Test",
                null,
                null,
                "Terceira");

        mockMvc.perform(post("/v1/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(13)
    void update_givenNonOwner_shouldReturn403() throws Exception {
        // Create a new listing by seller to test non-owner update
        CreateListingDto createDto = new CreateListingDto(
                "Seller Only Listing",
                "Only seller should update this",
                new BigDecimal("200.00"),
                false,
                ListingCategory.EQUIPMENT,
                ListingCondition.USED,
                new BigDecimal("1"),
                "unidade",
                38.7167,
                -27.2167,
                "Angra do Heroísmo",
                "Sé",
                "Angra do Heroísmo",
                "Terceira");

        MvcResult createResult = mockMvc.perform(post("/v1/listings")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Long newListingId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        UpdateListingDto updateDto = new UpdateListingDto(
                "Hacked Title",
                "Buyer tries to update",
                new BigDecimal("1.00"),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);

        mockMvc.perform(put("/v1/listings/" + newListingId)
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(14)
    void messagingFlow_sendThenGetMessages_shouldUseConversationsMessagesUrl() throws Exception {
        // This test locks the chat URL contract that the frontend depends on.
        // Regression: prod was returning 500 because backend exposed
        // GET /listings/conversations/{id} (no /messages) while frontend called
        // GET /listings/conversations/{id}/messages.

        CreateListingDto createDto = new CreateListingDto(
                "Anúncio para conversa",
                "Listing usado para validar o endpoint GET de mensagens.",
                new BigDecimal("50.00"),
                false,
                ListingCategory.PRODUCE,
                null,
                new BigDecimal("10"),
                "kg",
                38.7167,
                -27.2167,
                "Angra do Heroísmo",
                "Sé",
                "Angra do Heroísmo",
                "Terceira");

        MvcResult createResult = mockMvc.perform(post("/v1/listings")
                        .header("Authorization", "Bearer " + sellerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Long chatListingId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        SendListingMessageDto firstMessage = new SendListingMessageDto("Olá, ainda está disponível?");
        mockMvc.perform(post("/v1/listings/" + chatListingId + "/messages")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstMessage)))
                .andExpect(status().isCreated());

        MvcResult conversationsResult = mockMvc.perform(get("/v1/listings/conversations")
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andReturn();

        Long conversationId = objectMapper.readTree(conversationsResult.getResponse().getContentAsString())
                .get("content").get(0).get("id").asLong();

        mockMvc.perform(get("/v1/listings/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + buyerToken)
                        .param("page", "0")
                        .param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].content").value("Olá, ainda está disponível?"));
    }
}
