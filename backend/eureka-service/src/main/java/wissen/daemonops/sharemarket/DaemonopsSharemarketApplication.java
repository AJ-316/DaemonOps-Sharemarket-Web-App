package wissen.daemonops.sharemarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer; // ← ADD THIS

@SpringBootApplication
@EnableEurekaServer
public class DaemonopsSharemarketApplication {

	public static void main(String[] args) {
		SpringApplication.run(DaemonopsSharemarketApplication.class, args);
	}

}
