package hacktip.demo.repository;

import hacktip.demo.domain.ChatRoomMember;
import hacktip.demo.domain.ChatRoomMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, ChatRoomMemberId> {
    // (참고) 복합 키를 사용하므로 ID 타입이 ChatRoomMemberId 입니다.

    // 2. (추가) 특정 멤버(Member)가 속한 모든 채팅방(ChatRoomMember)을 조회
    //    JPA 쿼리 파생: 'member' 필드의 'memberId' 필드를 기준으로 검색
    List<ChatRoomMember> findByMember_MemberId(Long memberId);
}
