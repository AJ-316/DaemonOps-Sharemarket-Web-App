package wissen.daemonops.sharemarket.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import wissen.daemonops.sharemarket.dtos.CompanyRequest;
import wissen.daemonops.sharemarket.dtos.CompanyResponse;
import wissen.daemonops.sharemarket.exceptions.CompanyNotFoundException;
import wissen.daemonops.sharemarket.exceptions.DuplicateTickerException;
import wissen.daemonops.sharemarket.exceptions.UnauthorizedException;
import wissen.daemonops.sharemarket.models.Company;
import wissen.daemonops.sharemarket.repos.CompanyRepo;

@Service
public class CompanyService {

    private final CompanyRepo companyRepo;
    
    @Autowired
    private RestTemplate restTemplate;

    public CompanyService(CompanyRepo companyRepo) {
        this.companyRepo = companyRepo;
    }

    public CompanyResponse addCompany(CompanyRequest request, String role) {
        validateAdmin(role);

        if (companyRepo.existsByTicker(request.getTicker())) {
            throw new DuplicateTickerException("Ticker " + request.getTicker() + " already exists");
        }

        Company company = new Company();
        company.setName(request.getName());
        company.setTicker(request.getTicker().toUpperCase());
        company.setSector(request.getSector());
        company.setDescription(request.getDescription());
        company.setTotalSharesIssued(request.getTotalSharesIssued());
        company.setCreatedAt(LocalDateTime.now());
        Company saved = companyRepo.save(company);

        try {
            String url = "http://EXCHANGE-SERVICE/stocks/init?companyId=" + saved.getId()
                + "&initialPrice=" + request.getInitialPrice();
            restTemplate.postForObject(url, null, Void.class); // uses the injected one
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize stock on exchange service: " + e.getMessage());
        }
        return mapToResponse(saved);
    }

    public CompanyResponse updateCompany(Long id, CompanyRequest request, String role) {
        validateAdmin(role);

        Company company = companyRepo.findById(id)
                .orElseThrow(() -> new CompanyNotFoundException("Company not found with id: " + id));

        // Ticker is immutable, never update it
        company.setName(request.getName());
        company.setSector(request.getSector());
        company.setDescription(request.getDescription());
        company.setTotalSharesIssued(request.getTotalSharesIssued());

        return mapToResponse(companyRepo.save(company));
    }

    public void removeCompany(Long id, String role) {
        validateAdmin(role);

        Company company = companyRepo.findById(id)
                .orElseThrow(() -> new CompanyNotFoundException("Company not found with id: " + id));

        companyRepo.delete(company);
    }

    public List<CompanyResponse> getAllCompanies() {
        return companyRepo.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CompanyResponse getCompanyById(Long id) {
        Company company = companyRepo.findById(id)
                .orElseThrow(() -> new CompanyNotFoundException("Company not found with id: " + id));
        return mapToResponse(company);
    }

    public List<CompanyResponse> getCompaniesBySector(String sector) {
        return companyRepo.findBySector(sector)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void validateAdmin(String role) {
        if (role == null || !role.equals("ADMIN")) {
            throw new UnauthorizedException("Only admins can perform this action");
        }
    }

    private CompanyResponse mapToResponse(Company company) {
        CompanyResponse response = new CompanyResponse();
        response.setId(company.getId());
        response.setName(company.getName());
        response.setTicker(company.getTicker());
        response.setSector(company.getSector());
        response.setDescription(company.getDescription());
        response.setTotalSharesIssued(company.getTotalSharesIssued());
        response.setCreatedAt(company.getCreatedAt());
        return response;
    }
}
