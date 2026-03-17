package wissen.daemonops.sharemarket.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.models.StockPrice;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

@Component
@RequiredArgsConstructor
public class PriceScheduler {

    private final StockPriceRepo stockPriceRepo;
    private final PriceService priceService;

    // Random fluctuation every second
    @Scheduled(fixedDelay = 1000)
    public void fluctuateAllPrices() {
        List<StockPrice> allStocks = stockPriceRepo.findAll();
        allStocks.forEach(priceService::randomFluctuate);
    }

    // Reset daily prices at 9:15 AM on weekdays
    @Scheduled(cron = "0 15 9 * * MON-FRI")
    public void resetDailyPrices() {
        List<StockPrice> allStocks = stockPriceRepo.findAll();
        allStocks.forEach(stock -> {
            stock.setOpenPriceToday(stock.getCurrentPrice());
            stock.setHighToday(stock.getCurrentPrice());
            stock.setLowToday(stock.getCurrentPrice());
            stock.setLastUpdated(LocalDateTime.now());
            stockPriceRepo.save(stock);
        });
    }
}