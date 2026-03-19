package wissen.daemonops.sharemarket.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wissen.daemonops.sharemarket.dtos.PendingOrderDto;
import wissen.daemonops.sharemarket.models.Notification;
import wissen.daemonops.sharemarket.models.PendingOrder;
import wissen.daemonops.sharemarket.repos.NotificationRepo;
import wissen.daemonops.sharemarket.services.PendingOrderService;

import java.util.List;

@RestController
@RequestMapping("/pending-orders")
@RequiredArgsConstructor
public class PendingOrderController {

    private final PendingOrderService pendingOrderService;
    private final NotificationRepo notificationRepo;

    // Create a stop-loss or limit-buy order
    @PostMapping
    public ResponseEntity<PendingOrder> create(
            @RequestBody PendingOrderDto dto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(pendingOrderService.create(dto, userId));
    }

    // Cancel a pending order
    @DeleteMapping("/{id}")
    public ResponseEntity<String> cancel(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        pendingOrderService.cancel(id, userId);
        return ResponseEntity.ok("Cancelled");
    }

    // Get all active pending orders for user
    @GetMapping
    public ResponseEntity<List<PendingOrder>> getActive(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) Long portfolioId) {
        if (portfolioId != null) {
            return ResponseEntity.ok(pendingOrderService.getActiveByPortfolio(userId, portfolioId));
        }
        return ResponseEntity.ok(pendingOrderService.getActive(userId));
    }

    // ── Notifications ──────────────────────────────────────────────────────

    // Poll for unread notifications (frontend calls every 3s)
    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationRepo.findByUserIdAndReadFalse(userId));
    }

    // Mark all notifications as read
    @PostMapping("/notifications/read")
    public ResponseEntity<String> markRead(
            @RequestHeader("X-User-Id") Long userId) {
        List<Notification> unread = notificationRepo.findByUserIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepo.saveAll(unread);
        return ResponseEntity.ok("Marked as read");
    }
}
