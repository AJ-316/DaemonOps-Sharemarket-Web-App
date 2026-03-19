package wissen.daemonops.sharemarket.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wissen.daemonops.sharemarket.models.Wallet;
import wissen.daemonops.sharemarket.repos.WalletRepo;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private WalletRepo walletRepo;

    @InjectMocks
    private WalletService walletService;

    @Test
    void createWallet_setsDefaultBalanceAndPersists() {
        when(walletRepo.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.createWallet(7L);

        assertEquals(7L, result.getUserId());
        assertEquals(BigDecimal.ZERO, result.getBalance());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getLastUpdated());

        ArgumentCaptor<Wallet> captor = ArgumentCaptor.forClass(Wallet.class);
        verify(walletRepo).save(captor.capture());
        assertEquals(7L, captor.getValue().getUserId());
    }

    @Test
    void getWallet_whenExists_returnsWallet() {
        Wallet wallet = wallet(5L, "2500.00");
        when(walletRepo.findByUserId(5L)).thenReturn(Optional.of(wallet));

        Wallet result = walletService.getWallet(5L);

        assertEquals(5L, result.getUserId());
        assertEquals(new BigDecimal("2500.00"), result.getBalance());
    }

    @Test
    void getWallet_whenMissing_createsNewWallet() {
        Long userId = 99L;
        when(walletRepo.findByUserId(userId)).thenReturn(Optional.empty());
        when(walletRepo.save(any(Wallet.class))).thenAnswer(i -> i.getArgument(0));

        Wallet result = walletService.getWallet(userId);

        assertEquals(userId, result.getUserId());
        assertEquals(BigDecimal.ZERO, result.getBalance());
        verify(walletRepo).save(any(Wallet.class));
    }

    @Test
    void deposit_withPositiveAmount_updatesBalanceAndSaves() {
        Wallet wallet = wallet(3L, "1000.00");
        when(walletRepo.findByUserId(3L)).thenReturn(Optional.of(wallet));
        when(walletRepo.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.deposit(3L, new BigDecimal("250.50"));

        assertEquals(new BigDecimal("1250.50"), result.getBalance());
        assertNotNull(result.getLastUpdated());
        verify(walletRepo).save(wallet);
    }

    @Test
    void deposit_withNonPositiveAmount_throwsAndDoesNotSave() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> walletService.deposit(3L, BigDecimal.ZERO));

        assertEquals("Amount must be greater than 0", ex.getMessage());
        verify(walletRepo, never()).findByUserId(any(Long.class));
        verify(walletRepo, never()).save(any(Wallet.class));
    }

    @Test
    void deduct_withEnoughBalance_updatesBalanceAndSaves() {
        Wallet wallet = wallet(4L, "500.00");
        when(walletRepo.findByUserId(4L)).thenReturn(Optional.of(wallet));
        when(walletRepo.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.deduct(4L, new BigDecimal("120.00"));

        assertEquals(new BigDecimal("380.00"), result.getBalance());
        assertNotNull(result.getLastUpdated());
        verify(walletRepo).save(wallet);
    }

    @Test
    void deduct_withInsufficientBalance_throwsAndDoesNotSave() {
        Wallet wallet = wallet(4L, "50.00");
        when(walletRepo.findByUserId(4L)).thenReturn(Optional.of(wallet));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> walletService.deduct(4L, new BigDecimal("100.00")));

        assertTrue(ex.getMessage().contains("Insufficient balance. Available: ₹50.00"));
        verify(walletRepo, never()).save(any(Wallet.class));
    }

    @Test
    void credit_addsBalanceAndSaves() {
        Wallet wallet = wallet(8L, "900.00");
        when(walletRepo.findByUserId(8L)).thenReturn(Optional.of(wallet));
        when(walletRepo.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet result = walletService.credit(8L, new BigDecimal("100.00"));

        assertEquals(new BigDecimal("1000.00"), result.getBalance());
        assertNotNull(result.getLastUpdated());
        verify(walletRepo).save(wallet);
    }

    private Wallet wallet(Long userId, String balance) {
        return Wallet.builder()
                .userId(userId)
                .balance(new BigDecimal(balance))
                .build();
    }
}
