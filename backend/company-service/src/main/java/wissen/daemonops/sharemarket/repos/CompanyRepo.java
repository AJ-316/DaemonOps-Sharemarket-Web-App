package wissen.daemonops.sharemarket.repos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import wissen.daemonops.sharemarket.models.Company;

public interface CompanyRepo extends JpaRepository<Company, Long>{
    Optional<Company> findByTicker(String ticker);
    List<Company> findBySector(String sector);
    boolean existsByTicker(String ticker);
}
