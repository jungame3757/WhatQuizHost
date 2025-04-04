/**
 * Firebase 초기화 및 관리를 위한 모듈
 */
const FirebaseModule = (function() {
    // 비공개 변수 및 함수
    let isInitialized = false;

    // Firebase 구성 정보
    const firebaseConfig = {
        apiKey: "AIzaSyCZrKm6PAuNBGvJDCtXs6ldtRSkw4FTNHM",
        authDomain: "quiztest-8600d.firebaseapp.com",
        projectId: "quiztest-8600d",
        storageBucket: "quiztest-8600d.firebasestorage.app",
        messagingSenderId: "1001508556525",
        appId: "1:1001508556525:web:24c5dbc5ec30ba1876c6e4"
    };

    /**
     * Firebase 초기화 함수
     */
    function initialize() {
        console.log("[FirebaseModule.initialize] 시작");
        if (isInitialized) {
            console.log("[FirebaseModule.initialize] Firebase가 이미 초기화되어 있습니다.");
            return;
        }

        try {
            // Firebase 초기화
            console.log("[FirebaseModule.initialize] 초기화 시도: ", firebaseConfig);
            firebase.initializeApp(firebaseConfig);
            isInitialized = true;
            console.log("[FirebaseModule.initialize] Firebase 초기화 성공");

            // 인증 상태 옵저버 설정
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    // 사용자가 로그인한 경우
                    console.log("[FirebaseModule.initialize] 사용자 로그인 상태 변경: ", user.uid);
                    if (window.unityInstance) {
                        console.log("[FirebaseModule.initialize] Unity에 로그인 성공 알림");
                        window.unityInstance.SendMessage('AuthManager', 'HandleLoginSuccess', user.uid);
                    } else {
                        console.log("[FirebaseModule.initialize] Unity 인스턴스가 없어 메시지를 전송할 수 없습니다.");
                    }
                } else {
                    // 사용자가 로그아웃한 경우
                    console.log("[FirebaseModule.initialize] 사용자 로그아웃 상태");
                    if (window.unityInstance) {
                        console.log("[FirebaseModule.initialize] Unity에 로그아웃 알림");
                        window.unityInstance.SendMessage('AuthManager', 'Logout');
                    }
                }
            });

            console.log("[FirebaseModule.initialize] 옵저버 설정 완료");
        } catch (error) {
            console.error("[FirebaseModule.initialize] Firebase 초기화 오류:", error);
        }

        console.log("[FirebaseModule.initialize] 완료");
    }

    /**
     * 저장된 사용자 정보를 확인하고 Unity로 전송
     */
    function checkAndSendSavedUserInfo() {
        if (!window.unityInstance) {
            console.error("Unity 인스턴스가 설정되지 않았습니다.");
            return;
        }

        // 현재 인증된 사용자 확인
        const user = firebase.auth().currentUser;
        if (user) {
            console.log("저장된 사용자 정보 발견: ", user.uid);
            // Unity에 사용자 정보 전송
            window.unityInstance.SendMessage('AuthManager', 'HandleLoginSuccess', user.uid);
            
            // 사용자 이메일을 UserSessionManager에 전달
            if (user.email) {
                window.unityInstance.SendMessage('UserSessionManager', 'SetUserEmail', user.email);
            }
        } else {
            console.log("저장된 사용자 정보 없음");
        }
    }

    // 공개 API
    return {
        initialize: initialize,
        getConfig: function () {
            return {...firebaseConfig}; // 설정 정보의 복사본 반환
        },
        checkAndSendSavedUserInfo: checkAndSendSavedUserInfo
    };
})();
