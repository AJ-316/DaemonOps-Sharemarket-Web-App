package wissen.daemonops.sharemarket.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.*;
import wissen.daemonops.sharemarket.models.Company;
import wissen.daemonops.sharemarket.models.ShareListing;
import wissen.daemonops.sharemarket.repos.CompanyRepo;
import wissen.daemonops.sharemarket.repos.ShareListingRepo;

@RestController
@RequestMapping("/companies")
@RequiredArgsConstructor
public class CompanyController {

    @Autowired
    private CompanyRepo companyRepo;
    
    @Autowired
    private ShareListingRepo shareListingRepo;

    @PostMapping
    public ResponseEntity<?> addCompany(@RequestBody Company company) {
        Double price = company.getInitialPrice();
        Company saved = companyRepo.save(company);
        ShareListing listing = new ShareListing();
        listing.setCompany(saved);
        listing.setCurrentPrice(price);
        listing.setOpenPrice(price);
        listing.setHighToday(price);
        listing.setLowToday(price);
        listing.setTotalVolume(0L);
        listing.setLastUpdated(LocalDateTime.now());

        shareListingRepo.save(listing);

        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<Company> getAllCompanies() {
    	List<Company> data = companyRepo.findAll();
        return data;
    }

    @GetMapping("/{id}")
    public Company getCompanyById(@PathVariable Long id) {
        return companyRepo.findById(id).orElseThrow(() -> new RuntimeException("Company not found"));
    }

    @PutMapping("/{id}")
    public Company updateCompany(@PathVariable Long id, @RequestBody Company updated) {

        Company company = companyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        company.setTicker(updated.getTicker());
        company.setName(updated.getName());
        company.setSector(updated.getSector());
        company.setDescription(updated.getDescription());
        company.setTotalSharesIssued(updated.getTotalSharesIssued());
        company.setCreatedAt(updated.getCreatedAt());

        return companyRepo.save(company);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        companyRepo.deleteById(id);
        return ResponseEntity.ok("Deleted successfully");
    }
}