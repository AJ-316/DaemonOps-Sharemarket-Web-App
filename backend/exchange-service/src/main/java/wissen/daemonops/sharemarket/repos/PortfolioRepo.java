package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;
import wissen.daemonops.sharemarket.models.Portfolio;

public interface PortfolioRepo extends JpaRepository<Portfolio, Long> {
}
