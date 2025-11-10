package hacktip.demo.service;

import hacktip.demo.domain.ChatRoom;
import hacktip.demo.domain.ChatRoomMember;
import hacktip.demo.domain.Member;
import hacktip.demo.dto.ChatRoomResponseDto;
import hacktip.demo.repository.ChatRoomMemberRepository;
import hacktip.demo.repository.ChatRoomRepository;
import hacktip.demo.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final MemberRepository memberRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    /**
     * (기존 createChatRoom 메서드를 삭제하고, 이 메서드로 대체합니다)
     * 1대1 채팅방 "찾기 또는 생성"
     * * @param myEmail     (인증된 사용자 이메일)
     * @param targetEmail (채팅 상대방 이메일)
     * @return ChatRoomResponseDto (찾거나 생성된 채팅방 정보)
     */
    @Transactional
    public ChatRoomResponseDto findOrCreate1on1Room(String myEmail, String targetEmail){
        // 0. (예외 처리) 자기 자신과의 채팅방 생성 금지
        if(myEmail.equals(targetEmail)){
            throw new IllegalArgumentException("자기 자신과는 1대1 채팅을 할 수 없습니다.");
        }

        // 1. (A) '나'와 '상대방'의 Member 엔티티 조회
        Member myMember = memberRepository.findByEmail(myEmail)
                .orElseThrow(()-> new IllegalArgumentException("존재하지 않는 사용자입니다: " + myEmail));
        Member targetMember = memberRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다: " + targetEmail));

        // 2. (B) "Find" (1대1 채팅방 검색)
        //    (B)에서 추가한 JPQL 쿼리 사용
        Optional<ChatRoom> existingRoom = chatRoomRepository.find1on1Room(myMember, targetMember);

        if(existingRoom.isPresent()){
            // 3. (Find Success) 기존 채팅방이 존재하면, DTO로 변환하여 즉시 반환
            return new ChatRoomResponseDto(existingRoom.get());
        }

        // 4. (C) "Create" (기존 채팅방이 없을 경우 새로 생성)

        // 4-1. 새 ChatRoom 생성 (방 이름은 "A, B" 조합으로)
        ChatRoom newChatRoom = ChatRoom.builder()
                .roomName(myMember.getName() + ", " + targetMember.getName())
                .build();

        ChatRoom savedChatRoom = chatRoomRepository.save(newChatRoom);

        // 4-2. "나"를 ChatRoomMember에 추가
        ChatRoomMember myMembership = new ChatRoomMember(savedChatRoom, myMember);
        chatRoomMemberRepository.save(myMembership);

        ChatRoomMember targetMembership = new ChatRoomMember(savedChatRoom, targetMember);
        chatRoomMemberRepository.save(targetMembership);

        // 5. (Create Success) 새로 생성된 채팅방 정보를 DTO로 변환하여 반환
        return new ChatRoomResponseDto(savedChatRoom);
    }


    // 3. === [신규] '내 채팅방' 목록 조회 ===
    /**
     * 인증된 사용자(email)가 속한 모든 채팅방 목록을 조회
     * @param email (인증된 사용자 이메일)
     * @return List<ChatRoomResponseDto>
     */
    @Transactional // (읽기 전용이지만, Lazy Loading을 위해 @Transactional 사용)
    public List<ChatRoomResponseDto> findMyChatRooms(String email){

        // 1. 이메일로 Member 엔티티 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 2. (A)에서 추가한 메서드를 사용해, 해당 멤버가 속한 ChatRoomMember 리스트 조회
        List<ChatRoomMember> myChatRoomMembers = chatRoomMemberRepository.findByMember_MemberId(member.getMemberId());

        // 3. (Stream) ChatRoomMember 리스트에서 ChatRoom 엔티티만 추출
        return myChatRoomMembers.stream()
                .map(chatRoomMember -> chatRoomMember.getChatRoom()) // ChatRoom 추출
                .map(ChatRoomResponseDto::new) // ChatRoom -> ChatRoomResponseDto 변환
                .collect(Collectors.toList());

    }
}
