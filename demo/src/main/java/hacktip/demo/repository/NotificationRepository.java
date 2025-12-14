package hacktip.demo.repository;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 특정 회원의 읽지 않은 알림만 최신순으로 가져오기
    List<Notification> findAllByReceiverAndIsReadFalseOrderByCreatedDateDesc(Member receiver);

    // [신규] 읽음/안읽음 상관없이 회원의 모든 알림을 최신순 조회
    List<Notification> findAllByReceiverOrderByCreatedDateDesc(Member receiver);

}


