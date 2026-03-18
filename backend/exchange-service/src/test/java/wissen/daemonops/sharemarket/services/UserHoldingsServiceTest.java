package wissen.daemonops.sharemarket.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wissen.daemonops.sharemarket.models.UserHoldings;
import wissen.daemonops.sharemarket.repos.UserHoldingsRepo;

@ExtendWith(MockitoExtension.class)
class UserHoldingsServiceTest {

    @Mock
    private UserHoldingsRepo userHoldingsRepo;

    @InjectMocks
    private UserHoldingsService userHoldingsService;

    @Test
    void getUserPortfolio_returnsHoldingsForUserAndPortfolio() {
        UserHoldings holding = UserHoldings.builder()
                .userId(1L)
                .portfolioId(2L)
                .companyId(3L)
                .quantityHeld(10)
                .averageBuyPrice(new BigDecimal("25.50"))
                .build();

        when(userHoldingsRepo.findByUserIdAndPortfolioId(1L, 2L)).thenReturn(List.of(holding));

        List<UserHoldings> result = userHoldingsService.getUserPortfolio(1L, 2L);

        assertEquals(1, result.size());
        assertEquals(3L, result.get(0).getCompanyId());
    }
}

