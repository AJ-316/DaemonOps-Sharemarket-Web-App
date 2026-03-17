package wissen.daemonops.sharemarket.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.models.Portfolio;
import wissen.daemonops.sharemarket.services.PortfolioService;

@RestController
@RequestMapping("/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping
    public ResponseEntity<List<Portfolio>> getPortfolio(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(portfolioService.getUserPortfolio(userId));
    }
}