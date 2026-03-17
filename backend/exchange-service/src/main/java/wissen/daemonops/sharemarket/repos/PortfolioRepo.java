package wissen.daemonops.sharemarket.repos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import wissen.daemonops.sharemarket.models.Portfolio;

@Repository
public interface PortfolioRepo extends JpaRepository<Portfolio, Long> {
    Optional<Portfolio> findByUserIdAndCompanyId(Long userId, Long companyId);
    List<Portfolio> findByUserId(Long userId);
}