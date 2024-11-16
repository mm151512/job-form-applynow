document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('jobApplicationForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission

        if (validateForm()) {
            // If the form is valid, submit it using fetch
            fetch(form.action, {
                method: form.method,
                body: new FormData(form)
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    form.reset(); // Clear the form
                    window.location.href = '/success.html'; // Redirect to the success page
                } else {
                    throw new Error('Error processing the request.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while submitting the form. Please try again.');
            });
        } else {
            alert('Please fill out all required fields correctly.');
        }
    });

    function validateForm() {
        let isValid = true;
        
        // Check all required inputs
        form.querySelectorAll('[required]').forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        });
        
        return isValid;
    }
});
