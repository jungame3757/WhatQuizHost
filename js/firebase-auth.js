/*
** Firebase 인증 관련 기능을 관리하는 모듈
*/

// UTF8ToString 함수 정의
// 또는 Module 전역 객체 활용
function UTF8ToString(ptr) {
    if (ptr === 0) return '';

    if (typeof Module === 'undefined' || !Module.HEAPU8) {
        console.error('Unity Module이 초기화되지 않았습니다');
        // 대기 큐에 작업 추가하는 로직 추가
        if (typeof FirebaseModule !== 'undefined' && FirebaseModule.addPendingOperation) {
            console.log("작업을 대기 큐에 추가합니다");
        }
        return '';
    }

    try {
        let str = '';
        let idx = ptr;
        while (Module.HEAPU8[idx] !== 0) {
            str += String.fromCharCode(Module.HEAPU8[idx++]);
        }
        console.log("변환된 문자열:", str); // 디버깅 로그 추가
        return str;
    } catch (e) {
        console.error("문자열 변환 중 오류 발생:", e);
        return '';
    }
}

const FirebaseAuthModule = (function() {
    /**
     * 로그인 함수
     * @param {string} email - 로그인할 이메일 주소
     * @param {string} password - 로그인 비밀번호
     */
    function login(email, password) {
        console.log("[FirebaseAuthModule.login] 시작");
        const emailStr = UTF8ToString(email);
        const passwordStr = UTF8ToString(password);

        console.log("[FirebaseAuthModule.login] Firebase 로그인 시도 - " + emailStr);

        firebase.auth().signInWithEmailAndPassword(emailStr, passwordStr)
            .then((userCredential) => {
                // 로그인 성공
                const user = userCredential.user;
                console.log("[FirebaseAuthModule.login] 성공: " + user.uid);
                // Unity에 추가 정보도 전달
                window.unityInstance.SendMessage('AuthManager', 'HandleLoginSuccess', user.uid);

                // 사용자 이메일을 UserSessionManager에 전달
                if (user.email) {
                    console.log("[FirebaseAuthModule.login] 사용자 이메일 전달: " + user.email);
                    window.unityInstance.SendMessage('UserSessionManager', 'SetUserEmail', user.email);
                }
                console.log("[FirebaseAuthModule.login] 완료");
            })
            .catch((error) => {
                // 로그인 실패
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("[FirebaseAuthModule.login] 실패: " + errorMessage + " (" + errorCode + ")");
                window.unityInstance.SendMessage('AuthManager', 'HandleLoginFailed', errorMessage);
                console.log("[FirebaseAuthModule.login] 오류 처리 완료");
            });
    }

    /**
     * 회원가입 함수
     * @param {string} email - 가입할 이메일 주소
     * @param {string} password - 설정할 비밀번호
     */
    function register(email, password) {
        console.log("[FirebaseAuthModule.register] 시작");
        const emailStr = UTF8ToString(email);
        const passwordStr = UTF8ToString(password);

        console.log("[FirebaseAuthModule.register] Firebase 회원가입 시도 - " + emailStr);

        firebase.auth().createUserWithEmailAndPassword(emailStr, passwordStr)
            .then((userCredential) => {
                // 회원가입 성공
                const user = userCredential.user;
                console.log("[FirebaseAuthModule.register] 회원가입 성공: " + user.uid);
                window.unityInstance.SendMessage('AuthManager', 'HandleRegisterSuccess', user.uid);
                console.log("[FirebaseAuthModule.register] 회원가입 처리 완료");
            })
            .catch((error) => {
                // 회원가입 실패
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("[FirebaseAuthModule.register]" + emailStr + "회원가입 실패: " + errorMessage + " (" + errorCode + ")");
                window.unityInstance.SendMessage('AuthManager', 'HandleRegisterFailed', errorMessage);
                console.log("[FirebaseAuthModule.register] 오류 처리 완료");
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
        const emailStr = UTF8ToString(email);

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
    console.log("[Global.FirebaseLogin] Firebase 로그인 호출 - 추가 로깅");
    FirebaseAuthModule.login(email, password);
}

function FirebaseRegister(email, password) {
    console.log("[Global.FirebaseRegister] Firebase 회원가입 호출 - 추가 로깅");
    FirebaseAuthModule.register(email, password);
}

function FirebaseLogout() {
    console.log("[Global.FirebaseLogout] Firebase 로그아웃 호출 - 추가 로깅");
    FirebaseAuthModule.logout();
}

function FirebaseResetPassword(email) {
    console.log("[Global.FirebaseResetPassword] Firebase 비밀번호 재설정 호출 - 추가 로깅");
    FirebaseAuthModule.resetPassword(email);
}

function FirebaseIsAuthenticated() {
    console.log("[Global.FirebaseIsAuthenticated] Firebase 인증 상태 확인 호출 - 추가 로깅");
    return FirebaseAuthModule.isAuthenticated();
}
