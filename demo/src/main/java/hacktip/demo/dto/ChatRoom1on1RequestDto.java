package hacktip.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatRoom1on1RequestDto {

    @NotBlank(message = "채팅할 상대방의 이메일은 필수입니다.")
    @Email
    private String targetEmail; // 1대1 채팅을 할 상대방의 이메일
}
