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
                    // Unity 인스턴스에 안전하게 메시지 보내기
                    setTimeout(function() {
                        if (window.unityInstance) {
                            window.unityInstance.SendMessage('AuthManager', 'HandleLoginSuccess', user.uid);
                        } else {
                            console.log("Unity 인스턴스가 아직 준비되지 않았습니다. 로그인 정보를 임시 저장합니다.");
                            window.firebaseAuthUser = user; // 나중에 사용하기 위해 저장
                        }
                    }, 1000); // Unity 인스턴스 준비를 위한 지연
                } else {
                    // 사용자가 로그아웃한 경우
                    console.log("사용자 로그아웃 상태");
                    setTimeout(function() {
                        if (window.unityInstance) {
                            window.unityInstance.SendMessage('AuthManager', 'Logout');
                        }
                        window.firebaseAuthUser = null; // 저장된 유저 정보 지우기
                    }, 1000);
                }
            });
        } catch (error) {
            console.error("Firebase 초기화 오류:", error);
        }
    }
    
    // Unity 인스턴스가 있는지 확인하고 저장된 사용자 정보 전송
    function checkAndSendSavedUserInfo() {
        if (window.unityInstance && window.firebaseAuthUser) {
            console.log("저장된 사용자 정보를 Unity로 전송합니다.");
            window.unityInstance.SendMessage('AuthManager', 'HandleLoginSuccess', window.firebaseAuthUser.uid);
        }
    }
    
    // 5초마다 Unity 인스턴스 없이 저장된 사용자 정보가 있는지 확인
    setInterval(checkAndSendSavedUserInfo, 5000);
    
    // 공개 API
    return {
        initialize: initialize,
        getConfig: function() {
            return {...firebaseConfig}; // 설정 정보의 복사본 반환
        },
        checkAndSendSavedUserInfo: checkAndSendSavedUserInfo
    };
})();
