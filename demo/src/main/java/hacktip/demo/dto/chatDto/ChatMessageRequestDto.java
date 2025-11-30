package hacktip.demo.dto.chatDto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageRequestDto {
    private Long roomId; // 1. 메시지를 보낼 채팅방 ID
    private String content; // 3. 메시지 내용
}
