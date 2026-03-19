package wissen.daemonops.sharemarket.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wissen.daemonops.sharemarket.dtos.OrderRequest;
import wissen.daemonops.sharemarket.dtos.OrderResponse;
import wissen.daemonops.sharemarket.exceptions.TradeRejectedException;
import wissen.daemonops.sharemarket.models.Order;
import wissen.daemonops.sharemarket.models.OrderStatus;
import wissen.daemonops.sharemarket.models.OrderType;
import wissen.daemonops.sharemarket.models.StockPrice;
import wissen.daemonops.sharemarket.models.UserHoldings;
import wissen.daemonops.sharemarket.repos.OrderRepo;
import wissen.daemonops.sharemarket.repos.PortfolioRepo;
import wissen.daemonops.sharemarket.repos.UserHoldingsRepo;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepo orderRepo;
    @Mock
    private UserHoldingsRepo userHoldingsRepo;
    @Mock
    private PortfolioRepo portfolioRepo;
    @Mock
    private PriceService priceService;
    @Mock
    private WalletService walletService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void placeOrder_sellWithInsufficientShares_rejectsOrder() {
        Long userId = 10L;
        OrderRequest request = orderRequest(1L, 2L, OrderType.SELL, 5);
        StockPrice stock = stockPrice(1L, "100.00");

        when(priceService.getStockByCompanyId(1L)).thenReturn(stock);
        when(userHoldingsRepo.findByUserIdAndCompanyIdAndPortfolioId(userId, 1L, 2L)).thenReturn(Optional.empty());
        when(orderRepo.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.placeOrder(request, userId);

        assertEquals(OrderStatus.REJECTED, response.getStatus());
        assertEquals("Insufficient shares to sell", response.getRejectionReason());
        verify(priceService, never()).updatePriceAfterTrade(any(Long.class), any(OrderType.class));
        verify(orderRepo).save(any(Order.class));
    }

    @Test
    void placeOrder_whenPriceServiceRejectsTrade_returnsRejectedResponse() {
        Long userId = 11L;
        OrderRequest request = orderRequest(1L, 3L, OrderType.BUY, 4);
        StockPrice stock = stockPrice(1L, "100.00");

        when(priceService.getStockByCompanyId(1L)).thenReturn(stock);
        when(priceService.updatePriceAfterTrade(1L, OrderType.BUY))
                .thenThrow(new TradeRejectedException("Daily 20% price limit reached"));
        when(orderRepo.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.placeOrder(request, userId);

        assertEquals(OrderStatus.REJECTED, response.getStatus());
        assertEquals("Daily 20% price limit reached", response.getRejectionReason());
        verify(orderRepo).save(any(Order.class));
    }

    @Test
    void placeOrder_buyWithExistingHoldings_recalculatesAverageAndExecutes() {
        Long userId = 12L;
        OrderRequest request = orderRequest(1L, 4L, OrderType.BUY, 5);

        StockPrice beforeTrade = stockPrice(1L, "100.00");
        StockPrice afterTrade = stockPrice(1L, "110.00");
        UserHoldings existing = UserHoldings.builder()
                .userId(userId)
                .companyId(1L)
                .portfolioId(4L)
                .quantityHeld(10)
                .averageBuyPrice(new BigDecimal("100.00"))
                .build();

        when(priceService.getStockByCompanyId(1L)).thenReturn(beforeTrade, afterTrade);
        when(userHoldingsRepo.findByUserIdAndCompanyIdAndPortfolioId(userId, 1L, 4L)).thenReturn(Optional.of(existing));
        when(walletService.getWallet(userId)).thenReturn(
                wissen.daemonops.sharemarket.models.Wallet.builder().balance(new BigDecimal("10000.00")).build());
        when(orderRepo.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userHoldingsRepo.save(any(UserHoldings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.placeOrder(request, userId);

        assertEquals(OrderStatus.EXECUTED, response.getStatus());
        assertEquals(new BigDecimal("500.00"), response.getTotalValue());

        ArgumentCaptor<UserHoldings> holdingsCaptor = ArgumentCaptor.forClass(UserHoldings.class);
        verify(userHoldingsRepo).save(holdingsCaptor.capture());
        UserHoldings saved = holdingsCaptor.getValue();

        assertEquals(15, saved.getQuantityHeld());
        assertEquals(new BigDecimal("100.00"), saved.getAverageBuyPrice());
    }

    @Test
    void placeOrder_buyWithNewHoldingAndMissingPortfolioCheckInCurrentCode_createsHolding() {
        Long userId = 13L;
        OrderRequest request = orderRequest(1L, 5L, OrderType.BUY, 3);

        StockPrice beforeTrade = stockPrice(1L, "100.00");
        StockPrice afterTrade = stockPrice(1L, "102.00");

        when(priceService.getStockByCompanyId(1L)).thenReturn(beforeTrade, afterTrade);
        when(userHoldingsRepo.findByUserIdAndCompanyIdAndPortfolioId(userId, 1L, 5L)).thenReturn(Optional.empty());
        when(portfolioRepo.existsById(5L)).thenReturn(true);
        when(walletService.getWallet(userId)).thenReturn(
                wissen.daemonops.sharemarket.models.Wallet.builder().balance(new BigDecimal("10000.00")).build());
        when(orderRepo.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userHoldingsRepo.save(any(UserHoldings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.placeOrder(request, userId);

        assertEquals(OrderStatus.EXECUTED, response.getStatus());
        ArgumentCaptor<UserHoldings> holdingsCaptor = ArgumentCaptor.forClass(UserHoldings.class);
        verify(userHoldingsRepo).save(holdingsCaptor.capture());
        assertEquals(5L, holdingsCaptor.getValue().getPortfolioId());
    }

    @Test
    void placeOrder_buyWithPortfolioExistingInCurrentCode_throwsIllegalArgumentException() {
        Long userId = 14L;
        OrderRequest request = orderRequest(1L, 6L, OrderType.BUY, 1);

        StockPrice beforeTrade = stockPrice(1L, "100.00");
        StockPrice afterTrade = stockPrice(1L, "101.00");

        when(priceService.getStockByCompanyId(1L)).thenReturn(beforeTrade, afterTrade);
        when(userHoldingsRepo.findByUserIdAndCompanyIdAndPortfolioId(userId, 1L, 6L)).thenReturn(Optional.empty());
        when(portfolioRepo.existsById(6L)).thenReturn(false);
        when(orderRepo.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.placeOrder(request, userId));

        assertTrue(ex.getMessage().contains("No such Portfolio found"));
    }

    @Test
    void placeOrder_sellWithExactQuantity_deletesHolding() {
        Long userId = 15L;
        OrderRequest request = orderRequest(1L, 7L, OrderType.SELL, 5);

        StockPrice beforeTrade = stockPrice(1L, "100.00");
        StockPrice afterTrade = stockPrice(1L, "98.00");
        UserHoldings existing = UserHoldings.builder()
                .userId(userId)
                .companyId(1L)
                .portfolioId(7L)
                .quantityHeld(5)
                .averageBuyPrice(new BigDecimal("80.00"))
                .build();

        when(priceService.getStockByCompanyId(1L)).thenReturn(beforeTrade, afterTrade);
        when(userHoldingsRepo.findByUserIdAndCompanyIdAndPortfolioId(userId, 1L, 7L)).thenReturn(Optional.of(existing));
        when(orderRepo.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.placeOrder(request, userId);

        assertEquals(OrderStatus.EXECUTED, response.getStatus());
        verify(userHoldingsRepo).delete(existing);
    }

    @Test
    void getOrderHistory_returnsOrdersFromRepo() {
        Long userId = 99L;
        List<Order> orders = List.of(Order.builder().userId(userId).companyId(1L).build());
        when(orderRepo.findByUserId(userId)).thenReturn(orders);

        List<Order> result = orderService.getOrderHistory(userId);

        assertEquals(1, result.size());
        assertEquals(userId, result.get(0).getUserId());
    }

    private OrderRequest orderRequest(Long companyId, Long portfolioId, OrderType orderType, int quantity) {
        OrderRequest request = new OrderRequest();
        request.setCompanyId(companyId);
        request.setPortfolioId(portfolioId);
        request.setOrderType(orderType);
        request.setQuantity(quantity);
        return request;
    }

    private StockPrice stockPrice(Long companyId, String price) {
        return StockPrice.builder()
                .companyId(companyId)
                .currentPrice(new BigDecimal(price))
                .openPriceToday(new BigDecimal(price))
                .highToday(new BigDecimal(price))
                .lowToday(new BigDecimal(price))
                .build();
    }
}
