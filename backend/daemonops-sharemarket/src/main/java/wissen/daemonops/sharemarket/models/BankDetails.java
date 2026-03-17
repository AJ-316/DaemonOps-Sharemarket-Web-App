package wissen.daemonops.sharemarket.models;

import jakarta.persistence.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;

@Entity
public class BankDetails {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long bankDetailsId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserDetails userId;
	
	@Column(nullable = false)
	private Long accountNumber;
	
	@Pattern(regexp="^[A-Z]{4}0[A-Z0-9]{6}$")
	@Column(nullable = false)
	private Long ifscCode;
	
	@Column(nullable = false)
	private String bankName;
	
	@Column(nullable = false)
	private String branch;
	
	@Column(nullable = false)
	private Long bankStatementPath;
	
	@Column(nullable = false)
	private Long cancelledChequePath;
}
