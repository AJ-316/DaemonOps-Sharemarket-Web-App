package wissen.daemonops.sharemarket.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import wissen.daemonops.sharemarket.dtos.CompanyRequest;
import wissen.daemonops.sharemarket.dtos.CompanyResponse;
import wissen.daemonops.sharemarket.services.CompanyService;

@RestController
@RequestMapping("/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> addCompany(
            @RequestBody CompanyRequest request,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(companyService.addCompany(request, role));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable Long id,
            @RequestBody CompanyRequest request,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(companyService.updateCompany(id, request, role));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> removeCompany(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role) {
        companyService.removeCompany(id, role);
        return ResponseEntity.ok("Company removed successfully");
    }

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getCompanyById(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    @GetMapping("/sector/{sector}")
    public ResponseEntity<List<CompanyResponse>> getBySector(@PathVariable String sector) {
        return ResponseEntity.ok(companyService.getCompaniesBySector(sector));
    }
}