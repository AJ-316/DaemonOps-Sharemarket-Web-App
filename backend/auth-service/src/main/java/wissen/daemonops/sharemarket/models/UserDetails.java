package wissen.daemonops.sharemarket.models;

import java.time.LocalDate;

import jakarta.validation.constraints.Pattern;
import lombok.Data;
import jakarta.persistence.*;

@Entity
@Table(name = "user_details")
@Data
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

	private String lastName;

	@Pattern(regexp = "^[0-9]{10}$")
	@Column(nullable = false)
	private String mobile;

	@Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
	@Column(nullable = false)
	private String panId;

	@Pattern(regexp = "^[0-9]{12}$")
	@Column(nullable = false)
	private String aadhaarId;

	private String panName;

	private LocalDate dob;
}