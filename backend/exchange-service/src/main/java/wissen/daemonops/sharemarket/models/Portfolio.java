package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "portfolio",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "company_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Integer quantityHeld;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal averageBuyPrice;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;
}