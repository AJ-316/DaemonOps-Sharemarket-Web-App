package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_stock_price")
public class StockPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long stock_id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false, precision = 10, scale = 2)
    private Double openPriceToday;

    @Column(nullable = false, precision = 10, scale = 2)
    private Double currentPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private Double highToday = 0D;

    @Column(nullable = false, precision = 10, scale = 2)
    private Double lowToday = 0D;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;
}
