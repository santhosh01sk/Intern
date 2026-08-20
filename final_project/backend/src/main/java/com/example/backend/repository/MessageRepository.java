package com.example.backend.repository;

import com.example.backend.model.Message;
import com.example.backend.model.Course;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByCourseAndIsGroupOrderByTimestampAsc(Course course, boolean isGroup);

    @Query("SELECT m FROM Message m WHERE m.course = :course AND m.isGroup = false AND " +
           "((m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1)) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findDirectMessages(
            @Param("course") Course course,
            @Param("user1") User user1,
            @Param("user2") User user2);
}
