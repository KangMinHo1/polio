package hacktip.demo.dto;

import hacktip.demo.domain.ChatMessage;
import lombok.Getter;

import java.sql.Timestamp;

@Getter
public class ChatMessageResponseDto {

    private Long chatId;
    private Long roomId;
    private String senderName; // 1. 보낸 사람의 ID가 아닌 "이름"
    private String content;
    private Timestamp sendDate;  // 2. DB에 저장된 시간

    /**
     * ChatMessage 엔티티를 Response DTO로 변환하는 생성자
     */
    public ChatMessageResponseDto(ChatMessage entity) {
        this.chatId = entity.getChatId();
        this.roomId = entity.getChatRoom().getRoomId();
        this.senderName = entity.getMember().getName(); // 3. 연관관계(Member)에서 이름 추출
        this.content = entity.getContent();
        this.sendDate = entity.getSendDate();
    }
}
