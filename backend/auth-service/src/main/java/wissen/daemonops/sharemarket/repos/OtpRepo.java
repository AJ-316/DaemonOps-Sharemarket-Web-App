package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;
import wissen.daemonops.sharemarket.models.OtpRecord;

import java.util.Optional;

public interface OtpRepo extends JpaRepository<OtpRecord, Long> {
    Optional<OtpRecord> findTopByEmailOrderByIdDesc(String email);
}
