package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "nominees")
@Data
public class Nominee {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long nomineeId;

	@ManyToOne
	@JoinColumn(name = "user_id")
	private UserDetails userDetails;

	@Column(nullable = false)
	private String firstName;

	private String middleName;

	private String lastName;

	@Column(nullable = false)
	private String relationship;

	@Column(nullable = false)
	private String email;

	@Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
	private String panId;

	private LocalDate dob;
}