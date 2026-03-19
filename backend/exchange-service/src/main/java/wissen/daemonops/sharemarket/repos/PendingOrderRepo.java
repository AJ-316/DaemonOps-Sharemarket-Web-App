package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import wissen.daemonops.sharemarket.models.PendingOrder;

import java.util.List;

@Repository
public interface PendingOrderRepo extends JpaRepository<PendingOrder, Long> {

    // Uses String parameter to avoid enum import issues on Windows
    List<PendingOrder> findByStatus(String status);

    List<PendingOrder> findByUserIdAndStatus(Long userId, String status);

    List<PendingOrder> findByCompanyIdAndTypeAndStatus(Long companyId, String type, String status);
}