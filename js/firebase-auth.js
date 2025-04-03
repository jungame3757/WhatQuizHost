/**
 * Firebase 인증 관련 기능을 관리하는 모듈
 */
const FirebaseAuthModule = (function() {
    /**
     * 로그인 함수
     * @param {string} email - 로그인할 이메일 주소
     * @param {string} password - 로그인 비밀번호
     */
    function login(email, password) {
        // UTF8ToString 함수 안전한 참조
        const emailStr = typeof UnityBridgeModule !== 'undefined' ? email: 
            (window.UTF8ToString ? window.UTF8ToString(email) : "");
        const passwordStr = typeof UnityBridgeModule !== 'undefined' ? password : 
            (window.UTF8ToString ? window.UTF8ToString(password) : "");
        
        console.log("JavaScript: Firebase 로그인 시도 - " + emailStr);
        
        firebase.auth().signInWithEmailAndPassword(emailStr, passwordStr)
            .then((userCredential) => {
                // 로그인 성공
                const user = userCredential.user;
                console.log("로그인 성공: " + user.uid);
                // Unity에 추가 정보도 전달
                window.unityInstance.SendMessage('AuthManager', 'HandleLoginSuccess', user.uid);
                
                // 사용자 이메일을 UserSessionManager에 전달
                if (user.email) {
                    window.unityInstance.SendMessage('UserSessionManager', 'SetUserEmail', user.email);
                }
            })
            .catch((error) => {
                // 로그인 실패
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("로그인 실패: " + errorMessage);
                window.unityInstance.SendMessage('AuthManager', 'HandleLoginFailed', errorMessage);
            });
    }
    
    /**
     * 회원가입 함수
     * @param {string} email - 가입할 이메일 주소
     * @param {string} password - 설정할 비밀번호
     */
    function register(email, password) {
        // UTF8ToString 함수 안전한 참조
        const emailStr = typeof UnityBridgeModule !== 'undefined' ? email : 
            (window.UTF8ToString ? window.UTF8ToString(email) : "");
        const passwordStr = typeof UnityBridgeModule !== 'undefined' ? password : 
            (window.UTF8ToString ? window.UTF8ToString(password) : "");
        
        console.log("JavaScript: Firebase 회원가입 시도 - " + emailStr);
        
        firebase.auth().createUserWithEmailAndPassword(emailStr, passwordStr)
            .then((userCredential) => {
                // 회원가입 성공
                const user = userCredential.user;
                console.log("회원가입 성공: " + user.uid);
                window.unityInstance.SendMessage('AuthManager', 'HandleRegisterSuccess', user.uid);
            })
            .catch((error) => {
                // 회원가입 실패
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("회원가입 실패: " + errorMessage);
                window.unityInstance.SendMessage('AuthManager', 'HandleRegisterFailed', errorMessage);
            });
    }
    
    /**
     * 로그아웃 함수
     */
    function logout() {
        console.log("JavaScript: Firebase 로그아웃 시도");
        
        firebase.auth().signOut()
            .then(() => {
                // 로그아웃 성공
                console.log("로그아웃 성공");
            })
            .catch((error) => {
                // 로그아웃 실패
                console.error("로그아웃 실패: " + error.message);
            });
    }
    
    /**
     * 비밀번호 재설정 이메일 발송 함수
     * @param {string} email - 비밀번호를 재설정할 이메일 주소
     */
    function resetPassword(email) {
        // UTF8ToString 함수 안전한 참조
        const emailStr = typeof UnityBridgeModule !== 'undefined' ? email : 
            (window.UTF8ToString ? window.UTF8ToString(email) : "");
        
        console.log("JavaScript: Firebase 비밀번호 재설정 시도 - " + emailStr);
        
        firebase.auth().sendPasswordResetEmail(emailStr)
            .then(() => {
                // 이메일 발송 성공
                console.log("비밀번호 재설정 이메일 발송 성공");
                window.unityInstance.SendMessage('AuthManager', 'HandleResetPasswordSuccess', '');
            })
            .catch((error) => {
                // 이메일 발송 실패
                console.error("비밀번호 재설정 이메일 발송 실패: " + error.message);
                window.unityInstance.SendMessage('AuthManager', 'HandleResetPasswordFailed', error.message);
            });
    }
    
    /**
     * 현재 인증 상태 확인 함수
     * @returns {number} 인증된 상태이면 1, 아니면 0
     */
    function isAuthenticated() {
        const user = firebase.auth().currentUser;
        return user != null ? 1 : 0;
    }

    /**
     * 현재 로그인된 사용자 정보 가져오기
     * @returns {Object} 사용자 정보 객체
     */
    function getCurrentUser() {
        return firebase.auth().currentUser;
    }
    
    // 공개 API
    return {
        login: login,
        register: register,
        logout: logout,
        resetPassword: resetPassword,
        isAuthenticated: isAuthenticated,
        getCurrentUser: getCurrentUser
    };
})();

// Unity에서 호출할 전역 함수들
function FirebaseLogin(email, password) {
    FirebaseAuthModule.login(email, password);
}

function FirebaseRegister(email, password) {
    FirebaseAuthModule.register(email, password);
}

function FirebaseLogout() {
    FirebaseAuthModule.logout();
}

function FirebaseResetPassword(email) {
    FirebaseAuthModule.resetPassword(email);
}

function FirebaseIsAuthenticated() {
    return FirebaseAuthModule.isAuthenticated();
}
