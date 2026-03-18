package wissen.daemonops.sharemarket.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wissen.daemonops.sharemarket.exceptions.TradeRejectedException;
import wissen.daemonops.sharemarket.models.OrderType;
import wissen.daemonops.sharemarket.models.StockPrice;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

@ExtendWith(MockitoExtension.class)
class PriceServiceTest {

    @Mock
    private StockPriceRepo stockPriceRepo;

    @InjectMocks
    private PriceService priceService;

    @Test
    void initializeStock_setsDailyPricesAndSaves() {
        when(stockPriceRepo.save(any(StockPrice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockPrice result = priceService.initializeStock(1L, new BigDecimal("150.00"));

        assertEquals(new BigDecimal("150.00"), result.getCurrentPrice());
        assertEquals(new BigDecimal("150.00"), result.getOpenPriceToday());
        assertEquals(new BigDecimal("150.00"), result.getHighToday());
        assertEquals(new BigDecimal("150.00"), result.getLowToday());
        assertNotNull(result.getLastUpdated());
        verify(stockPriceRepo).save(any(StockPrice.class));
    }

    @Test
    void updatePriceAfterTrade_buyWithinLimit_updatesAndSaves() {
        StockPrice stock = StockPrice.builder()
                .companyId(1L)
                .currentPrice(new BigDecimal("100.00"))
                .openPriceToday(new BigDecimal("100.00"))
                .highToday(new BigDecimal("100.00"))
                .lowToday(new BigDecimal("100.00"))
                .build();
        when(stockPriceRepo.findByCompanyId(1L)).thenReturn(Optional.of(stock));
        when(stockPriceRepo.save(any(StockPrice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockPrice updated = priceService.updatePriceAfterTrade(1L, OrderType.BUY);

        assertTrue(updated.getCurrentPrice().compareTo(new BigDecimal("100.00")) >= 0);
        assertTrue(updated.getCurrentPrice().compareTo(new BigDecimal("105.00")) <= 0);
        assertNotNull(updated.getLastUpdated());
        verify(stockPriceRepo).save(stock);
    }

    @Test
    void updatePriceAfterTrade_whenDailyLimitExceeded_throwsTradeRejectedException() {
        StockPrice stock = StockPrice.builder()
                .companyId(1L)
                .currentPrice(new BigDecimal("200.00"))
                .openPriceToday(new BigDecimal("100.00"))
                .highToday(new BigDecimal("200.00"))
                .lowToday(new BigDecimal("100.00"))
                .build();
        when(stockPriceRepo.findByCompanyId(1L)).thenReturn(Optional.of(stock));

        assertThrows(TradeRejectedException.class,
                () -> priceService.updatePriceAfterTrade(1L, OrderType.BUY));

        verify(stockPriceRepo, never()).save(any(StockPrice.class));
    }

    @Test
    void randomFluctuate_whenAlreadyBeyondDailyLimit_skipsSave() {
        StockPrice stock = StockPrice.builder()
                .companyId(1L)
                .currentPrice(new BigDecimal("200.00"))
                .openPriceToday(new BigDecimal("100.00"))
                .highToday(new BigDecimal("210.00"))
                .lowToday(new BigDecimal("90.00"))
                .build();

        priceService.randomFluctuate(stock);

        verify(stockPriceRepo, never()).save(any(StockPrice.class));
    }

    @Test
    void getAllStocks_returnsRepoResult() {
        List<StockPrice> stocks = List.of(
                StockPrice.builder().companyId(1L).currentPrice(new BigDecimal("10.00")).build());
        when(stockPriceRepo.findAll()).thenReturn(stocks);

        List<StockPrice> result = priceService.getAllStocks();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getCompanyId());
    }

    @Test
    void getStockByCompanyId_whenMissing_throwsRuntimeException() {
        when(stockPriceRepo.findByCompanyId(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> priceService.getStockByCompanyId(99L));

        assertTrue(ex.getMessage().contains("Stock not found for companyId: 99"));
    }

    @Test
    void deleteByCompanyId_whenPresent_deletesStock() {
        StockPrice stock = StockPrice.builder().companyId(1L).build();
        when(stockPriceRepo.findByCompanyId(1L)).thenReturn(Optional.of(stock));

        priceService.deleteByCompanyId(1L);

        verify(stockPriceRepo).delete(stock);
    }
}
