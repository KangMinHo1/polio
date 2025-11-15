package hacktip.demo.controller;

import hacktip.demo.dto.chatDto.ChatMessageResponseDto;
import hacktip.demo.dto.chatDto.ChatRoom1on1RequestDto;
import hacktip.demo.dto.chatDto.ChatRoomResponseDto;
import hacktip.demo.service.ChatRoomService;
import hacktip.demo.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat") // 1. 공통 경로 "/chat"
public class ChatRoomController {

    private final ChatService chatService;

    // 7. (추가) ChatRoomService 주입
    private final ChatRoomService chatRoomService;

    // (향후 이곳에 채팅방 생성, 조회 API 등을 추가할 수 있습니다)
    // 예: @PostMapping("/room")
    // 예: @GetMapping("/rooms")

    /**
     * (수정) 1대1 채팅방 생성 (Find or Create)
     * POST /chat/room/1on1
     */
    // 4. (수정) 엔드포인트 변경: /room -> /room/1on1
    @PostMapping("/room/1on1")
    public ResponseEntity<ChatRoomResponseDto> findOrCreate1on1Room(@Valid @RequestBody ChatRoom1on1RequestDto requestDto,
                                                                    @AuthenticationPrincipal String email){

        // 6. (수정) 서비스 호출
        ChatRoomResponseDto responseDto = chatRoomService.findOrCreate1on1Room(email, requestDto.getTargetEmail());

        // 7. (수정) 201 Created 대신 200 OK 반환
        // (이유: 찾았을(Find) 수도, 생성(Create)했을 수도 있으므로 200 OK가 적절)
        return ResponseEntity.ok(responseDto);
    }

    // 1. === [신규] '내 채팅방' 목록 조회 API ===
    /**
     * 내가 속한 모든 채팅방 목록 조회
     * GET /chat/rooms
     */
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponseDto>> getMyRooms(@AuthenticationPrincipal String email){
        // 3. 서비스를 호출하여 '내가 속한 방' 목록 반환
        List<ChatRoomResponseDto> myRooms = chatRoomService.findMyChatRooms(email);

        return ResponseEntity.ok(myRooms);
    }


    /**
     * 특정 채팅방의 과거 대화 내역 조회 (HTTP GET)
     * @param roomId 채팅방 ID
     */
    @GetMapping("/room/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponseDto>> getRoomMessages(@PathVariable("roomId") Long roomId, @AuthenticationPrincipal String email){

        // 2. 서비스를 호출하여 메시지 내역을 가져옴 --> // 3. (수정) Service 호출 시, roomId와 함께 인증된 이메일 전달
        List<ChatMessageResponseDto> message = chatService.loadMessage(roomId, email);

        // 3. 200 OK와 함께 메시지 리스트 반환
        return ResponseEntity.ok(message);
    }
}
