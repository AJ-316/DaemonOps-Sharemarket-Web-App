package wissen.daemonops.sharemarket.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wissen.daemonops.sharemarket.dtos.PortfolioDto;
import wissen.daemonops.sharemarket.models.Portfolio;
import wissen.daemonops.sharemarket.repos.PortfolioRepo;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock
    private PortfolioRepo portfolioRepo;

    @InjectMocks
    private PortfolioService portfolioService;

    private final Long TEST_USER_ID = 2L;

    @Test
    void createPortfolio_whenNameAlreadyExists_throwsIllegalArgumentException() {
        PortfolioDto dto = new PortfolioDto("Growth");
        when(portfolioRepo.existsByNameIgnoreCase("Growth")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> portfolioService.createPortfolio(dto, TEST_USER_ID));

        assertEquals("Portfolio 'Growth' already exists", ex.getMessage());
    }

    @Test
    void createPortfolio_whenNameIsUnique_savesAndReturnsSuccessMessage() {
        PortfolioDto dto = new PortfolioDto("LongTerm");
        when(portfolioRepo.existsByNameIgnoreCase("LongTerm")).thenReturn(false);

        String result = portfolioService.createPortfolio(dto, TEST_USER_ID);

        assertEquals("Successfully created Portfolio", result);
        ArgumentCaptor<Portfolio> captor = ArgumentCaptor.forClass(Portfolio.class);
        verify(portfolioRepo).save(captor.capture());
        assertEquals("LongTerm", captor.getValue().getName());
        assertEquals(TEST_USER_ID, captor.getValue().getUserId());
    }

    @Test
    void getUserPortfolio_returnsAllPortfoliosForUser() {
        Portfolio portfolio = new Portfolio();
        portfolio.setId(1L);
        portfolio.setName("Main");
        portfolio.setUserId(5L);
        when(portfolioRepo.findAllByUserId(5L)).thenReturn(List.of(portfolio));

        List<Portfolio> result = portfolioService.getUserPortfolio(5L);

        assertEquals(1, result.size());
        assertEquals("Main", result.get(0).getName());
    }
}