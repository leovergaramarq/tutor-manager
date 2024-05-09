import fetch from "./fetch.js";

document
    .querySelector(".navbar__logout")
    .addEventListener("click", async () => {
        if (
            !confirm(
                "Logging out will remove your Tutor.com user credentials from the local database. Thus, scheduling won't be possible unless you login again.\n\nAre you sure you want to logout?"
            )
        )
            return;
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
