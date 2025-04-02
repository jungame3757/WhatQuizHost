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
        if (isInitialized) {
            console.log("Firebase가 이미 초기화되어 있습니다.");
            return;
        }
        
        try {
            // Firebase 초기화
            firebase.initializeApp(firebaseConfig);
            isInitialized = true;
            console.log("Firebase 초기화 완료");
            
            // 인증 상태 옵저버 설정
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    // 사용자가 로그인한 경우
                    console.log("사용자 로그인 상태: ", user.uid);
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage('AuthManager', 'HandleLoginSuccess', user.uid);
                    }
                } else {
                    // 사용자가 로그아웃한 경우
                    console.log("사용자 로그아웃 상태");
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage('AuthManager', 'Logout');
                    }
                }
            });
        } catch (error) {
            console.error("Firebase 초기화 오류:", error);
        }
    }
    
    // 공개 API
    return {
        initialize: initialize,
        getConfig: function() {
            return {...firebaseConfig}; // 설정 정보의 복사본 반환
        }
    };
})();
