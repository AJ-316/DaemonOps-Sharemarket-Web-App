package wissen.daemonops.sharemarket.services;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.models.Portfolio;
import wissen.daemonops.sharemarket.repos.PortfolioRepo;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepo portfolioRepo;

    public List<Portfolio> getUserPortfolio(Long userId) {
        return portfolioRepo.findByUserId(userId);
    }
}
