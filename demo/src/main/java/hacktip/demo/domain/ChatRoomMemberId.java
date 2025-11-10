package hacktip.demo.domain;

import java.io.Serializable;
import java.util.Objects;

/**
 * ChatRoomMember의 복합 키(Composite Key)를 위한 @IdClass
 * (반드시 Serializable을 구현해야 함)
 */
public class ChatRoomMemberId implements Serializable {

    private Long chatRoom; // 1. ChatRoomMember 엔티티의 'chatRoom' 필드명과 일치
    private Long member; // 2. ChatRoomMember 엔티티의 'member' 필드명과 일치

    // 3. 기본 생성자, equals, hashCode 필수
    public ChatRoomMemberId() {
    }

    public ChatRoomMemberId(Long chatRoom, Long member) {
        this.chatRoom = chatRoom;
        this.member = member;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChatRoomMemberId that = (ChatRoomMemberId) o;
        return Objects.equals(chatRoom, that.chatRoom) &&
                Objects.equals(member, that.member);
    }

    @Override
    public int hashCode() {
        return Objects.hash(chatRoom, member);
    }
}
