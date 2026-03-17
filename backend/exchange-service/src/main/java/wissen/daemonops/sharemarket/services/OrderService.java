package wissen.daemonops.sharemarket.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.math.*;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.dtos.OrderRequest;
import wissen.daemonops.sharemarket.dtos.OrderResponse;
import wissen.daemonops.sharemarket.exceptions.TradeRejectedException;
import wissen.daemonops.sharemarket.models.Order;
import wissen.daemonops.sharemarket.models.OrderStatus;
import wissen.daemonops.sharemarket.models.OrderType;
import wissen.daemonops.sharemarket.models.Portfolio;
import wissen.daemonops.sharemarket.models.StockPrice;
import wissen.daemonops.sharemarket.repos.OrderRepo;
import wissen.daemonops.sharemarket.repos.PortfolioRepo;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepo orderRepo;
    private final PortfolioRepo portfolioRepo;
    private final StockPriceRepo stockPriceRepo;
    private final PriceService priceService;

    public OrderResponse placeOrder(OrderRequest request, Long userId) {

        StockPrice stock = priceService.getStockByCompanyId(request.getCompanyId());

        // SELL check — does user have enough shares?
        if (request.getOrderType() == OrderType.SELL) {
            Portfolio portfolio = portfolioRepo
                    .findByUserIdAndCompanyId(userId, request.getCompanyId())
                    .orElse(null);

            if (portfolio == null || portfolio.getQuantityHeld() < request.getQuantity()) {
                // Save rejected order
                Order rejected = Order.builder()
                        .userId(userId)
                        .companyId(request.getCompanyId())
                        .orderType(request.getOrderType())
                        .quantity(request.getQuantity())
                        .priceAtOrder(stock.getCurrentPrice())
                        .totalValue(BigDecimal.ZERO)
                        .status(OrderStatus.REJECTED)
                        .rejectionReason("Insufficient shares to sell")
                        .timestamp(LocalDateTime.now())
                        .build();
                orderRepo.save(rejected);

                return buildResponse(rejected);
            }
        }

        // Try updating price — this throws if 20% limit breached
        try {
            priceService.updatePriceAfterTrade(request.getCompanyId(), request.getOrderType());
        } catch (TradeRejectedException e) {
            Order rejected = Order.builder()
                    .userId(userId)
                    .companyId(request.getCompanyId())
                    .orderType(request.getOrderType())
                    .quantity(request.getQuantity())
                    .priceAtOrder(stock.getCurrentPrice())
                    .totalValue(BigDecimal.ZERO)
                    .status(OrderStatus.REJECTED)
                    .rejectionReason(e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .build();
            orderRepo.save(rejected);
            return buildResponse(rejected);
        }

        // Fetch updated price after trade
        StockPrice updatedStock = priceService.getStockByCompanyId(request.getCompanyId());
        BigDecimal totalValue = updatedStock.getCurrentPrice()
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        // Save executed order
        Order order = Order.builder()
                .userId(userId)
                .companyId(request.getCompanyId())
                .orderType(request.getOrderType())
                .quantity(request.getQuantity())
                .priceAtOrder(updatedStock.getCurrentPrice())
                .totalValue(totalValue)
                .status(OrderStatus.EXECUTED)
                .timestamp(LocalDateTime.now())
                .build();
        orderRepo.save(order);

        // Update portfolio
        updatePortfolio(userId, request, updatedStock.getCurrentPrice());

        return buildResponse(order);
    }

    private void updatePortfolio(Long userId, OrderRequest request, BigDecimal tradePrice) {
        Optional<Portfolio> existing = portfolioRepo
                .findByUserIdAndCompanyId(userId, request.getCompanyId());

        if (request.getOrderType() == OrderType.BUY) {
            if (existing.isPresent()) {
                Portfolio p = existing.get();
                int newQty = p.getQuantityHeld() + request.getQuantity();
                // Recalculate average buy price
                BigDecimal totalCost = p.getAverageBuyPrice()
                        .multiply(BigDecimal.valueOf(p.getQuantityHeld()))
                        .add(tradePrice.multiply(BigDecimal.valueOf(request.getQuantity())));
                BigDecimal newAvg = totalCost.divide(
                        BigDecimal.valueOf(newQty), 2, RoundingMode.HALF_UP);
                p.setQuantityHeld(newQty);
                p.setAverageBuyPrice(newAvg);
                p.setLastUpdated(LocalDateTime.now());
                portfolioRepo.save(p);
            } else {
                Portfolio p = Portfolio.builder()
                        .userId(userId)
                        .companyId(request.getCompanyId())
                        .quantityHeld(request.getQuantity())
                        .averageBuyPrice(tradePrice)
                        .lastUpdated(LocalDateTime.now())
                        .build();
                portfolioRepo.save(p);
            }
        } else {
            // SELL
            existing.ifPresent(p -> {
                int newQty = p.getQuantityHeld() - request.getQuantity();
                if (newQty == 0) {
                    portfolioRepo.delete(p);
                } else {
                    p.setQuantityHeld(newQty);
                    p.setLastUpdated(LocalDateTime.now());
                    portfolioRepo.save(p);
                }
            });
        }
    }

    public List<Order> getOrderHistory(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    private OrderResponse buildResponse(Order order) {
        return OrderResponse.builder()
                .orderId(order.getId())
                .companyId(order.getCompanyId())
                .orderType(order.getOrderType())
                .quantity(order.getQuantity())
                .priceAtOrder(order.getPriceAtOrder())
                .totalValue(order.getTotalValue())
                .status(order.getStatus())
                .rejectionReason(order.getRejectionReason())
                .timestamp(order.getTimestamp())
                .build();
    }
}