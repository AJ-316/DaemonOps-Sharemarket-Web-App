package wissen.daemonops.sharemarket.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wissen.daemonops.sharemarket.dtos.OrderRequest;
import wissen.daemonops.sharemarket.dtos.PendingOrderDto;
import wissen.daemonops.sharemarket.models.Notification;
import wissen.daemonops.sharemarket.models.PendingOrder;
import wissen.daemonops.sharemarket.models.StockPrice;
import wissen.daemonops.sharemarket.repos.NotificationRepo;
import wissen.daemonops.sharemarket.repos.PendingOrderRepo;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PendingOrderService {

    private final PendingOrderRepo pendingOrderRepo;
    private final StockPriceRepo stockPriceRepo;
    private final OrderService orderService;
    private final NotificationRepo notificationRepo;

    public PendingOrder create(PendingOrderDto dto, Long userId) {
        PendingOrder p = PendingOrder.builder()
                .userId(userId)
                .companyId(dto.companyId())
                .portfolioId(dto.portfolioId())
                .type(dto.type())           // String: "STOP_LOSS" or "LIMIT_BUY"
                .quantity(dto.quantity())
                .triggerPrice(dto.triggerPrice())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();
        return pendingOrderRepo.save(p);
    }

    public void cancel(Long pendingOrderId, Long userId) {
        PendingOrder p = pendingOrderRepo.findById(pendingOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Pending order not found"));
        if (!p.getUserId().equals(userId))
            throw new IllegalArgumentException("Not your order");
        p.setStatus("CANCELLED");
        pendingOrderRepo.save(p);
    }

    public List<PendingOrder> getActive(Long userId) {
        return pendingOrderRepo.findByUserIdAndStatus(userId, "ACTIVE");
    }

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void checkTriggers() {
        List<PendingOrder> active = pendingOrderRepo.findByStatus("ACTIVE");
        if (active.isEmpty()) return;

        for (PendingOrder pending : active) {
            try {
                StockPrice stock = stockPriceRepo.findByCompanyId(pending.getCompanyId())
                        .orElse(null);
                if (stock == null) continue;

                boolean shouldTrigger = false;
                if ("STOP_LOSS".equals(pending.getType())) {
                    // Sell when price falls to or below triggerPrice
                    shouldTrigger = stock.getCurrentPrice()
                            .compareTo(pending.getTriggerPrice()) <= 0;
                } else if ("LIMIT_BUY".equals(pending.getType())) {
                    // Buy when price rises to or above triggerPrice
                    shouldTrigger = stock.getCurrentPrice()
                            .compareTo(pending.getTriggerPrice()) >= 0;
                }

                if (shouldTrigger) {
                    executeTrigger(pending, stock);
                }
            } catch (Exception e) {
                log.error("Error processing pending order {}: {}", pending.getId(), e.getMessage());
            }
        }
    }

    private void executeTrigger(PendingOrder pending, StockPrice stock) {
        String orderType = "STOP_LOSS".equals(pending.getType()) ? "SELL" : "BUY";

        OrderRequest req = new OrderRequest();
        req.setCompanyId(pending.getCompanyId());
        req.setPortfolioId(pending.getPortfolioId());
        req.setOrderType(wissen.daemonops.sharemarket.models.OrderType.valueOf(orderType));
        req.setQuantity(pending.getQuantity());

        try {
            orderService.placeOrder(req, pending.getUserId());

            pending.setStatus("TRIGGERED");
            pending.setTriggeredAt(LocalDateTime.now());
            pendingOrderRepo.save(pending);

            String action = "SELL".equals(orderType) ? "sold" : "bought";
            String typeName = "STOP_LOSS".equals(pending.getType()) ? "Stop Loss" : "Limit Buy";
            String msg = String.format(
                    "%s triggered: %s %d shares at ₹%.2f (trigger was ₹%.2f)",
                    typeName, action, pending.getQuantity(),
                    stock.getCurrentPrice(), pending.getTriggerPrice()
            );

            notificationRepo.save(Notification.builder()
                    .userId(pending.getUserId())
                    .message(msg)
                    .read(false)
                    .createdAt(LocalDateTime.now())
                    .build());

            log.info("Triggered {} for user {} at {}", pending.getType(),
                    pending.getUserId(), stock.getCurrentPrice());

        } catch (Exception e) {
            log.error("Failed to execute triggered order {}: {}", pending.getId(), e.getMessage());
        }
    }
}