package wissen.daemonops.sharemarket.services;

import java.math.RoundingMode;
import java.math.BigDecimal;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.exceptions.TradeRejectedException;
import wissen.daemonops.sharemarket.models.OrderType;
import wissen.daemonops.sharemarket.models.StockPrice;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

@Service
@RequiredArgsConstructor
public class PriceService {

    private final StockPriceRepo stockPriceRepo;
    private final Random random = new Random();

    // Called when a new company is added
    public StockPrice initializeStock(Long companyId, BigDecimal initialPrice) {
        StockPrice stock = StockPrice.builder()
                .companyId(companyId)
                .currentPrice(initialPrice)
                .openPriceToday(initialPrice)
                .highToday(initialPrice)
                .lowToday(initialPrice)
                .lastUpdated(LocalDateTime.now())
                .build();
        return stockPriceRepo.save(stock);
    }

    // Called after every trade to move price
    public StockPrice updatePriceAfterTrade(Long companyId, OrderType orderType) {
        StockPrice stock = stockPriceRepo.findByCompanyId(companyId)
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        BigDecimal currentPrice = stock.getCurrentPrice();
        BigDecimal openPrice = stock.getOpenPriceToday();

        // Generate random movement between 0% and 5%
        double movementPercent = random.nextDouble() * 0.05;
        BigDecimal movement = currentPrice.multiply(BigDecimal.valueOf(movementPercent));

        // BUY → price goes up, SELL → price goes down
        BigDecimal newPrice = orderType == OrderType.BUY
                ? currentPrice.add(movement)
                : currentPrice.subtract(movement);

        // Check 20% daily rule
        double dailyChange = newPrice.subtract(openPrice)
                .abs()
                .divide(openPrice, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();

        if (dailyChange > 20) {
            throw new TradeRejectedException(
                "Daily 20% price limit reached for this stock. No more trades today."
            );
        }

        // Update high and low
        if (newPrice.compareTo(stock.getHighToday()) > 0) stock.setHighToday(newPrice);
        if (newPrice.compareTo(stock.getLowToday()) < 0) stock.setLowToday(newPrice);

        stock.setCurrentPrice(newPrice);
        stock.setLastUpdated(LocalDateTime.now());
        return stockPriceRepo.save(stock);
    }

    // Background random fluctuation
    public void randomFluctuate(StockPrice stock) {
        BigDecimal currentPrice = stock.getCurrentPrice();
        BigDecimal openPrice = stock.getOpenPriceToday();

        // Small random movement max 1%
        double movementPercent = (random.nextDouble() * 0.02) - 0.01; // -1% to +1%
        BigDecimal movement = currentPrice.multiply(BigDecimal.valueOf(Math.abs(movementPercent)));

        BigDecimal newPrice = movementPercent >= 0
                ? currentPrice.add(movement)
                : currentPrice.subtract(movement);

        // Still respect 20% daily rule
        double dailyChange = newPrice.subtract(openPrice)
                .abs()
                .divide(openPrice, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();

        if (dailyChange > 20) return; // just skip, dont throw here

        if (newPrice.compareTo(stock.getHighToday()) > 0) stock.setHighToday(newPrice);
        if (newPrice.compareTo(stock.getLowToday()) < 0) stock.setLowToday(newPrice);

        stock.setCurrentPrice(newPrice);
        stock.setLastUpdated(LocalDateTime.now());
        stockPriceRepo.save(stock);
    }

    public List<StockPrice> getAllStocks() {
        return stockPriceRepo.findAll();
    }

    public StockPrice getStockByCompanyId(Long companyId) {
        return stockPriceRepo.findByCompanyId(companyId)
                .orElseThrow(() -> new RuntimeException("Stock not found for companyId: " + companyId));
    }
}
