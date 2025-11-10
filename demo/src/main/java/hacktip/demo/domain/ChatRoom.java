package hacktip.demo.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "CHATROOM")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_CHATROOM_GENERATOR")
    @SequenceGenerator(
            name = "SEQ_CHATROOM_GENERATOR",
            sequenceName = "SEQ_CHATROOM",
            initialValue = 1,
            allocationSize = 1
    )
    @Column(name = "ROOMID")
    private Long roomId;

    @Column(name = "ROOMNAME", nullable = false)
    private String roomName;


    @CreationTimestamp // 1. 엔티티 생성 시 자동으로 현재 시간 저장
    @Column(name = "CREATEDATE", nullable = false, updatable = false)
    private Timestamp createDate;

    @Builder
    public ChatRoom(String roomName) {
        this.roomName = roomName;
    }
}
