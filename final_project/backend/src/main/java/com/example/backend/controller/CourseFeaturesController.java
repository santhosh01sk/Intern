package com.example.backend.controller;

import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.EnrolledStudentInfo;
import com.example.backend.dto.MaterialResponse;
import com.example.backend.dto.MessageResponse;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import com.example.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
public class CourseFeaturesController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private MessageRepository messageRepository;

    // Helper method to verify access
    private boolean checkAccess(User user, Course course) {
        if (user.getRole() == Role.ADMIN) {
            return true;
        }
        if (user.getRole() == Role.TEACHER) {
            return course.getTeacher().getId().equals(user.getId());
        }
        if (user.getRole() == Role.STUDENT) {
            return enrollmentRepository.findByStudentAndCourse(user, course).isPresent();
        }
        return false;
    }

    // ─── MATERIALS ENDPOINTS ──────────────────────────────────────────────────

    @GetMapping("/{courseId}/materials")
    public ResponseEntity<?> listMaterials(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User user = userRepository.findById(userDetails.getId()).get();

        if (!checkAccess(user, course)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You do not have access to this course!"));
        }

        List<MaterialResponse> response = materialRepository.findByCourseOrderByUploadedAtDesc(course).stream()
                .map(m -> MaterialResponse.builder()
                        .id(m.getId())
                        .title(m.getTitle())
                        .fileName(m.getFileName())
                        .contentType(m.getContentType())
                        .uploadedAt(m.getUploadedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{courseId}/materials")
    public ResponseEntity<?> uploadMaterial(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId,
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User user = userRepository.findById(userDetails.getId()).get();

        // Only teacher of the course or admin can upload materials
        if (user.getRole() != Role.ADMIN && !(user.getRole() == Role.TEACHER && course.getTeacher().getId().equals(user.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: Only the course instructor can upload materials!"));
        }

        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Title is required!"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: File cannot be empty!"));
        }

        try {
            Material material = Material.builder()
                    .title(title.trim())
                    .fileName(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .data(file.getBytes())
                    .uploadedAt(Instant.now())
                    .course(course)
                    .build();

            materialRepository.save(material);
            return ResponseEntity.ok(new MessageResponse("Material uploaded successfully!"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse("Error saving material file data."));
        }
    }

    @GetMapping("/{courseId}/materials/{materialId}")
    public ResponseEntity<?> downloadMaterial(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId,
            @PathVariable Long materialId
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User user = userRepository.findById(userDetails.getId()).get();

        if (!checkAccess(user, course)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You do not have access to this course!"));
        }

        Optional<Material> materialOpt = materialRepository.findById(materialId);
        if (materialOpt.isEmpty() || !materialOpt.get().getCourse().getId().equals(courseId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Material not found in this course!"));
        }

        Material material = materialOpt.get();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + material.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(material.getContentType()))
                .body(material.getData());
    }

    @DeleteMapping("/{courseId}/materials/{materialId}")
    public ResponseEntity<?> deleteMaterial(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId,
            @PathVariable Long materialId
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User user = userRepository.findById(userDetails.getId()).get();

        if (user.getRole() != Role.ADMIN && !(user.getRole() == Role.TEACHER && course.getTeacher().getId().equals(user.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: Only the course instructor can delete materials!"));
        }

        Optional<Material> materialOpt = materialRepository.findById(materialId);
        if (materialOpt.isEmpty() || !materialOpt.get().getCourse().getId().equals(courseId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Material not found in this course!"));
        }

        materialRepository.delete(materialOpt.get());
        return ResponseEntity.ok(new MessageResponse("Material deleted successfully!"));
    }

    // ─── CHAT ENDPOINTS ───────────────────────────────────────────────────────

    // GET Group Chat Messages
    @GetMapping("/{courseId}/chats/group")
    public ResponseEntity<?> getGroupMessages(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User user = userRepository.findById(userDetails.getId()).get();

        if (!checkAccess(user, course)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You do not have access to this course!"));
        }

        List<ChatMessageResponse> messages = messageRepository.findByCourseAndIsGroupOrderByTimestampAsc(course, true).stream()
                .map(m -> ChatMessageResponse.builder()
                        .id(m.getId())
                        .courseId(m.getCourse().getId())
                        .senderId(m.getSender().getId())
                        .senderName(m.getSender().getFirstName() + " " + m.getSender().getLastName())
                        .recipientId(null)
                        .recipientName(null)
                        .content(m.getContent())
                        .isGroup(true)
                        .timestamp(m.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(messages);
    }

    // POST Group Chat Message
    @PostMapping("/{courseId}/chats/group")
    public ResponseEntity<?> sendGroupMessage(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId,
            @RequestBody Map<String, String> payload
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User sender = userRepository.findById(userDetails.getId()).get();

        if (!checkAccess(sender, course)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You do not have access to this course!"));
        }

        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Content cannot be empty!"));
        }

        Message message = Message.builder()
                .course(course)
                .sender(sender)
                .recipient(null)
                .content(content.trim())
                .isGroup(true)
                .timestamp(Instant.now())
                .build();

        Message saved = messageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.builder()
                .id(saved.getId())
                .courseId(saved.getCourse().getId())
                .senderId(saved.getSender().getId())
                .senderName(saved.getSender().getFirstName() + " " + saved.getSender().getLastName())
                .content(saved.getContent())
                .isGroup(true)
                .timestamp(saved.getTimestamp())
                .build();

        return ResponseEntity.ok(response);
    }

    // GET Direct Chat Messages (For Student chatting with Course Teacher)
    @GetMapping("/{courseId}/chats/direct")
    public ResponseEntity<?> getDirectMessagesForStudent(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User student = userRepository.findById(userDetails.getId()).get();

        // Enforce student enrollment
        if (!enrollmentRepository.findByStudentAndCourse(student, course).isPresent()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You must be enrolled in this course!"));
        }

        User teacher = course.getTeacher();

        List<ChatMessageResponse> messages = messageRepository.findDirectMessages(course, student, teacher).stream()
                .map(m -> ChatMessageResponse.builder()
                        .id(m.getId())
                        .courseId(m.getCourse().getId())
                        .senderId(m.getSender().getId())
                        .senderName(m.getSender().getFirstName() + " " + m.getSender().getLastName())
                        .recipientId(m.getRecipient().getId())
                        .recipientName(m.getRecipient().getFirstName() + " " + m.getRecipient().getLastName())
                        .content(m.getContent())
                        .isGroup(false)
                        .timestamp(m.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(messages);
    }

    // POST Direct Chat Message (Student sends message to Course Teacher)
    @PostMapping("/{courseId}/chats/direct")
    public ResponseEntity<?> sendDirectMessageFromStudent(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId,
            @RequestBody Map<String, String> payload
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User student = userRepository.findById(userDetails.getId()).get();

        if (!enrollmentRepository.findByStudentAndCourse(student, course).isPresent()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You must be enrolled in this course!"));
        }

        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Content cannot be empty!"));
        }

        User teacher = course.getTeacher();

        Message message = Message.builder()
                .course(course)
                .sender(student)
                .recipient(teacher)
                .content(content.trim())
                .isGroup(false)
                .timestamp(Instant.now())
                .build();

        Message saved = messageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.builder()
                .id(saved.getId())
                .courseId(saved.getCourse().getId())
                .senderId(saved.getSender().getId())
                .senderName(saved.getSender().getFirstName() + " " + saved.getSender().getLastName())
                .recipientId(saved.getRecipient().getId())
                .recipientName(saved.getRecipient().getFirstName() + " " + saved.getRecipient().getLastName())
                .content(saved.getContent())
                .isGroup(false)
                .timestamp(saved.getTimestamp())
                .build();

        return ResponseEntity.ok(response);
    }

    // GET Direct Chat Messages (For Teacher chatting with a specific Student)
    @GetMapping("/{courseId}/chats/direct/{studentId}")
    public ResponseEntity<?> getDirectMessagesForTeacher(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId,
            @PathVariable Long studentId
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User teacher = userRepository.findById(userDetails.getId()).get();

        // Ownership validation
        if (teacher.getRole() != Role.ADMIN && !course.getTeacher().getId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You do not own this course!"));
        }

        Optional<User> studentOpt = userRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Student not found!"));
        }

        User student = studentOpt.get();

        // Verify student is enrolled in the course
        if (!enrollmentRepository.findByStudentAndCourse(student, course).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Student is not enrolled in this course!"));
        }

        List<ChatMessageResponse> messages = messageRepository.findDirectMessages(course, teacher, student).stream()
                .map(m -> ChatMessageResponse.builder()
                        .id(m.getId())
                        .courseId(m.getCourse().getId())
                        .senderId(m.getSender().getId())
                        .senderName(m.getSender().getFirstName() + " " + m.getSender().getLastName())
                        .recipientId(m.getRecipient().getId())
                        .recipientName(m.getRecipient().getFirstName() + " " + m.getRecipient().getLastName())
                        .content(m.getContent())
                        .isGroup(false)
                        .timestamp(m.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(messages);
    }

    // POST Direct Chat Message (Teacher sends message to specific Student)
    @PostMapping("/{courseId}/chats/direct/{studentId}")
    public ResponseEntity<?> sendDirectMessageFromTeacher(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId,
            @PathVariable Long studentId,
            @RequestBody Map<String, String> payload
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User teacher = userRepository.findById(userDetails.getId()).get();

        if (teacher.getRole() != Role.ADMIN && !course.getTeacher().getId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You do not own this course!"));
        }

        Optional<User> studentOpt = userRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Student not found!"));
        }

        User student = studentOpt.get();

        if (!enrollmentRepository.findByStudentAndCourse(student, course).isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Student is not enrolled in this course!"));
        }

        String content = payload.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Content cannot be empty!"));
        }

        Message message = Message.builder()
                .course(course)
                .sender(teacher)
                .recipient(student)
                .content(content.trim())
                .isGroup(false)
                .timestamp(Instant.now())
                .build();

        Message saved = messageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.builder()
                .id(saved.getId())
                .courseId(saved.getCourse().getId())
                .senderId(saved.getSender().getId())
                .senderName(saved.getSender().getFirstName() + " " + saved.getSender().getLastName())
                .recipientId(saved.getRecipient().getId())
                .recipientName(saved.getRecipient().getFirstName() + " " + saved.getRecipient().getLastName())
                .content(saved.getContent())
                .isGroup(false)
                .timestamp(saved.getTimestamp())
                .build();

        return ResponseEntity.ok(response);
    }

    // GET Course Enrolled Students (Teacher needs this for starting chat channels)
    @GetMapping("/{courseId}/chats/students")
    public ResponseEntity<?> listCourseStudents(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long courseId
    ) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Error: Course not found!"));
        }

        Course course = courseOpt.get();
        User teacher = userRepository.findById(userDetails.getId()).get();

        if (teacher.getRole() != Role.ADMIN && !course.getTeacher().getId().equals(teacher.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Error: You do not own this course!"));
        }

        List<EnrolledStudentInfo> students = enrollmentRepository.findByCourse(course).stream()
                .map(e -> EnrolledStudentInfo.builder()
                        .id(e.getStudent().getId())
                        .firstName(e.getStudent().getFirstName())
                        .lastName(e.getStudent().getLastName())
                        .email(e.getStudent().getEmail())
                        .enrollmentDate(e.getEnrollmentDate())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(students);
    }
}
