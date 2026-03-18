package wissen.daemonops.sharemarket.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.dtos.PortfolioDto;
import wissen.daemonops.sharemarket.models.Portfolio;
import wissen.daemonops.sharemarket.models.UserHoldings;
import wissen.daemonops.sharemarket.services.PortfolioService;
import wissen.daemonops.sharemarket.services.UserHoldingsService;

@RestController
//@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/portfolio")
@RequiredArgsConstructor
public class UserHoldingsController {

    private final UserHoldingsService userHoldingsService;
    private final PortfolioService portfolioService;

    @GetMapping("/holdings/{portfolioId}")
    public ResponseEntity<List<UserHoldings>> getPortfolio(@RequestHeader("X-User-Id") Long userId, @PathVariable Long portfolioId) {
        return ResponseEntity.ok(userHoldingsService.getUserPortfolio(userId, portfolioId));
    }

    @GetMapping
    public ResponseEntity<List<Portfolio>> getPortfolio(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(portfolioService.getUserPortfolio(userId));
    }

    @PostMapping
    public ResponseEntity<String> createPortfolio(
            @RequestBody PortfolioDto portfolioDto,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(portfolioService.createPortfolio(portfolioDto, userId));
    }
}