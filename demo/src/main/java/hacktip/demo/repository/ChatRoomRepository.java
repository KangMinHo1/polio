package hacktip.demo.repository;

import hacktip.demo.domain.ChatRoom;
import hacktip.demo.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 5. === [1대1 채팅방 검색 쿼리 추가] ===
    /**
     * 두 명의 멤버(member1, member2)만 속해 있는 1대1 채팅방을 검색
     * (조건 1) 해당 방의 총 멤버(COUNT)가 2명
     * (조건 2) member1이 멤버로 존재 (EXISTS)
     * (조건 3) member2가 멤버로 존재 (EXISTS)
     */
    @Query("SELECT cr FROM ChatRoom cr " +
            "WHERE (SELECT COUNT(m.id) FROM ChatRoomMember m WHERE m.chatRoom = cr) = 2 " +
            "AND EXISTS (SELECT 1 FROM ChatRoomMember m1 WHERE m1.chatRoom = cr AND m1.member = :member1) " +
            "AND EXISTS (SELECT 1 FROM ChatRoomMember m2 WHERE m2.chatRoom = cr AND m2.member = :member2)")
    Optional<ChatRoom> find1on1Room(
            @Param("member1") Member member1,
            @Param("member2") Member member2
    );
}
