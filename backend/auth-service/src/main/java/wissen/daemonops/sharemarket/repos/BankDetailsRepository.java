// BankDetailsRepository.java
package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;
import wissen.daemonops.sharemarket.models.BankDetails;

public interface BankDetailsRepository extends JpaRepository<BankDetails, Long> {
}