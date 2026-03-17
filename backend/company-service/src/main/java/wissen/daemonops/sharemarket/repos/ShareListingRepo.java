package wissen.daemonops.sharemarket.repos;

import org.springframework.data.jpa.repository.JpaRepository;

import wissen.daemonops.sharemarket.models.ShareListing;

public interface ShareListingRepo extends JpaRepository<ShareListing, Long>{

}