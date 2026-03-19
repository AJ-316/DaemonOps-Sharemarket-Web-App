package wissen.daemonops.sharemarket.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.dtos.OrderRequest;
import wissen.daemonops.sharemarket.dtos.OrderResponse;
import wissen.daemonops.sharemarket.models.Order;
import wissen.daemonops.sharemarket.services.OrderService;

@RestController
// @CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final wissen.daemonops.sharemarket.services.PendingOrderService pendingOrderService;

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @RequestBody OrderRequest request,
            @RequestHeader("X-User-Id") Long userId) {

        if ("LIMIT".equalsIgnoreCase(request.getPriceType())) {
            // Convert OrderRequest to PendingOrderDto
            wissen.daemonops.sharemarket.dtos.PendingOrderDto dto = new wissen.daemonops.sharemarket.dtos.PendingOrderDto(
                    request.getCompanyId(),
                    request.getPortfolioId(),
                    request.getOrderType() == wissen.daemonops.sharemarket.models.OrderType.BUY ? "LIMIT_BUY"
                            : "STOP_LOSS",
                    request.getQuantity(),
                    request.getLimitPrice());
            pendingOrderService.create(dto, userId);

            // Return a PENDING response
            return ResponseEntity.ok(OrderResponse.builder()
                    .companyId(request.getCompanyId())
                    .portfolioId(request.getPortfolioId())
                    .orderType(request.getOrderType())
                    .quantity(request.getQuantity())
                    .priceAtOrder(request.getLimitPrice())
                    .totalValue(request.getLimitPrice().multiply(java.math.BigDecimal.valueOf(request.getQuantity())))
                    .status(wissen.daemonops.sharemarket.models.OrderStatus.PENDING)
                    .timestamp(java.time.LocalDateTime.now())
                    .build());
        }

        return ResponseEntity.ok(orderService.placeOrder(request, userId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Order>> getOrderHistory(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) Long portfolioId) {
        if (portfolioId != null) {
            return ResponseEntity.ok(orderService.getOrderHistoryByPortfolio(userId, portfolioId));
        }
        return ResponseEntity.ok(orderService.getOrderHistory(userId));
    }
}
