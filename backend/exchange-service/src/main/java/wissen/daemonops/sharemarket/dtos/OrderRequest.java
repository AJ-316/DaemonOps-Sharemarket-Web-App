package wissen.daemonops.sharemarket.dtos;

import lombok.Data;
import wissen.daemonops.sharemarket.models.OrderType;

@Data
public class OrderRequest {
    private Long companyId;
    private Long portfolioId;
    private OrderType orderType;
    private Integer quantity;
    private String priceType; // "MARKET" or "LIMIT"
    private java.math.BigDecimal limitPrice;
}
