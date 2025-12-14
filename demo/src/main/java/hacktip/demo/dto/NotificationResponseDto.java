package hacktip.demo.dto;

import hacktip.demo.domain.notification.Notification;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationResponseDto {

    private Long id;
    private String message;
    private Long postId;
    private boolean isRead; // [신규] 읽음 여부 필드 추가
    private LocalDateTime createdDate;

    public NotificationResponseDto(Notification notification) {
        this.id = notification.getId();
        this.message = notification.getMessage();
        this.postId = notification.getPost().getPostId();
        this.isRead = notification.isRead(); // [신규] 엔티티의 상태값 매핑
        this.createdDate = notification.getCreatedDate();
    }

}
