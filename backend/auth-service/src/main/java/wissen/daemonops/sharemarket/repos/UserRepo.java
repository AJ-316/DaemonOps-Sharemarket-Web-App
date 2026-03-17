package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;
import wissen.daemonops.sharemarket.models.User;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
}