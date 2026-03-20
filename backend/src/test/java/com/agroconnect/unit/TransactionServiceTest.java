package com.agroconnect.unit;

import com.agroconnect.dto.response.TransactionResponse;
import com.agroconnect.exception.ForbiddenException;
import com.agroconnect.exception.InvalidStateException;
import com.agroconnect.exception.ResourceNotFoundException;
import com.agroconnect.fixture.ProposalFixture;
import com.agroconnect.fixture.ServiceRequestFixture;
import com.agroconnect.fixture.UserFixture;
import com.agroconnect.model.Proposal;
import com.agroconnect.model.ProviderProfile;
import com.agroconnect.model.ServiceRequest;
import com.agroconnect.model.Transaction;
import com.agroconnect.model.User;
import com.agroconnect.model.enums.RequestStatus;
import com.agroconnect.model.enums.TransactionStatus;
import com.agroconnect.repository.TransactionRepository;
import com.agroconnect.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    private TransactionService service;

    private User clientUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private ServiceRequest request;
    private Proposal proposal;
    private Transaction heldTransaction;

    @BeforeEach
    void setUp() {
        service = new TransactionService(transactionRepository);

        clientUser = UserFixture.aClientUser().build();
        providerUser = UserFixture.aProviderUser().build();
        providerProfile = UserFixture.aProviderProfile().user(providerUser).build();
        request = ServiceRequestFixture.aRequest()
                .status(RequestStatus.AWARDED).client(clientUser)
                .category(ServiceRequestFixture.aCategory().build()).build();
        proposal = ProposalFixture.aProposal()
                .request(request).provider(providerProfile).build();
        heldTransaction = ProposalFixture.aTransaction()
                .request(request).proposal(proposal).build();
    }

    @Test
    void getById_givenClient_shouldReturnTransaction() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(heldTransaction));

        TransactionResponse response = service.getById(1L, clientUser.getId());

        assertNotNull(response);
        assertEquals(TransactionStatus.HELD, response.status());
    }

    @Test
    void getById_givenUnrelatedUser_shouldThrowForbidden() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(heldTransaction));

        assertThrows(ForbiddenException.class, () -> service.getById(1L, 999L));
    }

    @Test
    void release_givenHeldTransaction_shouldSetReleasedStatus() {
        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(heldTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(heldTransaction);

        service.release(1L);

        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void release_givenNonHeldTransaction_shouldThrowInvalidState() {
        Transaction releasedTx = ProposalFixture.aTransaction()
                .status(TransactionStatus.RELEASED)
                .request(request).proposal(proposal).build();

        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(releasedTx));

        assertThrows(InvalidStateException.class, () -> service.release(1L));
    }

    @Test
    void refund_givenHeldTransaction_shouldSetRefundedStatus() {
        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(heldTransaction));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(heldTransaction);

        service.refund(1L);

        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void getById_givenNonExistentId_shouldThrowNotFound() {
        when(transactionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(999L, 1L));
    }
}
