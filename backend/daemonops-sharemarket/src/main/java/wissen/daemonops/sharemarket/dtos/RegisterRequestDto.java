package wissen.daemonops.sharemarket.dtos;

import java.time.LocalDate;

public record RegisterRequestDto(
        String firstName,
        String middleName,
        String lastName,
        String mobile,
        String panId,
        String aadhaarId,
        LocalDate dob,

        String email,
        String password
) {
}
