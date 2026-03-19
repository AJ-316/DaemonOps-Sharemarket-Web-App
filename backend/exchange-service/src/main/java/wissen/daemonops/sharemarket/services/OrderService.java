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
import wissen.daemonops.sharemarket.models.*;
import wissen.daemonops.sharemarket.repos.OrderRepo;
import wissen.daemonops.sharemarket.repos.PortfolioRepo;
import wissen.daemonops.sharemarket.repos.UserHoldingsRepo;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepo orderRepo;
    private final UserHoldingsRepo userHoldingsRepo;
    private final PortfolioRepo portfolioRepo;
    private final StockPriceRepo stockPriceRepo;
    private final PriceService priceService;
    private final WalletService walletService; // ← added

    public OrderResponse placeOrder(OrderRequest request, Long userId) {

        StockPrice stock = priceService.getStockByCompanyId(request.getCompanyId());

        // SELL check — scoped to specific portfolio
        if (request.getOrderType() == OrderType.SELL) {
            UserHoldings userHoldings = userHoldingsRepo
                    .findByUserIdAndCompanyIdAndPortfolioId(
                            userId, request.getCompanyId(), request.getPortfolioId())
                    .orElse(null);

            if (userHoldings == null || userHoldings.getQuantityHeld() < request.getQuantity()) {
                BigDecimal totalValue = stock.getCurrentPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
                Order rejected = Order.builder()
                        .userId(userId)
                        .companyId(request.getCompanyId())
                        .portfolioId(request.getPortfolioId())
                        .orderType(request.getOrderType())
                        .quantity(request.getQuantity())
                        .priceAtOrder(stock.getCurrentPrice())
                        .totalValue(totalValue)
                        .status(OrderStatus.REJECTED)
                        .rejectionReason("Insufficient shares to sell")
                        .timestamp(LocalDateTime.now())
                        .build();
                orderRepo.save(rejected);
                return buildResponse(rejected);
            }
        }

        // BUY — check wallet has enough balance BEFORE executing
        if (request.getOrderType() == OrderType.BUY) {
            BigDecimal estimatedCost = stock.getCurrentPrice()
                    .multiply(BigDecimal.valueOf(request.getQuantity()));
            try {
                walletService.getWallet(userId); // auto-creates if missing
                BigDecimal balance = walletService.getWallet(userId).getBalance();
                if (balance.compareTo(estimatedCost) < 0) {
                    Order rejected = Order.builder()
                            .userId(userId)
                            .companyId(request.getCompanyId())
                            .portfolioId(request.getPortfolioId())
                            .orderType(request.getOrderType())
                            .quantity(request.getQuantity())
                            .priceAtOrder(stock.getCurrentPrice())
                            .totalValue(estimatedCost)
                            .status(OrderStatus.REJECTED)
                            .rejectionReason("Insufficient wallet balance. Required: ₹" + estimatedCost.toPlainString()
                                    + ", Available: ₹" + balance.toPlainString())
                            .timestamp(LocalDateTime.now())
                            .build();
                    orderRepo.save(rejected);
                    return buildResponse(rejected);
                }
            } catch (Exception ignored) {
            }
        }

        StockPrice updatedStock = priceService.getStockByCompanyId(request.getCompanyId());
        BigDecimal totalValue = stock.getCurrentPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        // ── Transaction Logic ──
        // 1. Calculate price movement (for the NEXT trade)
        try {
            priceService.updatePriceAfterTrade(request.getCompanyId(), request.getOrderType());
        } catch (TradeRejectedException e) {
            Order rejected = Order.builder()
                    .userId(userId)
                    .companyId(request.getCompanyId())
                    .portfolioId(request.getPortfolioId())
                    .orderType(request.getOrderType())
                    .quantity(request.getQuantity())
                    .priceAtOrder(stock.getCurrentPrice())
                    .totalValue(totalValue)
                    .status(OrderStatus.REJECTED)
                    .rejectionReason(e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .build();
            orderRepo.save(rejected);
            return buildResponse(rejected);
        }

        // 2. Final balance check & deduction (mandatory)
        try {
            if (request.getOrderType() == OrderType.BUY) {
                walletService.deduct(userId, totalValue);
            } else {
                walletService.credit(userId, totalValue);
            }
        } catch (Exception e) {
            Order rejected = Order.builder()
                    .userId(userId)
                    .companyId(request.getCompanyId())
                    .portfolioId(request.getPortfolioId())
                    .orderType(request.getOrderType())
                    .quantity(request.getQuantity())
                    .priceAtOrder(stock.getCurrentPrice())
                    .totalValue(totalValue)
                    .status(OrderStatus.REJECTED)
                    .rejectionReason(e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .build();
            orderRepo.save(rejected);
            return buildResponse(rejected);
        }

        // 3. Save executed order
        Order order = Order.builder()
                .userId(userId)
                .companyId(request.getCompanyId())
                .portfolioId(request.getPortfolioId())
                .orderType(request.getOrderType())
                .quantity(request.getQuantity())
                .priceAtOrder(stock.getCurrentPrice())
                .totalValue(totalValue)
                .status(OrderStatus.EXECUTED)
                .timestamp(LocalDateTime.now())
                .build();
        orderRepo.save(order);

        // 4. Update holdings
        updatePortfolio(userId, request, stock.getCurrentPrice());

        return buildResponse(order);
    }

    private void updatePortfolio(Long userId, OrderRequest request, BigDecimal tradePrice) {
        Optional<UserHoldings> existing = userHoldingsRepo
                .findByUserIdAndCompanyIdAndPortfolioId(
                        userId, request.getCompanyId(), request.getPortfolioId());

        if (request.getOrderType() == OrderType.BUY) {
            if (existing.isPresent()) {
                UserHoldings p = existing.get();
                int newQty = p.getQuantityHeld() + request.getQuantity();
                BigDecimal totalCost = p.getAverageBuyPrice()
                        .multiply(BigDecimal.valueOf(p.getQuantityHeld()))
                        .add(tradePrice.multiply(BigDecimal.valueOf(request.getQuantity())));
                BigDecimal newAvg = totalCost.divide(
                        BigDecimal.valueOf(newQty), 2, RoundingMode.HALF_UP);
                p.setQuantityHeld(newQty);
                p.setAverageBuyPrice(newAvg);
                p.setLastUpdated(LocalDateTime.now());
                userHoldingsRepo.save(p);
            } else {
                if (!portfolioRepo.existsById(request.getPortfolioId())) {
                    throw new IllegalArgumentException(
                            "No such Portfolio found: " + request.getPortfolioId());
                }
                UserHoldings p = UserHoldings.builder()
                        .userId(userId)
                        .portfolioId(request.getPortfolioId())
                        .companyId(request.getCompanyId())
                        .quantityHeld(request.getQuantity())
                        .averageBuyPrice(tradePrice)
                        .lastUpdated(LocalDateTime.now())
                        .build();
                userHoldingsRepo.save(p);
            }
        } else {
            existing.ifPresent(p -> {
                int newQty = p.getQuantityHeld() - request.getQuantity();
                if (newQty == 0) {
                    userHoldingsRepo.delete(p);
                } else {
                    p.setQuantityHeld(newQty);
                    p.setLastUpdated(LocalDateTime.now());
                    userHoldingsRepo.save(p);
                }
            });
        }
    }

    public List<Order> getOrderHistory(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    public List<Order> getOrderHistoryByPortfolio(Long userId, Long portfolioId) {
        return orderRepo.findByUserIdAndPortfolioId(userId, portfolioId);
    }

    private OrderResponse buildResponse(Order order) {
        return OrderResponse.builder()
                .orderId(order.getId())
                .companyId(order.getCompanyId())
                .portfolioId(order.getPortfolioId())
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