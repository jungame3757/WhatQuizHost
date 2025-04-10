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
window.UpdatePlayers = function(sessionId, playersJsonOrId, playerName) {
    if (!window.firebaseInitialized) {
        console.error("Firebase가 초기화되지 않았습니다.");
        return false;
    }

    try {
        const path = `sessions/${sessionId}`;
        const sessionRef = firebase.database().ref(path);
        console.log(`UpdatePlayers 호출: ${path} (트랜잭션 대신 직접 업데이트 방식 사용)`);
        
        // 매개변수 형식 확인 (2가지 호출 방식 지원)
        let playerId, playerData;
        
        if (playerName) {
            // 단일 플레이어 추가/수정 방식 (sessionId, playerId, playerName)
            playerId = playersJsonOrId;
            playerData = null; // 아직 데이터 없음, 나중에 생성
        } else {
            // 전체 players 배열 업데이트 방식 (sessionId, playersJson)
            try {
                const playersData = JSON.parse(playersJsonOrId);
                if (playersData && playersData.players) {
                    console.log(`플레이어 데이터 업데이트 시도 (직접 방식): ${path}, 플레이어 수: ${playersData.players.length}`);
                    
                    // 세션 데이터를 먼저 가져와서 전체 구조 유지하며 플레이어만 업데이트
                    sessionRef.once('value')
                    .then(snapshot => {
                        if (!snapshot.exists()) {
                            console.error(`세션이 존재하지 않습니다: ${path}`);
                            if (window.unityInstance) {
                                window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", "세션이 존재하지 않습니다");
                            }
                            return;
                        }
                        
                        // 기존 세션 데이터 가져오기
                        const currentData = snapshot.val();
                        
                        // players 배열만 업데이트
                        currentData.players = playersData.players;
                        
                        // 데이터 저장 (update 대신 set 사용하여 일관성 보장)
                        return sessionRef.set(currentData);
                    })
                    .then(() => {
                        console.log(`플레이어 데이터 업데이트 성공: ${path}`);
                        
                        // 강제로 다시 한번 데이터 가져와서 Unity에 전달
                        return sessionRef.once('value');
                    })
                    .then(snapshot => {
                        if (snapshot.exists() && window.unityInstance) {
                            // 먼저 OnDataSaved 호출
                            window.unityInstance.SendMessage("DatabaseManager", "OnDataSaved", path);
                            
                            // 100ms 후 데이터 변경 이벤트 강제 발생 (타이밍 문제 해결)
                            setTimeout(() => {
                                const updatedData = snapshot.val();
                                window.unityInstance.SendMessage("DatabaseManager", "OnDataChanged", JSON.stringify(updatedData));
                                console.log("플레이어 업데이트 후 데이터 변경 이벤트 강제 발생 (지연 처리)");
                            }, 100);
                        }
                    })
                    .catch(error => {
                        console.error(`플레이어 데이터 업데이트 오류: ${error}`);
                        if (window.unityInstance) {
                            window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
                        }
                    });
                    
                    return true;
                }
            } catch (e) {
                console.error("플레이어 JSON 파싱 오류:", e);
                // 객체가 아닌 경우 단일 플레이어 추가 방식으로 간주
                playerId = playersJsonOrId;
                playerData = null;
            }
        }
        
        // 단일 플레이어 추가/수정 방식 처리
        if (playerId) {
            console.log(`단일 플레이어 추가/수정 시도: ${playerId} (직접 방식)`);
            
            // 세션 데이터 가져오기
            sessionRef.once('value')
            .then(snapshot => {
                if (!snapshot.exists()) {
                    console.error(`세션이 존재하지 않습니다: ${path}`);
                    if (window.unityInstance) {
                        window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", "세션이 존재하지 않습니다");
                    }
                    return;
                }
                
                // 기존 세션 데이터 가져오기
                const currentData = snapshot.val();
                
                // 기존 players 배열 가져오기
                let players = currentData.players || [];
                
                // 플레이어 찾기
                const playerIndex = players.findIndex(p => p.id === playerId);
                
                if (playerIndex >= 0) {
                    // 기존 플레이어 업데이트
                    console.log(`기존 플레이어 업데이트: ${playerId}`);
                    players[playerIndex].name = playerName;
                } else {
                    // 새 플레이어 추가
                    console.log(`새 플레이어 추가: ${playerId}`);
                    players.push({
                        id: playerId,
                        name: playerName || "게스트",
                        isReady: false
                    });
                }
                
                // 전체 세션 데이터에서 players 배열만 업데이트
                currentData.players = players;
                
                // 데이터 저장
                return sessionRef.set(currentData);
            })
            .then(() => {
                console.log(`플레이어 추가/수정 성공: ${playerId}`);
                
                // 강제로 다시 한번 데이터 가져와서 Unity에 전달
                return sessionRef.once('value');
            })
            .then(snapshot => {
                if (snapshot.exists() && window.unityInstance) {
                    // 먼저 OnDataSaved 호출
                    window.unityInstance.SendMessage("DatabaseManager", "OnDataSaved", path);
                    
                    // 100ms 후 데이터 변경 이벤트 강제 발생 (타이밍 문제 해결)
                    setTimeout(() => {
                        const updatedData = snapshot.val();
                        window.unityInstance.SendMessage("DatabaseManager", "OnDataChanged", JSON.stringify(updatedData));
                        console.log("플레이어 업데이트 후 데이터 변경 이벤트 강제 발생 (지연 처리)");
                    }, 100);
                }
            })
            .catch(error => {
                console.error(`플레이어 추가/수정 오류: ${error}`);
                if (window.unityInstance) {
                    window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", error.message);
                }
            });
        }

        return true;
    } catch (e) {
        console.error("플레이어 데이터 업데이트 중 오류 발생:", e);
        if (window.unityInstance) {
            window.unityInstance.SendMessage("DatabaseManager", "OnDatabaseError", e.message);
        }
        return false;
    }
};
