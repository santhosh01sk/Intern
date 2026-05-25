document.addEventListener('DOMContentLoaded', () => {
  // Common navigation & session handler
  const savedUserName = document.getElementById('savedUserName');
  const savedUserEmail = document.getElementById('savedUserEmail');
  const courseRegisterButtons = document.querySelectorAll('.course-register-button');
  const courseChoiceButtons = document.querySelectorAll('.course-choice-button');
  const selectedCourseName = document.getElementById('selectedCourseName');
  const selectedCourseFee = document.getElementById('selectedCourseFee');

  // Verify login status
  const savedName = localStorage.getItem('cr_name');
  const savedEmail = localStorage.getItem('cr_email');

  if (savedName && savedEmail) {
    document.body.classList.add('logged-in');
    if (savedUserName) savedUserName.textContent = savedName;
    if (savedUserEmail) savedUserEmail.textContent = savedEmail;
  }

  // Handle Logout
  const logoutButtons = document.querySelectorAll('.logout-link, .logout-btn');
  logoutButtons.forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('cr_name');
      localStorage.removeItem('cr_email');
      window.location.href = 'index.html';
    });
  });

  // Ensure default dummy user exists for demo testing
  let users = JSON.parse(localStorage.getItem('cr_users') || '[]');
  if (users.length === 0) {
    users.push({
      name: 'santhosh',
      email: 'santhosh@gmail.com',
      password: 'password123'
    });
    localStorage.setItem('cr_users', JSON.stringify(users));
  }

  // Course selections & page flows
  function storeSelectedCourse(button) {
    const courseName = button.getAttribute('data-course-name');
    const courseFee = button.getAttribute('data-course-fee');
    const courseLevel = button.getAttribute('data-course-level') || '';

    if (courseName) {
      localStorage.setItem('cr_course_name', courseName);
    }

    if (courseFee) {
      localStorage.setItem('cr_course_fee', courseFee);
    }

    if (courseLevel) {
      localStorage.setItem('cr_course_level', courseLevel);
    }
  }

  function loadSelectedCourse() {
    if (!selectedCourseName || !selectedCourseFee) {
      return;
    }

    const courseName = localStorage.getItem('cr_course_name');
    const courseFee = localStorage.getItem('cr_course_fee');

    if (courseName) {
      selectedCourseName.value = courseName;
    }

    if (courseFee) {
      selectedCourseFee.value = courseFee;
    }
  }

  courseRegisterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      storeSelectedCourse(button);
    });
  });

  courseChoiceButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      storeSelectedCourse(button);
      loadSelectedCourse();

      const paymentSection = document.getElementById('paymentForm');
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  loadSelectedCourse();

  // LOGIN PAGE HANDLER
  const loginForm = document.getElementById('loginDetailsForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const emailAddressInput = document.getElementById('loginEmailAddress');
      const passwordInput = document.getElementById('loginPassword');

      const email = emailAddressInput.value.trim().toLowerCase();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        alert('Please fill in both email and password.');
        return;
      }

      const usersList = JSON.parse(localStorage.getItem('cr_users') || '[]');
      const matchedUser = usersList.find(u => u.email.toLowerCase() === email && u.password === password);

      if (!matchedUser) {
        alert('Invalid email or password. If you do not have an account, please Sign Up.');
        return;
      }

      localStorage.setItem('cr_name', matchedUser.name);
      localStorage.setItem('cr_email', matchedUser.email);
      window.location.href = 'index.html';
    });
  }

  // SIGNUP PAGE HANDLER
  const signupForm = document.getElementById('signupDetailsForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const fullNameInput = document.getElementById('signupFullName');
      const emailAddressInput = document.getElementById('signupEmailAddress');
      const passwordInput = document.getElementById('signupPassword');
      const confirmPasswordInput = document.getElementById('signupConfirmPassword');

      const name = fullNameInput.value.trim();
      const email = emailAddressInput.value.trim().toLowerCase();
      const password = passwordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all the form fields.');
        return;
      }

      if (password !== confirmPassword) {
        alert('Passwords do not match. Please verify passwords.');
        return;
      }

      const usersList = JSON.parse(localStorage.getItem('cr_users') || '[]');
      const userExists = usersList.some(u => u.email.toLowerCase() === email);

      if (userExists) {
        alert('This email is already registered. Please login instead.');
        return;
      }

      usersList.push({ name, email, password });
      localStorage.setItem('cr_users', JSON.stringify(usersList));
      alert('Registration successful! You can now log in.');
      window.location.href = 'login.html';
    });
  }

  // PAYMENT / COURSE ENROLLMENT PAGE HANDLER
  const paymentDetailsForm = document.getElementById('paymentDetailsForm');
  if (paymentDetailsForm) {
    paymentDetailsForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const userEmail = localStorage.getItem('cr_email');
      if (!userEmail) {
        alert('Please log in or register an account first to complete enrollment.');
        window.location.href = 'login.html';
        return;
      }

      const courseName = selectedCourseName.value;
      const courseFee = selectedCourseFee.value;

      if (!courseName || !courseFee) {
        alert('Invalid course selection.');
        return;
      }

      const userCoursesKey = `cr_reg_courses_${userEmail.toLowerCase()}`;
      const regCourses = JSON.parse(localStorage.getItem(userCoursesKey) || '[]');

      if (regCourses.some(c => c.name === courseName)) {
        alert(`You are already registered for "${courseName}". Redirecting to profile page.`);
        window.location.href = 'profile.html';
        return;
      }

      regCourses.push({
        name: courseName,
        fee: courseFee,
        date: new Date().toLocaleDateString()
      });

      localStorage.setItem(userCoursesKey, JSON.stringify(regCourses));
      alert(`Registration Successful! You have registered for "${courseName}".`);
      window.location.href = 'profile.html';
    });
  }

  // PROFILE PAGE RENDERER
  const coursesContainer = document.getElementById('registeredCoursesContainer');
  if (coursesContainer) {
    const userEmail = localStorage.getItem('cr_email');
    if (!userEmail) {
      window.location.href = 'login.html';
      return;
    }

    const userCoursesKey = `cr_reg_courses_${userEmail.toLowerCase()}`;
    const regCourses = JSON.parse(localStorage.getItem(userCoursesKey) || '[]');

    if (regCourses.length > 0) {
      coursesContainer.innerHTML = ''; // Clear the "no courses" placeholder message
      regCourses.forEach((course) => {
        const item = document.createElement('div');
        item.className = 'registered-course-item';
        item.innerHTML = `
          <div class="registered-course-info">
            <h4>${course.name}</h4>
            <div class="registered-course-meta">
              <span>Fee: ${course.fee}</span>
              <span>Enrolled: ${course.date}</span>
            </div>
          </div>
          <span class="badge success">Enrolled</span>
        `;
        coursesContainer.appendChild(item);
      });
    }
  }
});