package wissen.daemonops.sharemarket.exceptions;

public class CompanyNotFoundException extends RuntimeException {
    public CompanyNotFoundException(String message) {
        super(message);
    }
}