package wissen.daemonops.sharemarket.services;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory 1-second OHLCV candle aggregator for the Chart page.
 * The PriceScheduler calls recordTick() every second.
 * The REST endpoint calls getCandles() to serve the chart.
 */
@Service
public class CandleService {

    // DTO for a single candle
    public static class Candle {
        public long time; // Unix epoch seconds
        public double open;
        public double high;
        public double low;
        public double close;

        Candle(long time, double price) {
            this.time = time;
            this.open = price;
            this.high = price;
            this.low = price;
            this.close = price;
        }
    }

    private static final int MAX_CANDLES = 300;

    // companyId → deque of candles (ordered oldest→newest)
    private final Map<Long, Deque<Candle>> candleMap = new ConcurrentHashMap<>();

    /**
     * Called every second by PriceScheduler after updating the stock price.
     */
    public void recordTick(Long companyId, BigDecimal price) {
        double p = price.doubleValue();
        long nowSec = Instant.now().getEpochSecond();

        Deque<Candle> deque = candleMap.computeIfAbsent(companyId, k -> new ArrayDeque<>());

        Candle last = deque.isEmpty() ? null : ((ArrayDeque<Candle>) deque).peekLast();

        if (last != null && last.time == nowSec) {
            // Update the current candle
            last.close = p;
            last.high = Math.max(last.high, p);
            last.low = Math.min(last.low, p);
        } else {
            // New second → new candle
            if (deque.size() >= MAX_CANDLES)
                deque.pollFirst();
            deque.addLast(new Candle(nowSec, p));
        }
    }

    /**
     * Returns the list of candles for a company (oldest → newest).
     */
    public List<Candle> getCandles(Long companyId) {
        Deque<Candle> deque = candleMap.getOrDefault(companyId, new ArrayDeque<>());
        return new ArrayList<>(deque);
    }
}
