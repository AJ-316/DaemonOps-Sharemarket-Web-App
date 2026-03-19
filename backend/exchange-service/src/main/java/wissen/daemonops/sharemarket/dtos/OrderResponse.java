package wissen.daemonops.sharemarket.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;
import wissen.daemonops.sharemarket.models.OrderStatus;
import wissen.daemonops.sharemarket.models.OrderType;

@Data
@Builder
public class OrderResponse {
    private Long orderId;
    private Long companyId;
    private Long portfolioId;
    private OrderType orderType;
    private Integer quantity;
    private BigDecimal priceAtOrder;
    private BigDecimal totalValue;
    private OrderStatus status;
    private String rejectionReason;
    private LocalDateTime timestamp;
}
