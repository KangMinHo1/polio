package hacktip.demo.dto.chatDto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatRoom1on1RequestDto {
    // [수정] @NotBlank, @Email -> @NotNull
    @NotNull(message = "채팅할 상대방의 ID는 필수입니다.")
    private Long targetMemberId; // 1대1 채팅을 할 상대방의 memberId
}
