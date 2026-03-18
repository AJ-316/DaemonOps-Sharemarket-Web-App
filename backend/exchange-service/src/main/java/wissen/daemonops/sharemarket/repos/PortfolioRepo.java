package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wissen.daemonops.sharemarket.models.Portfolio;
import wissen.daemonops.sharemarket.models.UserHoldings;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioRepo extends JpaRepository<Portfolio, Long> {
    boolean existsByNameIgnoreCase(String name);
    List<Portfolio> findAllByUserId(Long userId);
}