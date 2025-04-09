// Firebase 데이터베이스 관련 함수들

// 트랜잭션을 활용한 중복 확인 및 데이터 저장
window.firebaseCheckAndSaveData = function(path, data) {
    if (!window.firebaseInitialized) {
        console.error("Firebase가 초기화되지 않았습니다.");
        return false;
    }

    try {
        // JSON 문자열을 객체로 변환
        const jsonData = JSON.parse(data);
        const dbRef = firebase.database().ref(path);
        
        // 트랜잭션만 사용하여 중복 확인 및 데이터 저장 (중복 검사 제거)
        dbRef.transaction(currentData => {
            // 이미 데이터가 존재하는 경우
            if (currentData !== null) {
                console.log(`트랜잭션 중 세션 ID 충돌 발생: ${path}`);
                return; // 변경하지 않고 취소 (null을 리턴하지 않음)
            }
            
            // 데이터가 없는 경우, 새 데이터 생성
            return jsonData;
        })
        .then(result => {
            if (result.committed) {
                // 성공적으로 데이터 저장함
                console.log(`트랜잭션 성공: ${path}`);
                
                // Unity에 트랜잭션 성공 및 데이터 저장 완료 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnTransactionCompleted", path + ",true");
                    window.unityInstance.SendMessage("DatabaseManager", "OnDataSaved", path);
                }
            } else {
                // 이미 데이터가 존재하여 취소됨
                console.log(`트랜잭션 취소 (이미 존재하는 ID): ${path}`);
                
                // Unity에 트랜잭션 실패 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnTransactionCompleted", path + ",false");
                    window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", "이미 존재하는 세션 ID입니다.");
                }
            }
        }).catch(error => {
            console.error(`트랜잭션 오류: ${error}`);
            
            // Unity에 오류 알림
            if (window.unityInstance) {
                window.unityInstance.SendMessage("DatabaseManager", "OnTransactionCompleted", path + ",false");
                window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
            }
        });

        return true;
    } catch (e) {
        console.error("트랜잭션 중 오류 발생:", e);
        return false;
    }
};

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

// 트랜잭션을 사용하여 players 배열만 업데이트
window.UpdatePlayers = function(sessionId, playersJson) {
    if (!window.firebaseInitialized) {
        console.error("Firebase가 초기화되지 않았습니다.");
        return false;
    }

    try {
        const path = `sessions/${sessionId}`;
        const dbRef = firebase.database().ref(path);
        const playersData = JSON.parse(playersJson);

        // 트랜잭션 사용: 다른 데이터는 변경하지 않고 players 배열만 업데이트
        dbRef.transaction(currentData => {
            // 데이터가 존재하지 않는 경우 취소
            if (currentData === null) {
                console.log(`세션이 존재하지 않습니다: ${path}`);
                return; // 트랜잭션 취소
            }
            
            // 기존 데이터 복사
            const updatedData = { ...currentData };
            
            // players 배열만 업데이트
            updatedData.players = playersData.players;
            
            return updatedData;
        })
        .then(result => {
            if (result.committed) {
                console.log(`플레이어 데이터 업데이트 성공: ${path}`);
                
                // Unity에 성공 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDataSaved", path);
                }
            } else {
                console.log(`플레이어 데이터 업데이트 취소: ${path}`);
                
                // Unity에 오류 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", "세션 업데이트 취소");
                }
            }
        }).catch(error => {
            console.error(`플레이어 데이터 업데이트 오류: ${error}`);
            
            // Unity에 오류 알림
            if (window.unityInstance) {
                window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
            }
        });

        return true;
    } catch (e) {
        console.error("플레이어 데이터 업데이트 중 오류 발생:", e);
        return false;
    }
};
