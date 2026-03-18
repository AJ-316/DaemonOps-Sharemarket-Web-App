package wissen.daemonops.sharemarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class DaemonopsSharemarketApplication {

    private final JwtAuthFilter jwtAuthFilter;

    public DaemonopsSharemarketApplication(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    public static void main(String[] args) {
        SpringApplication.run(DaemonopsSharemarketApplication.class, args);
    }

    @Bean
    RouteLocator myCustomRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

            .route("auth_route", r -> r
                    .path("/api/auth/**")
                    .uri("lb://auth-service"))

            .route("company_route", r -> r
                    .path("/companies/**")
                    .filters(f -> f.filter(jwtAuthFilter.apply(new JwtAuthFilter.Config())))
                    .uri("lb://company-service"))

            .route("order_route", r -> r
                    .path("/orders/**")
                    .filters(f -> f.filter(jwtAuthFilter.apply(new JwtAuthFilter.Config())))
                    .uri("lb://exchange-service"))

            .route("portfolio_route", r -> r
                    .path("/portfolio/**")
                    .filters(f -> f.filter(jwtAuthFilter.apply(new JwtAuthFilter.Config())))
                    .uri("lb://exchange-service"))

            .route("stock_route", r -> r
                    .path("/stocks/**")
                    .filters(f -> f.filter(jwtAuthFilter.apply(new JwtAuthFilter.Config())))
                    .uri("lb://exchange-service"))

            .build();
    }
}