package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;
import wissen.daemonops.sharemarket.models.Nominee;

public interface NomineeRepository extends JpaRepository<Nominee, Long> {
}