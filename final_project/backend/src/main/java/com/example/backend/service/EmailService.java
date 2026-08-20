package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String firstName, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Verify Your Email - Santhosh LMS");
            message.setText("Hello " + firstName + ",\n\n" +
                    "Thank you for registering at Santhosh LMS.\n" +
                    "Your 6-digit OTP verification code is: " + otp + "\n\n" +
                    "Here is your verification code: " + otp + "\n\n" +
                    "Please verify your email to access your account.\n\n" +
                    "Best regards,\nSanthosh LMS Team");
            mailSender.send(message);
            System.out.println("Email successfully sent via SMTP to: " + toEmail);
            System.out.println("Your 6-digit OTP verification code is: " + otp);
            System.out.println("Here is your verification code: " + otp);
        } catch (Exception e) {
            System.err.println("SMTP send failed (Message: " + e.getMessage() + "). Falling back to simulated output.");
            printSimulation(toEmail, firstName, otp, "SMTP connection failure");
        }
    }

    private void printSimulation(String toEmail, String firstName, String otp, String reason) {
        System.out.println("==================================================================");
        System.out.println("            EMAIL SIMULATION (FALLBACK - " + reason.toUpperCase() + ")");
        System.out.println("==================================================================");
        System.out.println("To: " + toEmail);
        System.out.println("Subject: Verify Your Email - Santhosh LMS");
        System.out.println("Body:");
        System.out.println("Hello " + firstName + ",");
        System.out.println("Your 6-digit OTP verification code is: " + otp);
        System.out.println("This OTP is stored in your account database for verification.");
        System.out.println("==================================================================");
    }
}
