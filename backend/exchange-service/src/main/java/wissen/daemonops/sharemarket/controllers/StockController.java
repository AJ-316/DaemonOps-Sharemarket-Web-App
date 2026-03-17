package wissen.daemonops.sharemarket.controllers;

import java.util.List;
import java.math.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import wissen.daemonops.sharemarket.models.StockPrice;
import wissen.daemonops.sharemarket.services.PriceService;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/stocks")
@RequiredArgsConstructor
public class StockController {

    private final PriceService priceService;

    @GetMapping
    public ResponseEntity<List<StockPrice>> getAllStocks() {
        return ResponseEntity.ok(priceService.getAllStocks());
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<StockPrice> getStock(@PathVariable Long companyId) {
        return ResponseEntity.ok(priceService.getStockByCompanyId(companyId));
    }

    // Called by Company Service when a new company is added
    @PostMapping("/init")
    public ResponseEntity<StockPrice> initStock(
            @RequestParam Long companyId,
            @RequestParam BigDecimal initialPrice) {
        return ResponseEntity.ok(priceService.initializeStock(companyId, initialPrice));
    }

    @DeleteMapping("/company/{companyId}")
    public ResponseEntity<String> deleteStock(@PathVariable Long companyId) {
        priceService.deleteByCompanyId(companyId);
        return ResponseEntity.ok("Stock removed");
    }
}