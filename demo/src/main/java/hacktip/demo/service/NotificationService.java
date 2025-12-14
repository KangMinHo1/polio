package hacktip.demo.service;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.notification.Notification;
import hacktip.demo.domain.post.Post;
import hacktip.demo.dto.NotificationResponseDto;
import hacktip.demo.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // 알림 생성 (댓글 서비스에서 호출)
    @Transactional
    public void send(Member receiver, Post post, String content) {
        Notification notification = Notification.builder()
                .receiver(receiver)
                .post(post)
                .message(content)
                .build();
        notificationRepository.save(notification);
    }

    // 내 알림 목록 조회
    public List<NotificationResponseDto> getMyNotifications(Member member) {
        // findAllByReceiverOrderByCreatedDateDesc 메서드 사용
        List<Notification> notifications = notificationRepository.findAllByReceiverOrderByCreatedDateDesc(member);

        return notifications.stream()
                .map(NotificationResponseDto::new)
                .collect(Collectors.toList());
    }

    // 알림 읽음 처리
    @Transactional
    public void readNotification(Long notificationId, Member member) throws AccessDeniedException {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 알림입니다."));

        // 본인의 알림인지 확인
        if (!notification.getReceiver().getMemberId().equals(member.getMemberId())) {
            throw new AccessDeniedException("해당 알림에 접근 권한이 없습니다.");
        }

        notification.read(); // 엔티티 내의 isRead = true 처리 메서드 호출
    }

}
