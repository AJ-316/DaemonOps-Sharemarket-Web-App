package wissen.daemonops.sharemarket.services;

import org.springframework.stereotype.Service;
import wissen.daemonops.sharemarket.repos.PortfolioRepo;
import wissen.daemonops.sharemarket.repos.StockPriceRepo;

@Service
public class ExchangeService {

    private final PortfolioRepo portfolioRepo;
    private final StockPriceRepo stockPriceRepo;

    public ExchangeService(PortfolioRepo portfolioRepo, StockPriceRepo stockPriceRepo) {
        this.portfolioRepo = portfolioRepo;
        this.stockPriceRepo = stockPriceRepo;
    }


}
