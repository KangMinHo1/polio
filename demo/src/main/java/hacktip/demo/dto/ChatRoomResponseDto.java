package hacktip.demo.dto;

import hacktip.demo.domain.ChatRoom;
import lombok.Getter;

@Getter
public class ChatRoomResponseDto {

    private Long roomId;
    private String roomName;

    // ChatRoom 엔티티를 DTO로 변환하는 생성자
    public ChatRoomResponseDto(ChatRoom entity) {
        this.roomId = entity.getRoomId();
        this.roomName = entity.getRoomName();
    }
}
