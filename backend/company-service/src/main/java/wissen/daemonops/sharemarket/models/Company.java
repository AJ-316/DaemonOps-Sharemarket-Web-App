package wissen.daemonops.sharemarket.models;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ticker;

    private String name;
    private String sector;
    private String description;
    
    @Transient
    private Double initialPrice;

	private Long totalSharesIssued;

	@Column(nullable = false)
    private LocalDateTime createdAt;
    
    public Double getInitialPrice() {
		return initialPrice;
	}

	public void setInitialPrice(Double initialValue) {
		this.initialPrice = initialValue;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTicker() {
		return ticker;
	}

	public void setTicker(String ticker) {
		this.ticker = ticker;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getSector() {
		return sector;
	}

	public void setSector(String sector) {
		this.sector = sector;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Long getTotalSharesIssued() {
		return totalSharesIssued;
	}

	public void setTotalSharesIssued(Long totalSharesIssued) {
		this.totalSharesIssued = totalSharesIssued;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}