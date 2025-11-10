package hacktip.demo.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "CHATROOM_MEMBER") // 1. 복합 키 클래스 지정
@IdClass(ChatRoomMemberId.class)
public class ChatRoomMember {

    // 2. @Id + @ManyToOne (복합 키의 첫 번째 필드)
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROOMID")
    private ChatRoom chatRoom;

    // 3. @Id + @ManyToOne (복합 키의 두 번째 필드)
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBERID")
    private Member member;

    // (참고) 생성자는 필요 시 추가
    public ChatRoomMember(ChatRoom chatRoom, Member member) {
        this.chatRoom = chatRoom;
        this.member = member;
    }
}
