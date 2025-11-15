package hacktip.demo.dto.MemberDto;

import hacktip.demo.domain.Member;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Getter
public class MemberSignUpRequestDto {

    @NotBlank(message = "이메일은 필수 입력 항목입니다.") // 1. Validation
    @Email(message = "유효한 이메일 형식이 아닙니다.") // 1. Validation
    private String email;

    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.") // 1. Validation
    @Size(min = 6, message = "비밀번호는 8자 이상이어야 합니다.")
    private String password;

    @NotBlank(message = "이름은 필수 입력 항목입니다.")
    private String name;


    public Member toEntity(String encodedPassword) {
        return Member.builder()
                .email(email)
                .password(encodedPassword)
                .name(name)
                .build();
    }
}
