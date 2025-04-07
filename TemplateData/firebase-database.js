// Firebase 데이터베이스 관련 함수들
(function() {
    // 데이터 저장
    window.firebaseSaveData = function(path, data) {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            return false;
        }

        try {
            // JSON 문자열을 객체로 변환
            const jsonData = JSON.parse(data);

            // 데이터베이스 참조 생성 및 데이터 저장
            firebase.database().ref(path).set(jsonData)
                .then(() => {
                    console.log("데이터 저장 성공:", path);

                    // Unity에 성공 알림
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("DatabaseManager", "OnDataSaved", path);
                    }
                })
                .catch((error) => {
                    console.error("데이터 저장 오류:", error);

                    // Unity에 오류 알림
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
                    }
                });

            return true;
        } catch (e) {
            console.error("데이터 저장 중 오류 발생:", e);
            return false;
        }
    };

    // 데이터 가져오기
    window.firebaseLoadData = function(path) {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            return false;
        }

        try {
            firebase.database().ref(path).once('value')
                .then((snapshot) => {
                    const data = snapshot.val();
                    const jsonData = data ? JSON.stringify(data) : "null";

                    console.log("데이터 로드 성공:", path);

                    // Unity에 데이터 전송
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("DatabaseManager", "OnDataLoaded", jsonData);
                    }
                })
                .catch((error) => {
                    console.error("데이터 로드 오류:", error);

                    // Unity에 오류 알림
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
                    }
                });

            return true;
        } catch (e) {
            console.error("데이터 로드 중 오류 발생:", e);
            return false;
        }
    };

    // 데이터 삭제
    window.firebaseRemoveData = function(path) {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            return false;
        }

        try {
            firebase.database().ref(path).remove()
                .then(() => {
                    console.log("데이터 삭제 성공:", path);

                    // Unity에 성공 알림
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("DatabaseManager", "OnDataRemoved", path);
                    }
                })
                .catch((error) => {
                    console.error("데이터 삭제 오류:", error);

                    // Unity에 오류 알림
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
                    }
                });

            return true;
        } catch (e) {
            console.error("데이터 삭제 중 오류 발생:", e);
            return false;
        }
    };

    // 데이터 변경 이벤트 리스너 설정
    window.firebaseSetupDataListener = function(path) {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            return false;
        }

        try {
            // 기존 리스너 제거
            window.firebaseRemoveDataListener(path);

            // 새 리스너 등록
            firebase.database().ref(path).on('value', (snapshot) => {
                const data = snapshot.val();
                const jsonData = data ? JSON.stringify(data) : "null";

                console.log("데이터 변경 감지:", path);

                // Unity에 데이터 전송
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDataChanged", jsonData);
                }
            }, (error) => {
                console.error("데이터 리스너 오류:", error);

                // Unity에 오류 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
                }
            });

            return true;
        } catch (e) {
            console.error("데이터 리스너 설정 중 오류 발생:", e);
            return false;
        }
    };

    // 데이터 변경 이벤트 리스너 제거
    window.firebaseRemoveDataListener = function(path) {
        if (!window.firebaseInitialized) {
            console.error("Firebase가 초기화되지 않았습니다.");
            return false;
        }

        try {
            firebase.database().ref(path).off();
            console.log("데이터 리스너 제거 성공:", path);
            return true;
        } catch (e) {
            console.error("데이터 리스너 제거 중 오류 발생:", e);
            return false;
        }
    };
})();
