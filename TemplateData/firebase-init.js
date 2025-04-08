// Firebase 초기화 및 기본 설정
(function() {
    // Firebase 초기화 상태 플래그
    window.firebaseInitialized = false;

    // Unity 인스턴스 참조 저장
    window.unityInstance = null;

    // 현재 사용자 정보 저장
    window.currentUser = null;

    // Unity 인스턴스 설정 함수
    window.setUnityInstance = function(instance) {
        console.log("Unity 인스턴스 설정됨");
        window.unityInstance = instance;

        // 설정 직후 초기화 상태 확인 및 로그인 상태 전송
        if (window.firebaseInitialized) {
            checkAndSendSavedUserInfo();
        }
    };

    // Firebase 초기화 함수
    window.initializeFirebase = function() {
        try {
            // Firebase 설정 정보 (Firebase 콘솔에서 확인 가능)
            const firebaseConfig = {
                apiKey: "AIzaSyCZrKm6PAuNBGvJDCtXs6ldtRSkw4FTNHM",
                authDomain: "quiztest-8600d.firebaseapp.com",
                projectId: "quiztest-8600d",
                storageBucket: "quiztest-8600d.firebasestorage.app",
                messagingSenderId: "1001508556525",
                appId: "1:1001508556525:web:24c5dbc5ec30ba1876c6e4"
            };

            // Firebase 앱 초기화
            firebase.initializeApp(firebaseConfig);

            console.log("Firebase가 성공적으로 초기화되었습니다.");
            window.firebaseInitialized = true;

            // 인증 상태 변경 감지
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    // 사용자가 로그인한 경우
                    console.log("사용자 로그인 상태:", user.email);
                    window.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || user.email.split('@')[0]
                    };

                    // Unity에 로그인 정보 전송 (Unity 인스턴스가 준비된 경우)
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(window.currentUser));
                    }
                } else {
                    // 사용자가 로그아웃한 경우
                    console.log("로그아웃 상태");
                    window.currentUser = null;
                }
            });

            return true;
        } catch (error) {
            console.error("Firebase 초기화 오류:", error);
            return false;
        }
    };

    // Unity 인스턴스가 준비되었을 때 저장된 사용자 정보 확인 및 전송
    function checkAndSendSavedUserInfo() {
        if (window.currentUser && window.unityInstance) {
            console.log("저장된 사용자 정보를 Unity로 전송:", window.currentUser.displayName);
            window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(window.currentUser));
        }
    }

    // 페이지 로드 완료 시 Firebase 초기화
    window.addEventListener('DOMContentLoaded', function() {
        // Firebase SDK가 로드되었는지 확인
        if (typeof firebase !== 'undefined') {
            window.initializeFirebase();
        } else {
            console.error("Firebase SDK를 찾을 수 없습니다. Script 태그가 HTML에 포함되어 있는지 확인하세요.");
        }
    });
})();
