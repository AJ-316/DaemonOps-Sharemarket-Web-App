package wissen.daemonops.sharemarket.models;

import java.time.LocalDate;

import jakarta.validation.constraints.Pattern;

import jakarta.persistence.Column;
import jakarta.persistence.*;

@Entity
public class UserDetails {
	
	@Id
	private Long userId;
	
	@OneToOne
	@MapsId
	@JoinColumn(name = "user_id")
	private User user;

	@Column(nullable = false)
	private String firstName;
	
	private String middleName;
	@Column(nullable = false)
	private String lastName;
	
	@Pattern(regexp = "^[0-9]{10}$")
	@Column(nullable = false)
	private String mobile;
	
	@Pattern(regexp = "^$")
	private String panId;
	
	@Pattern(regexp = "^$")
	@Column(nullable = false)
	private String aadhaarId;

	
	private LocalDate dob;
}
