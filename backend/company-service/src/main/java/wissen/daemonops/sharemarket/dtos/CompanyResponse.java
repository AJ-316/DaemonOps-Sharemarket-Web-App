package wissen.daemonops.sharemarket.dtos;

import java.time.LocalDateTime;

public class CompanyResponse {
    private Long id;
    private String name;
    private String ticker;
    private String sector;
    private String description;
    private Long totalSharesIssued;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTicker() { return ticker; }
    public void setTicker(String ticker) { this.ticker = ticker; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getTotalSharesIssued() { return totalSharesIssued; }
    public void setTotalSharesIssued(Long totalSharesIssued) { this.totalSharesIssued = totalSharesIssued; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}