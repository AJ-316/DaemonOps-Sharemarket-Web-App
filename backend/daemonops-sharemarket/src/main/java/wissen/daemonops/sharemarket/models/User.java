package wissen.daemonops.sharemarket.models;

import java.time.LocalDate;

import jakarta.annotation.Generated;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long userId;
	
	private String email;
	private String password;
	
	@Enumerated(EnumType.STRING)
	private Role role;
}
