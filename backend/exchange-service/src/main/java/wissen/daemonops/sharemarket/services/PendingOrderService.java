package wissen.daemonops.sharemarket.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wissen.daemonops.sharemarket.dtos.OrderRequest;
import wissen.daemonops.sharemarket.dtos.OrderResponse;
import wissen.daemonops.sharemarket.dtos.PendingOrderDto;
import wissen.daemonops.sharemarket.models.*;
import wissen.daemonops.sharemarket.repos.NotificationRepo;
import wissen.daemonops.sharemarket.repos.OrderRepo;
import wissen.daemonops.sharemarket.repos.PendingOrderRepo;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PendingOrderService {

    private final PendingOrderRepo pendingOrderRepo;
    private final StockPriceRepo stockPriceRepo;
    private final OrderService orderService;
    private final OrderRepo orderRepo;
    private final NotificationRepo notificationRepo;

    public PendingOrder create(PendingOrderDto dto, Long userId) {
        PendingOrder p = PendingOrder.builder()
                .userId(userId)
                .companyId(dto.companyId())
                .portfolioId(dto.portfolioId())
                .type(dto.type())
                .quantity(dto.quantity())
                .triggerPrice(dto.triggerPrice())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
        return pendingOrderRepo.save(p);
    }

    // Cancel: mark as CANCELLED and save a REJECTED order so it shows in order
    // history
    public void cancel(Long pendingOrderId, Long userId) {
        PendingOrder p = pendingOrderRepo.findById(pendingOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Pending order not found"));
        if (!p.getUserId().equals(userId))
            throw new IllegalArgumentException("Not your order");

        p.setStatus("CANCELLED");
        pendingOrderRepo.save(p);

        // Save a REJECTED order so it appears in order history
        StockPrice stock = stockPriceRepo.findByCompanyId(p.getCompanyId()).orElse(null);
        BigDecimal price = stock != null ? stock.getCurrentPrice() : p.getTriggerPrice();
        String orderType = "STOP_LOSS".equals(p.getType()) ? "SELL" : "BUY";

        Order rejected = Order.builder()
                .userId(userId)
                .companyId(p.getCompanyId())
                .portfolioId(p.getPortfolioId())
                .orderType(OrderType.valueOf(orderType))
                .quantity(p.getQuantity())
                .priceAtOrder(price)
                .totalValue(BigDecimal.ZERO)
                .status(OrderStatus.REJECTED)
                .rejectionReason("Cancelled by user (" + p.getType() + " trigger at ₹" + p.getTriggerPrice() + ")")
                .timestamp(LocalDateTime.now())
                .build();
        orderRepo.save(rejected);
    }

    public List<PendingOrder> getActive(Long userId) {
        return pendingOrderRepo.findByUserIdAndStatus(userId, "ACTIVE");
    }

    public List<PendingOrder> getActiveByPortfolio(Long userId, Long portfolioId) {
        return pendingOrderRepo.findByUserIdAndPortfolioIdAndStatus(userId, portfolioId, "ACTIVE");
    }

    public List<PendingOrder> getActiveByCompany(Long userId, Long companyId) {
        return pendingOrderRepo.findByUserIdAndCompanyIdAndStatus(userId, companyId, "ACTIVE");
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void checkTriggers() {
        List<PendingOrder> active = pendingOrderRepo.findByStatus("ACTIVE");
        if (active.isEmpty())
            return;

        for (PendingOrder pending : active) {
            try {
                StockPrice stock = stockPriceRepo.findByCompanyId(pending.getCompanyId()).orElse(null);
                if (stock == null)
                    continue;

                boolean shouldTrigger = false;
                if ("STOP_LOSS".equals(pending.getType())) {
                    shouldTrigger = stock.getCurrentPrice().compareTo(pending.getTriggerPrice()) <= 0;
                } else if ("LIMIT_BUY".equals(pending.getType())) {
                    shouldTrigger = stock.getCurrentPrice().compareTo(pending.getTriggerPrice()) <= 0;
                }

                if (shouldTrigger)
                    executeTrigger(pending, stock);

            } catch (Exception e) {
                log.error("Error processing pending order {}: {}", pending.getId(), e.getMessage());
            }
        }
    }

    private void executeTrigger(PendingOrder pending, StockPrice stock) {
        String orderType = "STOP_LOSS".equals(pending.getType()) ? "SELL" : "BUY";

        // Re-fetch the LATEST price to guard against race conditions with the
        // background fluctuator. If the price has moved out of range since the
        // scheduler check, skip this cycle — the order remains ACTIVE and will
        // be re-evaluated next second.
        StockPrice latestStock = stockPriceRepo.findByCompanyId(pending.getCompanyId()).orElse(null);
        if (latestStock == null)
            return;

        boolean stillValid = false;
        if ("STOP_LOSS".equals(pending.getType())) {
            stillValid = latestStock.getCurrentPrice().compareTo(pending.getTriggerPrice()) <= 0;
        } else if ("LIMIT_BUY".equals(pending.getType())) {
            stillValid = latestStock.getCurrentPrice().compareTo(pending.getTriggerPrice()) <= 0;
        }

        if (!stillValid) {
            log.info("Trigger #{} ({}) skipped — price ₹{} moved above trigger ₹{} before execution",
                    pending.getId(), pending.getType(),
                    latestStock.getCurrentPrice(), pending.getTriggerPrice());
            return;
        }

        OrderRequest req = new OrderRequest();
        req.setCompanyId(pending.getCompanyId());
        req.setPortfolioId(pending.getPortfolioId());
        req.setOrderType(OrderType.valueOf(orderType));
        req.setQuantity(pending.getQuantity());

        try {
            // This saves an EXECUTED order in order history automatically
            OrderResponse res = orderService.placeOrder(req, pending.getUserId());

            // Mark pending as TRIGGERED — removes from "ACTIVE" list
            pending.setStatus("TRIGGERED");
            pending.setTriggeredAt(LocalDateTime.now());
            pendingOrderRepo.save(pending);

            // Notification
            String action = "SELL".equals(orderType) ? "sold" : "bought";
            String typeName = "STOP_LOSS".equals(pending.getType()) ? "Stop Loss" : "Limit Buy";

            // Use the ACTUAL price at which it was ordered from the response
            BigDecimal fillPrice = res.getPriceAtOrder();

            String msg = String.format("%s triggered: %s %d shares at ₹%.2f (trigger was ₹%.2f)",
                    typeName, action, pending.getQuantity(),
                    fillPrice, pending.getTriggerPrice());

            notificationRepo.save(Notification.builder()
                    .userId(pending.getUserId())
                    .message(msg)
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build());

        } catch (Exception e) {
            log.error("Failed to execute triggered order {}: {}", pending.getId(), e.getMessage());
        }
    }
}