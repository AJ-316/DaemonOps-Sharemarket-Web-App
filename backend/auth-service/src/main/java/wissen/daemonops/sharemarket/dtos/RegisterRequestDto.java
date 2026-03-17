package wissen.daemonops.sharemarket.dtos;

import java.time.LocalDate;

public record RegisterRequestDto(
                String firstName,
                String middleName,
                String lastName,
                String email,
                String mobile,
                String pan,
                LocalDate dob,
                String aadhaar,
                String panName,

                String ifsc,
                String accountNumber,
                String bankName,
                String branchName,

                String nomineeFirstName,
                String nomineeMiddleName,
                String nomineeLastName,
                String nomineeRelationship,
                String nomineeEmail,
                String nomineePan,
                LocalDate nomineeDob,

                String password) {
}