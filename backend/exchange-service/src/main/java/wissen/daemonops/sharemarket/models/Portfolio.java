package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_portfolio")
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long portfolio_id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long userId;

    private Long quantityHeld = 0L;
    private Double averageBuyPrice = 0D;

    private LocalDateTime lastUpdated;
}
