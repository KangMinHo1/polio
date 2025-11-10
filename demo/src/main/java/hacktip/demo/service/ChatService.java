package hacktip.demo.service;

import hacktip.demo.domain.ChatMessage;
import hacktip.demo.domain.ChatRoom;
import hacktip.demo.domain.ChatRoomMemberId;
import hacktip.demo.domain.Member;
import hacktip.demo.dto.ChatMessageRequestDto;
import hacktip.demo.dto.ChatMessageResponseDto;
import hacktip.demo.repository.ChatMessageRepository;
import hacktip.demo.repository.ChatRoomMemberRepository;
import hacktip.demo.repository.ChatRoomRepository;
import hacktip.demo.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final MemberRepository memberRepository;
    private final ChatRoomRepository chatRoomRepository;
    // 4. (추가) 인가(Authorization)를 위해 ChatRoomMemberRepository 주입
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    /**
     * * 채팅 메시지를 DB에 저장하고, 저장된 메시지를 DTO로 변환하여 반환  (수정) 채팅 메시지 저장
     * @param requestDto (roomId, content) - memberId 제거됨
     * @param email      (토큰에서 추출한 인증된 사용자 이메일)
     * @return ChatMessageResponseDto
     */
    @Transactional
    public ChatMessageResponseDto saveMessage(ChatMessageRequestDto requestDto, String email){
        // 1. (임시) memberId로 Member 엔티티 조회 (보안 경고: 5단계에서 수정 예정)  (수정) DTO의 memberId 대신, 인증된 email로 Member 엔티티 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. Email: " + email));

        // 2. roomId로 ChatRoom 엔티티 조회
        ChatRoom chatRoom = chatRoomRepository.findById(requestDto.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다.. ID: " + requestDto.getRoomId()));

        //  (추가 - 선택적) 메시지 보내기 전, 이 채팅방 멤버가 맞는지 확인
        //    -> 이 로직을 추가하면 더 강력한 보안이 됩니다. (지금은 loadMessages에만 적용)

        // 3. ChatMessage 엔티티 생성 및 DB 저장
        ChatMessage chatMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .member(member)
                .content(requestDto.getContent())
                .build();


        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

        // 4. 저장된 엔티티를 Response DTO로 변환하여 반환
        return new ChatMessageResponseDto(savedMessage);
    }

    // 3. === [신규] 채팅방 과거 내역 조회 메서드 ===
    /**
     * (수정) * 특정 채팅방의 모든 메시지 내역을 조회 (오래된 순 -> 최신 순)
     * @param roomId 조회할 채팅방 ID
     * @param email  (토큰에서 추출한 인증된 사용자 이메일)
     * @return List<ChatMessageResponseDto>
     */
    @Transactional // (읽기 전용이지만, 엔티티에서 DTO로 변환 시 Lazy Loading이 발생할 수 있으므로 트랜잭션 보장)
    public List<ChatMessageResponseDto> loadMessage(Long roomId, String email){ // 9. (수정) 파라미터 변경 (roomId, email)

        // 10. (핵심) "인가(Authorization)" - 이 사용자가 채팅방 멤버가 맞는지 검사
        // 10-1. 이메일로 멤버 ID 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. Email: " + email));

        Long memberId = member.getMemberId();

        // 10-2. 복합키(ChatRoomMemberId) 생성
        ChatRoomMemberId chatRoomMemberId = new ChatRoomMemberId(roomId, memberId);

        // 10-3. CHATROOM_MEMBER 테이블에 해당 멤버가 존재하는지 확인
        boolean isMember = chatRoomMemberRepository.existsById(chatRoomMemberId);

        // 10-4. 멤버가 아니면, 접근 거부 예외 발생 (403 Forbidden)
        if(!isMember){
            throw new AccessDeniedException("이 채팅방에 접근할 권한이 없습니다.");
        }

        // --- (인가 통과) ---


        // 1. (Repository) 2단계에서 정의한 메서드 사용 (roomId로 시간순 정렬 조회)
        List<ChatMessage> messages = chatMessageRepository.findByChatRoom_RoomIdOrderBySendDateAsc(roomId);

        // 2. (Stream) 조회된 엔티티 리스트를 DTO 리스트로 변환
        return messages.stream()
                .map(ChatMessageResponseDto::new)
                .collect(Collectors.toList());
    }
}
