package wissen.daemonops.sharemarket.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wissen.daemonops.sharemarket.dtos.OrderRequest;
import wissen.daemonops.sharemarket.dtos.OrderResponse;
import wissen.daemonops.sharemarket.dtos.PortfolioDto;
import wissen.daemonops.sharemarket.exceptions.TradeRejectedException;
import wissen.daemonops.sharemarket.models.*;
import wissen.daemonops.sharemarket.repos.OrderRepo;
import wissen.daemonops.sharemarket.repos.PortfolioRepo;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;
import wissen.daemonops.sharemarket.repos.UserHoldingsRepo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private PortfolioRepo portfolioRepo;

    public String createPortfolio(PortfolioDto portfolioDto) {
        if(portfolioRepo.existsByNameIgnoreCase(portfolioDto.name()))
            throw new IllegalArgumentException("Portfolio with name " + portfolioDto.name() + " already exists");

        Portfolio p = new Portfolio();
        p.setName(portfolioDto.name());
        portfolioRepo.save(p);
        return "Successfully created Portfolio";
    }

    public List<Portfolio> getUserPortfolio(Long userId) {
        return portfolioRepo.findAllByUserId(userId);
    }
}