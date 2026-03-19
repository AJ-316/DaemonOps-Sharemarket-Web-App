package wissen.daemonops.sharemarket.dtos;

import java.math.BigDecimal;

public record PendingOrderDto(
        Long companyId,
        Long portfolioId,
        String type,          // "STOP_LOSS" or "LIMIT_BUY"
        Integer quantity,
        BigDecimal triggerPrice
) {}