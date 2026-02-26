(function () {
  const body = document.body;
  const stored = window.localStorage.getItem('userKey');
  const serverKey = body ? body.dataset.userKey : '';
  const userKey = stored || serverKey;

  if (!stored && userKey) {
    window.localStorage.setItem('userKey', userKey);
  }

  function getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-user-key': userKey
    };
  }

  const form = document.getElementById('compress-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const text = form.querySelector('textarea[name="text"]').value.trim();
      const levelInputs = Array.from(form.querySelectorAll('input[name="level"]'));
      const levels = levelInputs.map((input) => Number(input.value)).filter((value) => Number.isFinite(value));
      const maxSentences = Number(form.querySelector('input[name="maxSentences"]').value);

      const payload = { text, levels, maxSentences };

      try {
        const response = await fetch('/api/compress', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const data = await response.json();
          alert(data.error || 'Compression failed.');
          return;
        }

        const data = await response.json();
        window.location.href = `/run/${data.id}`;
      } catch (error) {
        console.error(error);
        alert('Network error.');
      }
    });
  }

  document.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const runId = button.getAttribute('data-delete-id');
      if (!runId) return;

      if (!confirm('Delete this run?')) return;

      try {
        const response = await fetch(`/api/run/${runId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });

        if (!response.ok) {
          alert('Delete failed.');
          return;
        }

        const item = button.closest('li');
        if (item) item.remove();
      } catch (error) {
        console.error(error);
        alert('Network error.');
      }
    });
  });
})();
