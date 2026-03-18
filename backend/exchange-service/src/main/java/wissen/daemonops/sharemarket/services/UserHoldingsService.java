package wissen.daemonops.sharemarket.services;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.models.UserHoldings;
import wissen.daemonops.sharemarket.repos.UserHoldingsRepo;

@Service
@RequiredArgsConstructor
public class UserHoldingsService {

    private final UserHoldingsRepo userHoldingsRepo;

    public List<UserHoldings> getUserPortfolio(Long userId, Long portfolioId) {
        return userHoldingsRepo.findByUserIdAndPortfolioId(userId, portfolioId);
    }
}
