(function () {
  const USER_KEY_KEY = "angle_user_key";
  const getUserKey = () => {
    let key = localStorage.getItem(USER_KEY_KEY);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(USER_KEY_KEY, key);
    }
    return key;
  };

  const userKey = getUserKey();

  const input = document.getElementById("inputText");
  const generateBtn = document.getElementById("generateBtn");
  const status = document.getElementById("status");
  const preview = document.getElementById("preview");

  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      status.textContent = "";
      const text = input.value.trim();
      const lensSet = document.getElementById("lensSet").value;
      const maxLen = Number(document.getElementById("maxLen").value) || 420;

      const res = await fetch("/api/angle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": userKey
        },
        body: JSON.stringify({ text, lensSet, maxOutputLen: maxLen })
      });
      const data = await res.json();
      if (!res.ok) {
        status.textContent = data.error || "Error";
        return;
      }
      status.textContent = "Saved. Redirecting...";
      window.location.href = `/run/${data.id}`;
    });
  }

  const historyList = document.getElementById("historyList");
  if (historyList) {
    historyList.addEventListener("click", async (event) => {
      if (event.target.dataset.delete) {
        await fetch(`/api/run/${event.target.dataset.delete}`, {
          method: "DELETE",
          headers: { "x-user-key": userKey }
        });
        window.location.reload();
      }
    });
  }

  const runOutputs = document.getElementById("runOutputs");
  if (runOutputs) {
    runOutputs.addEventListener("click", async (event) => {
      if (event.target.dataset.copy) {
        await navigator.clipboard.writeText(event.target.dataset.copy);
        event.target.textContent = "Copied";
        setTimeout(() => {
          event.target.textContent = "Copy";
        }, 1000);
      }
    });
  }

  const rerunBtn = document.getElementById("rerunBtn");
  if (rerunBtn) {
    rerunBtn.addEventListener("click", async () => {
      const text = document.querySelector(".mono")?.textContent || "";
      const lensSet = document.getElementById("rerunLensSet").value;
      const maxLen = Number(document.getElementById("rerunMaxLen").value) || 420;
      const res = await fetch("/api/angle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": userKey
        },
        body: JSON.stringify({ text, lensSet, maxOutputLen: maxLen })
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = `/run/${data.id}`;
      }
    });
  }
})();
