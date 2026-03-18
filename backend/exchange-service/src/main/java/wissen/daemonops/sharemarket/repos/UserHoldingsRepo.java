package wissen.daemonops.sharemarket.repos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import wissen.daemonops.sharemarket.models.UserHoldings;

@Repository
public interface UserHoldingsRepo extends JpaRepository<UserHoldings, Long> {
    Optional<UserHoldings> findByUserIdAndCompanyId(Long userId, Long companyId);
    List<UserHoldings> findByUserId(Long userId);
    List<UserHoldings> findByUserIdAndPortfolioId(Long userId, Long portfolioId);
}