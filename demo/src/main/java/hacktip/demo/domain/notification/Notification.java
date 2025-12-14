package hacktip.demo.domain.notification;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.post.Post;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "NOTIFICATION")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_NOTI_GENERATOR")
    @SequenceGenerator(
            name = "SEQ_NOTI_GENERATOR",
            sequenceName = "SEQ_NOTI",
            initialValue = 1,
            allocationSize = 1
    )
    @Column(name = "NOTIFICATION_ID")
    private Long id;

    // 알림을 받는 사람 (게시글 작성자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RECEIVER_ID", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE) // 회원이 삭제되면 알림도 삭제
    private Member receiver;

    // 알림을 발생시킨 게시글 (클릭 시 이동하기 위함)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POST_ID", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE) // 글이 삭제되면 알림도 삭제
    private Post post;

    @Column(name = "MESSAGE", nullable = false)
    private String message;

    @Column(name = "IS_READ", nullable = false)
    private boolean isRead; // 읽음 여부

    @CreationTimestamp
    @Column(name = "CREATED_DATE", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Builder
    public Notification(Member receiver, Post post, String message) {
        this.receiver = receiver;
        this.post = post;
        this.message = message;
        this.isRead = false; // 기본값은 안 읽음
    }

    // 읽음 처리 메서드
    public void read() {
        this.isRead = true;
    }
}
