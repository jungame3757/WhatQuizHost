// Firebase 인증 관련 함수들
(function() {
    // 에러 코드 매핑
    const errorMessages = {
        'auth/email-already-in-use': '이미 사용 중인 이메일 주소입니다.',
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
        'auth/user-disabled': '계정이 비활성화되었습니다.',
        'auth/user-not-found': '사용자를 찾을 수 없습니다.',
        'auth/wrong-password': '잘못된 비밀번호입니다.',
        'auth/weak-password': '비밀번호가 너무 약합니다. 6자 이상이어야 합니다.',
        'auth/operation-not-allowed': '이 작업은 허용되지 않습니다.',
        'auth/too-many-requests': '너무 많은 요청이 발생했습니다. 나중에 다시 시도해주세요.'
    };

    // 이메일/비밀번호로 로그인
    window.firebaseSignInWithEmail = function(email, password) {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            if (window.unityInstance) {
                window.unityInstance.SendMessage("AuthManager", "OnAuthError", "Firebase가 초기화되지 않았습니다.");
            }
            return;
        }

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // 로그인 성공
                const user = userCredential.user;
                console.log("로그인 성공:", user.email);

                // Unity에 로그인 성공 알림 - JSON 객체로 변경
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0]
                };
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(userData));
                }
            })
            .catch((error) => {
                // 로그인 실패
                console.error("로그인 오류:", error.code, error.message);

                const errorMessage = errorMessages[error.code] || error.message;
                console.log("사용자에게 표시할 오류:", errorMessage);

                // Unity에 오류 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnAuthError", errorMessage);
                }
            });
    };

    // 로그아웃
    window.firebaseSignOut = function() {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            return;
        }

        firebase.auth().signOut()
            .then(() => {
                // 로그아웃 성공
                console.log("로그아웃 성공");
                window.currentUser = null;
            })
            .catch((error) => {
                // 로그아웃 실패
                console.error("로그아웃 오류:", error);
            });
    };

    // 현재 로그인한 사용자 확인
    window.firebaseGetCurrentUser = function() {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            return null;
        }

        const user = firebase.auth().currentUser;
        if (user) {
            return JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0]
            });
        }
        return null;
    };

    // 다음 함수들을 firebase-auth.js 파일에 추가
    window.checkAuthState = function() {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // 사용자가 로그인된 상태
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0]
                };

                // Unity에 사용자 정보 전달
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(userData));
                }
            }
        });
    };

    window.signOut = function() {
        firebase.auth().signOut()
            .then(function() {
                console.log("로그아웃 성공");
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnSignOutSuccess");
                }
            })
            .catch(function(error) {
                console.error("로그아웃 오류:", error);
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnAuthError", "로그아웃 중 오류가 발생했습니다.");
                }
            });
    };
    
    // 익명 로그인 함수
    window.firebaseSignInAnonymously = function() {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            if (window.unityInstance) {
                window.unityInstance.SendMessage("AuthManager", "OnAuthError", "Firebase가 초기화되지 않았습니다.");
            }
            return;
        }

        firebase.auth().signInAnonymously()
            .then((userCredential) => {
                // 익명 로그인 성공
                const user = userCredential.user;
                console.log("익명 로그인 성공:", user.uid);

                // Unity에 로그인 성공 알림 - JSON 객체로 변경
                const userData = {
                    uid: user.uid,
                    email: 'anonymous@user.com', // 익명 사용자에게는 기본 이메일 제공
                    displayName: '익명 사용자' // 익명 사용자의 기본 표시명
                };
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(userData));
                }
            })
            .catch((error) => {
                // 로그인 실패
                console.error("익명 로그인 오류:", error.code, error.message);

                const errorMessage = errorMessages[error.code] || error.message;
                console.log("사용자에게 표시할 오류:", errorMessage);

                // Unity에 오류 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnAuthError", errorMessage);
                }
            });
    };
})();
