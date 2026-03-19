package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long companyId;

    @Column(name = "portfolio_id")
    private Long portfolioId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderType orderType; // BUY or SELL

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtOrder;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalValue; // quantity * priceAtOrder

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status; // EXECUTED or REJECTED

    private String rejectionReason; // null if executed

    @Column(nullable = false)
    private LocalDateTime timestamp;
}