document.addEventListener('DOMContentLoaded', function () {
    const messageForm = document.getElementById('message-form');
    const textarea = document.getElementById('content');
    const editButtons = document.querySelectorAll('.edit-button');

    function saveMessage(messageDiv, button) {
        const messageId = messageDiv.getAttribute('data-id');
        const newContent = messageDiv.innerHTML;
        fetch(`/edit_message/${messageId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `new_content=${encodeURIComponent(newContent)}`,
        }).then(response => {
            if (response.ok) {
                messageDiv.contentEditable = false;
                button.textContent = '🖉';
                button.classList.add('edit-button');
                button.classList.remove('save-button');
                // return response.json();
                //reload
                location.reload();
            }
        })
            // .then((data) => {
            //     clearMap();
            //     data.forEach((node) => {
            //         addToTree(node);
            //     });
            //     repaintMap();
            // });
    }

    // Enviar mensaje con Ctrl+Enter
    textarea.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            messageForm.submit();
        }
    });

    // Editar o guardar mensaje
    editButtons.forEach(button => {
        button.addEventListener('click', function () {
            const messageDiv = button.previousElementSibling;
            if (messageDiv.contentEditable === 'true') {
                saveMessage(messageDiv, button);
            } else {
                messageDiv.contentEditable = true;
                messageDiv.focus();
                button.textContent = '🖫';
                button.classList.add('save-button');
                button.classList.remove('edit-button');
            }
        });
    });

    // Guardar cambios de mensaje con Ctrl+Enter
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'Enter' && e.target.contentEditable === 'true') {
            e.preventDefault();
            const messageDiv = e.target;
            saveMessage(messageDiv, messageDiv.nextElementSibling);
        }
    });
});
