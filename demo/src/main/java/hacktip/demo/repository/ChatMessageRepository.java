package hacktip.demo.repository;

import hacktip.demo.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // (미리 추가) 특정 채팅방의 모든 메시지를 조회 (나중에 채팅 내역 로드 시 필요)
    List<ChatMessage> findByChatRoom_RoomIdOrderBySendDateAsc(Long roomId);
}
