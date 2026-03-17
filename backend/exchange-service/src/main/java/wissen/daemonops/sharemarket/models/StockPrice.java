package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;


import java.time.LocalDateTime;

@Entity
@Table(name = "company_stock_prices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long companyId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal currentPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal openPriceToday;      // set at market open, never changes that day

    @Column(precision = 10, scale = 2)
    private BigDecimal highToday;

    @Column(precision = 10, scale = 2)
    private BigDecimal lowToday;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;
}