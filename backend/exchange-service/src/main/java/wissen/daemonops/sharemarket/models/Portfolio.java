package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "user_portfolios")
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "user_id", nullable = false)
    private Long userId;

}
