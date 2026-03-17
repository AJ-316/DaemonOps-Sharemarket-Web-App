package wissen.daemonops.sharemarket.exceptions;

public class DuplicateTickerException extends RuntimeException {
    public DuplicateTickerException(String message) {
        super(message);
    }
}