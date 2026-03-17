package wissen.daemonops.sharemarket.exceptions;

public class TradeRejectedException extends RuntimeException {
    public TradeRejectedException(String message) {
        super(message);
    }
}
