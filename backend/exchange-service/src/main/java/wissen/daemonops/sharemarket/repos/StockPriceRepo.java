package wissen.daemonops.sharemarket.repos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import wissen.daemonops.sharemarket.models.StockPrice;

@Repository
public interface StockPriceRepo extends JpaRepository<StockPrice, Long> {
    Optional<StockPrice> findByCompanyId(Long companyId);
    List<StockPrice> findAll();
}