package wissen.daemonops.sharemarket.repos;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import wissen.daemonops.sharemarket.models.Order;

@Repository
public interface OrderRepo extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    List<Order> findByUserIdAndCompanyId(Long userId, Long companyId);
}