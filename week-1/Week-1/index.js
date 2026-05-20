var form = document.getElementById("contact-form");

if (form) {
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        var name = document.getElementById("name");
        var email = document.getElementById("email");
        var emailPattern = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!name || !email) {
            return;
        }

        if (name.value.trim() === "") {
            alert("Name cannot be empty");
            return;
        }

        if (!emailPattern.test(email.value.trim())) {
            alert("Invalid email address");
            return;
        }

        alert("Form submitted successfully");
        window.location.href = "index.html";
    });
}
