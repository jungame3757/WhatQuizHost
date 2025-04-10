// Firebase 초기화 및 기본 설정

// Firebase 초기화 상태 플래그
window.firebaseInitialized = false;

// Unity 인스턴스 참조 저장
window.unityInstance = null;

// 현재 사용자 정보 저장
window.currentUser = null;

// 로그인 이벤트 중복 방지 플래그
window.loginEventSent = false;

// Firebase 초기화 함수
window.initializeFirebase = function() {
    try {
        // 이미 초기화된 경우 처리
        if (window.firebaseInitialized) {
            console.log("Firebase가 이미 초기화되었습니다.");
            return true;
        }

        // Firebase 설정 정보 (Firebase 콘솔에서 확인 가능)
        const firebaseConfig = {
            apiKey: "AIzaSyCZrKm6PAuNBGvJDCtXs6ldtRSkw4FTNHM",
            authDomain: "quiztest-8600d.firebaseapp.com",
            projectId: "quiztest-8600d",
            databaseURL: "https://quiztest-8600d-default-rtdb.asia-southeast1.firebasedatabase.app",
            storageBucket: "quiztest-8600d.firebasestorage.app",
            messagingSenderId: "1001508556525",
            appId: "1:1001508556525:web:24c5dbc5ec30ba1876c6e4"
        };

        // Firebase 앱 초기화
        firebase.initializeApp(firebaseConfig);

        console.log("Firebase가 성공적으로 초기화되었습니다.");
        window.firebaseInitialized = true;

        // 초기화 후 Firebase 기본 함수 존재 여부 확인
        console.log("Firebase 함수 초기화 확인:", {
            firebaseCheckAndSaveData: typeof window.firebaseCheckAndSaveData === 'function',
            firebaseSaveData: typeof window.firebaseSaveData === 'function',
            firebaseLoadData: typeof window.firebaseLoadData === 'function'
        });

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

                // 명시적 로그인에서 이미 이벤트를 보낸 경우, 중복 전송 방지
                if (!window.loginEventSent) {
                    window.loginEventSent = true;
                    console.log("onAuthStateChanged에서 로그인 이벤트 전송");
                    
                    // Unity에 로그인 정보 전송 (Unity 인스턴스가 준비된 경우)
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(window.currentUser));
                    }
                    
                    // 5초 후 플래그 초기화 (다음 로그인을 위해)
                    setTimeout(function() {
                        window.loginEventSent = false;
                    }, 5000);
                } else {
                    console.log("로그인 이벤트가 이미 전송됨 - onAuthStateChanged에서 중복 전송 방지");
                }
            } else {
                // 사용자가 로그아웃한 경우
                console.log("로그아웃 상태");
                window.currentUser = null;
                window.loginEventSent = false; // 로그아웃 시 플래그 초기화
            }
        });

        return true;
    } catch (error) {
        console.error("Firebase 초기화 오류:", error);
        return false;
    }
};

// Unity 인스턴스가 준비되었을 때 저장된 사용자 정보 확인 및 전송
window.checkAndSendSavedUserInfo = function() {
    if (window.currentUser && window.unityInstance && !window.loginEventSent) {
        window.loginEventSent = true;
        console.log("저장된 사용자 정보를 Unity로 전송:", window.currentUser.displayName);
        window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(window.currentUser));
        
        // 5초 후 플래그 초기화
        setTimeout(function() {
            window.loginEventSent = false;
        }, 5000);
    } else if (window.loginEventSent) {
        console.log("로그인 이벤트가 이미 전송됨 - checkAndSendSavedUserInfo에서 중복 전송 방지");
    }
};

// 페이지 로드 완료 시 Firebase 초기화
window.addEventListener('DOMContentLoaded', function() {
    // Firebase SDK가 로드되었는지 확인
    if (typeof firebase !== 'undefined') {
        window.initializeFirebase();
    } else {
        console.error("Firebase SDK를 찾을 수 없습니다. Script 태그가 HTML에 포함되어 있는지 확인하세요.");
    }
});
