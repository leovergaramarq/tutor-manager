import fetch from "./fetch.js";

document
    .querySelector(".navbar__logout")
    .addEventListener("click", async () => {
        try {
            const { status } = await fetch("/api/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            if (status !== 201) throw new Error("Server error" + status + ".");
            window.location.href = "/login";
        } catch (err) {
            console.error(err);
        }
    });
