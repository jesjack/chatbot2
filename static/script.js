document.addEventListener('DOMContentLoaded', function () {
    const messageForm = document.getElementById('message-form');
    const textarea = document.getElementById('content');
    const editButtons = document.querySelectorAll('.edit-button');

    // Enviar mensaje con Ctrl+Enter
    textarea.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            messageForm.submit();
        }
    });

    // Editar mensaje
    editButtons.forEach(button => {
        button.addEventListener('click', function () {
            const messageDiv = this.parentElement;
            const contentDiv = messageDiv.querySelector('.message-content');
            contentDiv.contentEditable = true;
            contentDiv.focus();
            this.textContent = 'Save';
            this.classList.add('save-button');
            this.classList.remove('edit-button');
        });
    });

    // Guardar cambios de mensaje con Ctrl+Enter
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'Enter' && e.target.contentEditable === 'true') {
            e.preventDefault();
            const messageDiv = e.target.parentElement;
            const messageId = messageDiv.getAttribute('data-id');
            const newContent = e.target.innerHTML;
            fetch(`/edit_message/${messageId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `content=${encodeURIComponent(newContent)}`,
            }).then(response => {
                if (response.ok) {
                    e.target.contentEditable = false;
                    messageDiv.querySelector('.edit-button').textContent = 'Edit';
                    messageDiv.querySelector('.edit-button').classList.add('edit-button');
                    messageDiv.querySelector('.edit-button').classList.remove('save-button');
                }
            });
        }
    });
});
