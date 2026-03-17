package wissen.daemonops.sharemarket.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.dtos.OrderRequest;
import wissen.daemonops.sharemarket.dtos.OrderResponse;
import wissen.daemonops.sharemarket.models.Order;
import wissen.daemonops.sharemarket.services.OrderService;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @RequestBody OrderRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(orderService.placeOrder(request, userId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Order>> getOrderHistory(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(orderService.getOrderHistory(userId));
    }
}
