package wissen.daemonops.sharemarket.dtos;

public class CompanyRequest {
    private String name;
    private String ticker;
    private String sector;
    private String description;
    private Long totalSharesIssued;
    private Double initialPrice;

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

    public Double getInitialPrice() { return initialPrice; }
    public void setInitialPrice(Double initialPrice) { this.initialPrice = initialPrice; }
}

