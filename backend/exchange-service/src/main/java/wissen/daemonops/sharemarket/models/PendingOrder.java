package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    // "STOP_LOSS" or "LIMIT_BUY" — stored as String to avoid enum file naming issues on Windows
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "trigger_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal triggerPrice;

    // "ACTIVE", "TRIGGERED", "CANCELLED"
    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "triggered_at")
    private LocalDateTime triggeredAt;
}