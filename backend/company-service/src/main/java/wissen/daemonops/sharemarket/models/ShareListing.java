package wissen.daemonops.sharemarket.models;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
public class ShareListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "company_id")
    @JsonIgnore
    private Company company;

    private Double currentPrice;
    private Double openPrice;
    private Double highToday;
    private Double lowToday;

    private Long totalVolume;

    private LocalDateTime lastUpdated;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Company getCompany() {
		return company;
	}

	public void setCompany(Company company) {
		this.company = company;
	}

	public Double getCurrentPrice() {
		return currentPrice;
	}

	public void setCurrentPrice(Double currentPrice) {
		this.currentPrice = currentPrice;
	}

	public Double getOpenPrice() {
		return openPrice;
	}

	public void setOpenPrice(Double openPrice) {
		this.openPrice = openPrice;
	}

	public Double getHighToday() {
		return highToday;
	}

	public void setHighToday(Double highToday) {
		this.highToday = highToday;
	}

	public Double getLowToday() {
		return lowToday;
	}

	public void setLowToday(Double lowToday) {
		this.lowToday = lowToday;
	}

	public Long getTotalVolume() {
		return totalVolume;
	}

	public void setTotalVolume(Long totalVolume) {
		this.totalVolume = totalVolume;
	}

	public LocalDateTime getLastUpdated() {
		return lastUpdated;
	}

	public void setLastUpdated(LocalDateTime lastUpdated) {
		this.lastUpdated = lastUpdated;
	}
}