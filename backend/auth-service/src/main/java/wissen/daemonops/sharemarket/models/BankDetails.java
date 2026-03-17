package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
@Entity
@Table(name = "bank_details")
public class BankDetails {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long bankDetailsId;

	@ManyToOne
	@JoinColumn(name = "user_id")
	private UserDetails userDetails;

	@Column(nullable = false)
	private String accountNumber;

	// @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$")
	@Column(nullable = false)
	private String ifscCode;

	@Column(nullable = false)
	private String bankName;

	@Column(nullable = false)
	private String branch;
}