package wissen.daemonops.sharemarket.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

// Add this class OR just put @EnableScheduling on your main Application class
@Configuration
@EnableScheduling
public class SchedulingConfig {
    // No additional config needed — just enabling the @Scheduled annotation support
}