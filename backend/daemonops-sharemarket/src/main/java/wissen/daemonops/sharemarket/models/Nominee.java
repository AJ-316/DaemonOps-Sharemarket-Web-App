package wissen.daemonops.sharemarket.models;


import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;

@Entity
@Table(name = "nominees")
public class Nominee {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long nomineeId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserDetails userId;

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
}
