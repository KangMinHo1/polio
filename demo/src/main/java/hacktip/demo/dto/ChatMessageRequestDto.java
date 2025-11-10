package hacktip.demo.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageRequestDto {
    private Long roomId; // 1. 메시지를 보낼 채팅방 ID
    //private Long memberId; // 2. 메시지를 보낸 사람 ID (보안 경고: 5단계에서 수정 예정)-> 보안 취약점: 이 필드를 제거하고, 인증된 토큰에서 직접 memberId를 획득 (제거) private Long memberId;
    private String content; // 3. 메시지 내용
}
