// ✅ Firebase Konfigürasyonu
const firebaseConfig = {
    apiKey: "AIzaSyC4fkt69HFBsEXQTb8pYjubq-lVgJumqpI",
    authDomain: "bloodconnect-42fe6.firebaseapp.com",
    databaseURL: "https://bloodconnect-42fe6-default-rtdb.firebaseio.com",
    projectId: "bloodconnect-42fe6",
    storageBucket: "bloodconnect-42fe6.appspot.com",
    messagingSenderId: "1051426945424",
    appId: "1:1051426945424:web:63f5a608c57fca18c99b15",
    measurementId: "G-H4SYSG4X8D"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.href;

    // 🔐 LOGIN
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value.trim();

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert("Giriş başarılı!");
                    localStorage.setItem("isLoggedIn", "true");
                    window.location.href = "../dashboard/dashboard.html";
                })
                .catch((error) => {
                    const errorMessage = document.getElementById("error-message");
                    if (errorMessage) {
                        errorMessage.style.display = "block";
                        errorMessage.textContent = "Hata: " + error.message;
                    } else {
                        alert("Hata: " + error.message);
                    }
                });
        });

        const loginButton = document.getElementById("login-button");
        if (loginButton) {
            loginButton.addEventListener("click", () => {
                document.getElementById("login-container").classList.remove("hidden");
            });
        }

        const closeLogin = document.getElementById("close-login");
        if (closeLogin) {
            closeLogin.addEventListener("click", () => {
                document.getElementById("login-container").classList.add("hidden");
            });
        }
    }

    // 🧾 REGISTER
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const password = document.getElementById("register-password").value.trim();
            const confirmPassword = document.getElementById("confirm-password").value.trim();

            if (password !== confirmPassword) {
                alert("Şifreler uyuşmuyor!");
                return;
            }

            const firstName = document.getElementById("first-name").value.trim();
            const lastName = document.getElementById("last-name").value.trim();
            const idNumber = document.getElementById("id-number").value.trim();
            const gender = document.getElementById("gender").value.trim();
            const address = document.getElementById("address").value.trim();
            const birthDateInput = document.getElementById("birth-date").value.trim();
            const birthDate = firebase.firestore.Timestamp.fromDate(new Date(birthDateInput));
            const phone = document.getElementById("phone").value.trim();
            const email = document.getElementById("register-email").value.trim();
            const bloodType = document.getElementById("blood-type").value.trim();
            const height = parseFloat(document.getElementById("height").value.trim());
            const weight = parseFloat(document.getElementById("weight").value.trim());


            if (!firstName || !lastName || !email || !password || !bloodType || !height || !weight) {
                alert("Lütfen tüm zorunlu alanları doldurun!");
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const uid = userCredential.user.uid;
                    return db.collection("donor").doc(uid).set({
                        donorID: uid,
                        name: firstName,
                        surname: lastName,
                        gender: gender,
                        idnumber: idNumber,
                        address: address,
                        birthDate: birthDate,
                        phone: phone,
                        email: email,
                        password: "",
                        bloodType: bloodType,
                        height: height,
                        weight: weight
                    });
                })
                .then(() => {
                    alert("Kayıt başarılı! Giriş ekranına yönlendiriliyorsunuz.");
                    registerForm.reset();
                    return auth.signOut();
                })
                .then(() => {
                    window.location.href = "login.html";
                })
                .catch((error) => {
                    console.error("Kayıt hatası:", error);
                    alert("Hata: " + error.message);
                });
        });
    }

    // 🌐 NAVIGASYON (donation.html için kontrol)
    if (currentPage.includes("donation.html")) {
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        if (isLoggedIn !== "true") {
            alert("Bağış sayfasına erişmek için giriş yapmalısınız.");
            window.location.href = "../index.html";
        }
    }

    // 🧾 DONATION VERİLERİNİ LİSTELEME
    auth.onAuthStateChanged(async (user) => {
        if (!user && currentPage.includes("donation.html")) {
            alert("Giriş yapmanız gerekiyor.");
            window.location.href = "../pages/login.html";
            return;
        }

        if (!user) return;

        const uid = user.uid;

        try {
            const donorDoc = await db.collection("donor").doc(uid).get();
            if (!donorDoc.exists) throw new Error("Donor bulunamadı.");

            const donorData = donorDoc.data();
            const donorFullName = `${donorData.name || ""} ${donorData.surname || ""}`;

            const donationSnap = await db.collection("donation")
                .where("donorID", "==", uid)
                .orderBy("donationTime", "desc")
                .get();

            const listContainer = document.getElementById("donation-list");
            if (listContainer) listContainer.innerHTML = "";

            for (const doc of donationSnap.docs) {
                const data = doc.data();
                const date = data.donationTime?.toDate?.()
                    ? new Date(data.donationTime.toDate()).toLocaleDateString("tr-TR")
                    : "Tarih yok";

                let hospitalName = "Bilinmiyor";
                if (data.hospitalID) {
                    const hospitalDoc = await db.collection("hospital").doc(data.hospitalID).get();
                    if (hospitalDoc.exists) {
                        hospitalName = hospitalDoc.data().hospitalName || data.hospitalID;
                    }
                }

                const card = document.createElement("div");
                card.className = "donation-card";
                card.innerHTML = `
                    <div class="donation-top">
                        <span><strong>Donation ID:</strong> ${data.donationID || doc.id}</span>
                        <span><strong>${date}</strong></span>
                    </div>
                    <div class="donation-info">
                        <p><strong>Donor:</strong> ${donorFullName}</p>
                        <p><strong>Status:</strong> ${data.status || "N/A"}</p>
                        <p><strong>Blood Type:</strong> ${data.bloodType || "N/A"}</p>
                        <p><strong>Hospital:</strong> ${hospitalName}</p>
                    </div>
                `;
                if (listContainer) listContainer.appendChild(card);
            }

        } catch (err) {
            console.error("❌ Hata:", err.message);
            alert("Veriler alınırken hata oluştu.");
        }

        // ✅ LOGOUT
        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
            logoutButton.addEventListener("click", function (e) {
                e.preventDefault();
                auth.signOut()
                    .then(() => {
                        alert("Çıkış başarılı!");
                        localStorage.removeItem("isLoggedIn");
                        window.location.href = "../pages/login.html";
                    })
                    .catch((error) => {
                        console.error("Çıkış başarısız:", error);
                        alert("Çıkış başarısız: " + error.message);
                    });
            });
        } else {
            console.warn("⚠️ Logout butonu bulunamadı.");
        }
    });
});
