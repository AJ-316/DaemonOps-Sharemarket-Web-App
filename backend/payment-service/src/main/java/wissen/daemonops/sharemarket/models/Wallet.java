package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "wallets")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    // email stored here so we can send withdrawal notifications without calling
    // auth-service
    @Column
    private String email;

    @Column(nullable = false)
    private BigDecimal balance;

    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
}
