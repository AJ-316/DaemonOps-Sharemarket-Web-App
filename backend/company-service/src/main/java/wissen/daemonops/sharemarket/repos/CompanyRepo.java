package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;

import wissen.daemonops.sharemarket.models.Company;

public interface CompanyRepo extends JpaRepository<Company, Long>{

}
