package hacktip.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MemberSignUpResponseDto {

    private Long memberId;
    private String email;
    private String name;


}
