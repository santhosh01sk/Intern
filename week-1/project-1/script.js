document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginDetailsForm');
  const savedUserName = document.getElementById('savedUserName');
  const savedUserEmail = document.getElementById('savedUserEmail');
  const courseRegisterButtons = document.querySelectorAll('.course-register-button');
  const courseChoiceButtons = document.querySelectorAll('.course-choice-button');
  const selectedCourseName = document.getElementById('selectedCourseName');
  const selectedCourseFee = document.getElementById('selectedCourseFee');

  if (savedUserName && savedUserEmail) {
    const savedName = localStorage.getItem('cr_name');
    const savedEmail = localStorage.getItem('cr_email');

    if (savedName && savedEmail) {
      savedUserName.textContent = savedName;
      savedUserEmail.textContent = savedEmail;
    }
  }

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

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const fullNameInput = document.getElementById('loginFullName');
      const emailAddressInput = document.getElementById('loginEmailAddress');
      const passwordInput = document.getElementById('loginPassword');

      const name = fullNameInput.value.trim();
      const email = emailAddressInput.value.trim();
      const password = passwordInput.value.trim();

      if (!name || !email || !password) {
        alert('Please fill in name, email, and password.');
        return;
      }

      localStorage.setItem('cr_name', name);
      localStorage.setItem('cr_email', email);
      window.location.href = 'index.html';
    });
  }
});