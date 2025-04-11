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

    // 인증 상태 변경 이벤트 등록 여부 확인
    let authStateListenerRegistered = false;
    
    // 마지막으로 처리된 사용자 ID 추적
    let lastProcessedUserId = null;

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
                // onAuthStateChanged 이벤트가 Unity에 로그인 상태 변경을 알릴 것임
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

        // 로그아웃 전에 상태 초기화
        lastProcessedUserId = null;
        
        firebase.auth().signOut()
            .then(() => {
                // 로그아웃 성공
                console.log("로그아웃 성공");
                window.currentUser = null;
                window.isAuthStateChangeProcessed = false;
                
                // Unity에 로그아웃 성공 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnLogoutSuccess");
                }
            })
            .catch((error) => {
                // 로그아웃 실패
                console.error("로그아웃 오류:", error);
                
                // Unity에 오류 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnAuthError", "로그아웃 중 오류가 발생했습니다.");
                }
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
                email: user.email || 'anonymous@user.com',
                displayName: user.displayName || (user.email ? user.email.split('@')[0] : '익명 사용자'),
                isAnonymous: user.isAnonymous
            });
        }
        return null;
    };

    // 인증 상태 확인 및 리스너 등록
    window.checkAuthState = function() {
        if (!window.firebaseInitialized) {
            console.error("Firebase 초기화가 완료되지 않았습니다.");
            return;
        }

        // 이미 리스너가 등록되어 있으면 중복 등록 방지
        if (authStateListenerRegistered) {
            console.log("인증 상태 리스너가 이미 등록되어 있습니다.");
            
            // 현재 사용자 확인 및 Unity에 전달
            const currentUser = firebase.auth().currentUser;
            if (currentUser && window.unityInstance) {
                // 이미 처리된 사용자인지 확인
                if (lastProcessedUserId === currentUser.uid) {
                    console.log("이미 처리된 사용자 정보입니다. 중복 전송 방지:", currentUser.uid);
                    return;
                }
                
                const userData = {
                    uid: currentUser.uid,
                    email: currentUser.email || 'anonymous@user.com',
                    displayName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : '익명 사용자'),
                    isAnonymous: currentUser.isAnonymous
                };
                
                console.log("현재 사용자 정보 전송:", userData.displayName);
                window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(userData));
                
                // 처리된 사용자 ID 저장
                lastProcessedUserId = currentUser.uid;
            }
            return;
        }
        
        // 인증 상태 변경 리스너 등록
        authStateListenerRegistered = true;
        console.log("Firebase 인증 상태 리스너 등록");
        
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // 이미 처리된 사용자인지 확인
                if (lastProcessedUserId === user.uid) {
                    console.log("이미 처리된 사용자 정보입니다. 중복 전송 방지:", user.uid);
                    return;
                }
                
                // 사용자가 로그인된 상태
                const userData = {
                    uid: user.uid,
                    email: user.email || 'anonymous@user.com',
                    displayName: user.displayName || (user.email ? user.email.split('@')[0] : '익명 사용자'),
                    isAnonymous: user.isAnonymous
                };

                console.log("인증 상태 변경 감지 - 로그인:", userData.displayName);
                
                // 전역 사용자 정보 업데이트
                window.currentUser = userData;
                
                // Unity에 사용자 정보 전달
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnLoginSuccess", JSON.stringify(userData));
                }
                
                // 처리된 사용자 ID 저장
                lastProcessedUserId = user.uid;
            } else {
                // 사용자가 로그아웃된 상태
                console.log("인증 상태 변경 감지 - 로그아웃");
                
                // 전역 사용자 정보 초기화
                window.currentUser = null;
                lastProcessedUserId = null;
                
                // Unity에 로그아웃 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("AuthManager", "OnLogoutSuccess");
                }
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
                // onAuthStateChanged 이벤트가 Unity에 로그인 상태 변경을 알릴 것임
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
