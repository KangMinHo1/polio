package hacktip.demo.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;


@Entity
@Getter
@NoArgsConstructor
@Table(name = "CHAT_MESSAGE")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_CHAT_MESSAGE_GENERATOR")
    @SequenceGenerator(
            name = "SEQ_CHAT_MESSAGE_GENERATOR",
            sequenceName = "SEQ_CHAT_MESSAGE",
            initialValue = 1,
            allocationSize = 1
    )
    @Column(name = "CHATID")
    private Long chatId;

    // 1. ChatRoom(1) : ChatMessage(N) 연관관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROOMID" , nullable = false)
    private ChatRoom chatRoom;

    // 2. Member(1) : ChatMessage(N) 연관관계 (작성자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBERID", nullable = false)
    private Member member;

    // 3. (CLOB 타입 매핑)
    @Lob
    @Column(name = "CONTENT", nullable = false)
    private String content;

    @CreationTimestamp
    @Column(name = "SENDDATE", nullable = false, updatable = false)
    private Timestamp sendDate;

    @Builder
    public ChatMessage(ChatRoom chatRoom, Member member, String content) {
        this.chatRoom = chatRoom;
        this.member = member;
        this.content = content;
    }

}
