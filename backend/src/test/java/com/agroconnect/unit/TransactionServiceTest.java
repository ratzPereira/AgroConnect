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
import com.agroconnect.service.AuditService;
import com.agroconnect.service.NotificationService;
import com.agroconnect.service.StripeService;
import com.agroconnect.service.TransactionService;
import com.stripe.model.Refund;
import com.stripe.model.Transfer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AuditService auditService;

    @Mock
    private StripeService stripeService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private TransactionService service;

    private User clientUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private ServiceRequest request;
    private Proposal proposal;
    private Transaction heldTransaction;

    @BeforeEach
    void setUp() {
        service = new TransactionService(transactionRepository, auditService, stripeService, notificationService, eventPublisher);

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
        heldTransaction.setStripePaymentIntentId("pi_test_123");
        heldTransaction.setStripeChargeId("ch_test_123");
    }

    private Transfer stubTransfer(String id) {
        Transfer t = mock(Transfer.class);
        lenient().when(t.getId()).thenReturn(id);
        return t;
    }

    private Refund stubRefund(String id) {
        Refund r = mock(Refund.class);
        lenient().when(r.getId()).thenReturn(id);
        return r;
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
    void release_givenHeldTransaction_shouldCreateTransferAndSetReleasedStatus() {
        Transfer transfer = stubTransfer("tr_test_abc");
        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(heldTransaction));
        when(stripeService.createTransfer(anyLong(), anyString(), any(BigDecimal.class), anyString()))
                .thenReturn(transfer);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(heldTransaction);

        service.release(1L);

        assertEquals(TransactionStatus.RELEASED, heldTransaction.getStatus());
        assertEquals("tr_test_abc", heldTransaction.getStripeTransferId());
        assertNotNull(heldTransaction.getReleasedAt());
        verify(stripeService).createTransfer(eq(heldTransaction.getId()),
                eq(providerProfile.getStripeAccountId()),
                eq(heldTransaction.getProviderPayout()),
                eq("ch_test_123"));
        verify(notificationService).create(eq(providerUser.getId()), eq("PAYMENT_RELEASED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void release_givenNonHeldTransaction_shouldThrowInvalidState() {
        Transaction releasedTx = ProposalFixture.aTransaction()
                .status(TransactionStatus.RELEASED)
                .request(request).proposal(proposal).build();

        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(releasedTx));

        assertThrows(InvalidStateException.class, () -> service.release(1L));
        verify(stripeService, never()).createTransfer(anyLong(), anyString(), any(), anyString());
    }

    @Test
    void release_givenProviderWithoutStripeAccount_shouldThrowInvalidState() {
        providerProfile.setStripeAccountId(null);
        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(heldTransaction));

        assertThrows(InvalidStateException.class, () -> service.release(1L));
        verify(stripeService, never()).createTransfer(anyLong(), anyString(), any(), anyString());
    }

    @Test
    void release_givenProviderWithoutPayoutsEnabled_shouldThrowInvalidState() {
        providerProfile.setStripePayoutsEnabled(false);
        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(heldTransaction));

        assertThrows(InvalidStateException.class, () -> service.release(1L));
        verify(stripeService, never()).createTransfer(anyLong(), anyString(), any(), anyString());
    }

    @Test
    void refund_givenHeldTransaction_shouldCreateRefundAndSetRefundedStatus() {
        Refund refund = stubRefund("re_test_xyz");
        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(heldTransaction));
        when(stripeService.createRefund(anyLong(), anyString(), any(BigDecimal.class), anyString()))
                .thenReturn(refund);
        when(transactionRepository.save(any(Transaction.class))).thenReturn(heldTransaction);

        service.refund(1L);

        assertEquals(TransactionStatus.REFUNDED, heldTransaction.getStatus());
        assertNotNull(heldTransaction.getRefundedAt());
        verify(stripeService).createRefund(eq(heldTransaction.getId()),
                eq("pi_test_123"),
                eq(heldTransaction.getAmount()),
                anyString());
        verify(notificationService).create(eq(clientUser.getId()), eq("PAYMENT_REFUNDED"),
                anyString(), anyString(), anyString());
    }

    @Test
    void refund_givenTransactionWithoutPaymentIntent_shouldThrowInvalidState() {
        heldTransaction.setStripePaymentIntentId(null);
        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(heldTransaction));

        assertThrows(InvalidStateException.class, () -> service.refund(1L));
        verify(stripeService, never()).createRefund(anyLong(), anyString(), any(), anyString());
    }

    @Test
    void getById_givenNonExistentId_shouldThrowNotFound() {
        when(transactionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(999L, 1L));
    }

    @Test
    void getById_givenProvider_shouldReturnTransaction() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(heldTransaction));

        TransactionResponse response = service.getById(1L, providerUser.getId());

        assertNotNull(response);
        assertEquals(TransactionStatus.HELD, response.status());
    }

    @Test
    void listMyTransactions_shouldReturnPage() {
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());

        var result = service.listMyTransactions(1L, org.springframework.data.domain.PageRequest.of(0, 20));

        assertNotNull(result);
    }

    @Test
    void refund_givenNonHeldTransaction_shouldThrowInvalidState() {
        Transaction releasedTx = ProposalFixture.aTransaction()
                .status(TransactionStatus.RELEASED)
                .request(request).proposal(proposal).build();

        when(transactionRepository.findByRequestId(1L)).thenReturn(Optional.of(releasedTx));

        assertThrows(InvalidStateException.class, () -> service.refund(1L));
        verify(stripeService, never()).createRefund(anyLong(), anyString(), any(), anyString());
    }

    @Test
    void release_givenNonExistentRequest_shouldThrowNotFound() {
        when(transactionRepository.findByRequestId(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.release(999L));
    }

    @Test
    void refund_givenNonExistentRequest_shouldThrowNotFound() {
        when(transactionRepository.findByRequestId(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.refund(999L));
    }
}
