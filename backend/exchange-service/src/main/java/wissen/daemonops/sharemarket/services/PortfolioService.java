package wissen.daemonops.sharemarket.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wissen.daemonops.sharemarket.dtos.PortfolioDto;
import wissen.daemonops.sharemarket.models.Portfolio;
import wissen.daemonops.sharemarket.repos.PortfolioRepo;

import java.util.List;

@Service
@RequiredArgsConstructor  // generates constructor injection for ALL final fields
public class PortfolioService {

    private final PortfolioRepo portfolioRepo;  // was missing 'final' → never injected → NPE

    public String createPortfolio(PortfolioDto portfolioDto, Long userId) {
        if (portfolioRepo.existsByNameIgnoreCase(portfolioDto.name()))
            throw new IllegalArgumentException("Portfolio '" + portfolioDto.name() + "' already exists");

        Portfolio p = new Portfolio();
        p.setName(portfolioDto.name());
        p.setUserId(userId);          // was never set before
        portfolioRepo.save(p);
        return "Successfully created Portfolio";
    }

    public List<Portfolio> getUserPortfolio(Long userId) {
        return portfolioRepo.findAllByUserId(userId);
    }

    public void deletePortfolio(Long portfolioId, Long userId) {
    Portfolio p = portfolioRepo.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("Portfolio not found: " + portfolioId));
    if (!p.getUserId().equals(userId)) {
        throw new IllegalArgumentException("Not your portfolio");
    }
    portfolioRepo.deleteById(portfolioId);
}
 
}