package com.example.backend.controller;

import com.example.backend.dto.ChatMessageResponse;
import com.example.backend.dto.MaterialResponse;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import com.example.backend.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CourseFeaturesControllerTest {

    @InjectMocks
    private CourseFeaturesController courseFeaturesController;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private MaterialRepository materialRepository;

    @Mock
    private MessageRepository messageRepository;

    private User student;
    private User teacher;
    private Course course;
    private UserDetailsImpl studentDetails;
    private UserDetailsImpl teacherDetails;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        student = User.builder()
                .id(1L)
                .email("student@example.com")
                .firstName("John")
                .lastName("Student")
                .role(Role.STUDENT)
                .build();

        teacher = User.builder()
                .id(2L)
                .email("teacher@example.com")
                .firstName("Jane")
                .lastName("Teacher")
                .role(Role.TEACHER)
                .build();

        course = Course.builder()
                .id(10L)
                .title("Software Engineering")
                .teacher(teacher)
                .build();

        studentDetails = UserDetailsImpl.build(student);
        teacherDetails = UserDetailsImpl.build(teacher);
    }

    @Test
    @SuppressWarnings("unchecked")
    void testListMaterials_StudentEnrolled_Success() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findByStudentAndCourse(student, course))
                .thenReturn(Optional.of(new Enrollment()));

        Material material = Material.builder()
                .id(100L)
                .title("Lecture Slides")
                .fileName("lec1.pdf")
                .contentType("application/pdf")
                .uploadedAt(Instant.now())
                .course(course)
                .build();

        when(materialRepository.findByCourseOrderByUploadedAtDesc(course))
                .thenReturn(List.of(material));

        ResponseEntity<?> response = courseFeaturesController.listMaterials(studentDetails, 10L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<MaterialResponse> list = (List<MaterialResponse>) response.getBody();
        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("Lecture Slides", list.get(0).getTitle());
    }

    @Test
    void testListMaterials_StudentNotEnrolled_Forbidden() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findByStudentAndCourse(student, course))
                .thenReturn(Optional.empty());

        ResponseEntity<?> response = courseFeaturesController.listMaterials(studentDetails, 10L);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    @SuppressWarnings("unchecked")
    void testGetGroupMessages_TeacherHasAccess() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(userRepository.findById(2L)).thenReturn(Optional.of(teacher));

        Message groupMessage = Message.builder()
                .id(200L)
                .course(course)
                .sender(student)
                .content("Hello class")
                .isGroup(true)
                .timestamp(Instant.now())
                .build();

        when(messageRepository.findByCourseAndIsGroupOrderByTimestampAsc(course, true))
                .thenReturn(List.of(groupMessage));

        ResponseEntity<?> response = courseFeaturesController.getGroupMessages(teacherDetails, 10L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<ChatMessageResponse> list = (List<ChatMessageResponse>) response.getBody();
        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("Hello class", list.get(0).getContent());
    }

    @Test
    void testSendGroupMessage_StudentEnrolled_Success() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findByStudentAndCourse(student, course))
                .thenReturn(Optional.of(new Enrollment()));

        Map<String, String> payload = Map.of("content", "Question about exam");

        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
            Message m = invocation.getArgument(0);
            m.setId(201L);
            return m;
        });

        ResponseEntity<?> response = courseFeaturesController.sendGroupMessage(studentDetails, 10L, payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ChatMessageResponse msgResp = (ChatMessageResponse) response.getBody();
        assertNotNull(msgResp);
        assertEquals("Question about exam", msgResp.getContent());
        assertTrue(msgResp.isGroup());
    }
}
