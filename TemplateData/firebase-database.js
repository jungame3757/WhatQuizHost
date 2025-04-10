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

// 플레이어 추가 트랜잭션
window.firebaseAddPlayerTransaction = function(path, playerId, playerData) {
    if (!window.firebaseInitialized) {
        console.error("Firebase가 초기화되지 않았습니다.");
        return false;
    }

    try {
        const dbRef = firebase.database().ref(path);
        const playerObj = JSON.parse(playerData);
        
        dbRef.child('players').transaction(currentPlayers => {
            // 현재 플레이어 배열이 없으면 초기화
            if (currentPlayers === null) {
                return [playerObj];
            }
            
            // 이미 플레이어가 존재하는지 확인
            const existingPlayerIndex = currentPlayers.findIndex(p => p.id === playerId);
            
            if (existingPlayerIndex >= 0) {
                // 이미 존재하면 업데이트하지 않음
                return currentPlayers;
            } else {
                // 존재하지 않으면 추가
                return [...currentPlayers, playerObj];
            }
        }).then(result => {
            if (result.committed) {
                console.log(`플레이어 추가 성공: ${playerId}`);
                
                // Unity에 데이터 저장 완료 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDataSaved", path);
                    
                    // 전체 세션 데이터를 불러와서 OnDataChanged 이벤트도 발생시킴
                    firebase.database().ref(path).once('value').then(snapshot => {
                        const sessionData = snapshot.val();
                        if (sessionData) {
                            console.log("플레이어 추가 후 세션 데이터 변경 감지:", path);
                            window.unityInstance.SendMessage("DatabaseManager", "OnDataChanged", JSON.stringify(sessionData));
                        }
                    }).catch(error => {
                        console.error("세션 데이터 로드 오류:", error);
                    });
                }
            } else {
                console.log(`플레이어 추가 취소됨: ${playerId}`);
                
                // Unity에 오류 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", "플레이어 추가 작업이 취소되었습니다.");
                }
            }
        }).catch(error => {
            console.error(`플레이어 추가 트랜잭션 오류: ${error}`);
            
            // Unity에 오류 알림
            if (window.unityInstance) {
                window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
            }
        });
        
        return true;
    } catch (e) {
        console.error("플레이어 추가 중 오류 발생:", e);
        
        // Unity에 오류 알림
        if (window.unityInstance) {
            window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", e.message);
        }
        return false;
    }
};

// 플레이어 제거 트랜잭션
window.firebaseRemovePlayerTransaction = function(path, playerId) {
    if (!window.firebaseInitialized) {
        console.error("Firebase가 초기화되지 않았습니다.");
        return false;
    }

    try {
        const dbRef = firebase.database().ref(path);
        
        dbRef.child('players').transaction(currentPlayers => {
            // 현재 플레이어 배열이 없으면 작업 취소
            if (currentPlayers === null) {
                return; // undefined 반환하면 트랜잭션 취소
            }
            
            // 플레이어 찾아서 제거
            const playerIndex = currentPlayers.findIndex(p => p.id === playerId);
            
            if (playerIndex >= 0) {
                // 플레이어가 있으면 제거
                const updatedPlayers = [...currentPlayers];
                updatedPlayers.splice(playerIndex, 1);
                return updatedPlayers;
            } else {
                // 플레이어가 없으면 변경 없음
                return currentPlayers;
            }
        }).then(result => {
            if (result.committed) {
                console.log(`플레이어 제거 성공: ${playerId}`);
                
                // Unity에 데이터 저장 완료 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDataSaved", path);
                    
                    // 전체 세션 데이터를 불러와서 OnDataChanged 이벤트도 발생시킴
                    firebase.database().ref(path).once('value').then(snapshot => {
                        const sessionData = snapshot.val();
                        if (sessionData) {
                            console.log("플레이어 제거 후 세션 데이터 변경 감지:", path);
                            window.unityInstance.SendMessage("DatabaseManager", "OnDataChanged", JSON.stringify(sessionData));
                        }
                    }).catch(error => {
                        console.error("세션 데이터 로드 오류:", error);
                    });
                }
            } else {
                console.log(`플레이어 제거 취소됨: ${playerId}`);
                
                // Unity에 오류 알림
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", "플레이어 제거 작업이 취소되었습니다.");
                }
            }
        }).catch(error => {
            console.error(`플레이어 제거 트랜잭션 오류: ${error}`);
            
            // Unity에 오류 알림
            if (window.unityInstance) {
                window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
            }
        });
        
        return true;
    } catch (e) {
        console.error("플레이어 제거 중 오류 발생:", e);
        
        // Unity에 오류 알림
        if (window.unityInstance) {
            window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", e.message);
        }
        return false;
    }
};
