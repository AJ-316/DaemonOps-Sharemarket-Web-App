package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;
import wissen.daemonops.sharemarket.models.Portfolio;
import wissen.daemonops.sharemarket.models.StockPrice;

public interface StockPriceRepo extends JpaRepository<StockPrice, Long> {
}
