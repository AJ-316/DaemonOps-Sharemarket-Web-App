package wissen.daemonops.sharemarket.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long userId;
	
	private String email;
	private String password;
	
	@Enumerated(EnumType.STRING)
	private Role role;
}
