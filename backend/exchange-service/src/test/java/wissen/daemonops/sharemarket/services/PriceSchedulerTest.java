package wissen.daemonops.sharemarket.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wissen.daemonops.sharemarket.models.StockPrice;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

@ExtendWith(MockitoExtension.class)
class PriceSchedulerTest {

    @Mock
    private StockPriceRepo stockPriceRepo;

    @Mock
    private PriceService priceService;

    @InjectMocks
    private PriceScheduler priceScheduler;

    @Test
    void fluctuateAllPrices_callsRandomFluctuateForEveryStock() {
        StockPrice first = StockPrice.builder().companyId(1L).currentPrice(new BigDecimal("10.00")).build();
        StockPrice second = StockPrice.builder().companyId(2L).currentPrice(new BigDecimal("20.00")).build();
        when(stockPriceRepo.findAll()).thenReturn(List.of(first, second));

        priceScheduler.fluctuateAllPrices();

        verify(priceService).randomFluctuate(first);
        verify(priceService).randomFluctuate(second);
    }

    @Test
    void resetDailyPrices_setsOpenHighLowToCurrentAndSaves() {
        StockPrice stock = StockPrice.builder()
                .companyId(1L)
                .currentPrice(new BigDecimal("120.00"))
                .openPriceToday(new BigDecimal("100.00"))
                .highToday(new BigDecimal("140.00"))
                .lowToday(new BigDecimal("90.00"))
                .build();
        when(stockPriceRepo.findAll()).thenReturn(List.of(stock));

        priceScheduler.resetDailyPrices();

        assertEquals(new BigDecimal("120.00"), stock.getOpenPriceToday());
        assertEquals(new BigDecimal("120.00"), stock.getHighToday());
        assertEquals(new BigDecimal("120.00"), stock.getLowToday());
        verify(stockPriceRepo, times(1)).save(stock);
    }
}

