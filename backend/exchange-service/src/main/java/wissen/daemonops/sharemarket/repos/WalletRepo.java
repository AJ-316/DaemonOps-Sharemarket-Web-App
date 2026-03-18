package wissen.daemonops.sharemarket.repos;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import wissen.daemonops.sharemarket.models.Wallet;

public interface WalletRepo extends JpaRepository <Wallet, Long> {
    Optional<Wallet> findByUserId(Long userId);
}
