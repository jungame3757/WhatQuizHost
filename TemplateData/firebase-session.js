// 세션 관리 JavaScript 함수
(function() {
    // QR 코드 생성 함수
    window.generateQRCode = function(text, size) {
        const qrElement = document.getElementById('qr-code');
        if (!qrElement) {
            // QR 코드 표시를 위한 요소 생성
            const qrContainer = document.createElement('div');
            qrContainer.id = 'qr-code-container';
            qrContainer.style.display = 'none';
            qrContainer.style.position = 'absolute';
            qrContainer.style.zIndex = '999';
            qrContainer.innerHTML = '<div id="qr-code"></div>';
            document.body.appendChild(qrContainer);
        }

        if (typeof QRCode === 'undefined') {
            console.error('QRCode 라이브러리가 로드되지 않았습니다.');
            return;
        }

        // 기존 QR 코드 제거
        const container = document.getElementById('qr-code');
        container.innerHTML = '';

        // 새 QR 코드 생성
        new QRCode(container, {
            text: text,
            width: size,
            height: size,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Unity에 QR 코드 이미지 데이터 전달
        setTimeout(() => {
            try {
                const imgData = container.querySelector('img').src;
                if (window.unityInstance) {
                    window.unityInstance.SendMessage('GameSessionManager', 'SetQRCodeImage', imgData);
                }
            } catch (e) {
                console.error('QR 코드 이미지 데이터 전송 중 오류:', e);
            }
        }, 100);
    };

    // 클립보드에 복사 함수
    window.copyToClipboard = function(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            console.log('클립보드에 복사됨:', text);

            // Unity에 복사 성공 메시지 전달
            if (window.unityInstance) {
                window.unityInstance.SendMessage('GameSessionManager', 'OnClipboardCopyResult', 'success');
            }
        } catch (e) {
            console.error('클립보드 복사 중 오류:', e);
            if (window.unityInstance) {
                window.unityInstance.SendMessage('GameSessionManager', 'OnClipboardCopyResult', 'error: ' + e.message);
            }
        }
    };

    // URL 파라미터 확인 함수
    window.checkURLForSessionCode = function() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionCode = urlParams.get('session');

            if (sessionCode) {
                console.log('URL에서 세션 코드 발견:', sessionCode);

                // Unity에 세션 코드 전달
                if (window.unityInstance) {
                    window.unityInstance.SendMessage('GameSessionManager', 'JoinSessionFromURL', sessionCode);
                } else {
                    // Unity 인스턴스가 아직 로드되지 않은 경우, 세션 코드 저장
                    window.pendingSessionCode = sessionCode;
                }
            }
        } catch (e) {
            console.error('URL 파라미터 확인 중 오류:', e);
        }
    };

    // 세션 정보를 로컬 스토리지에 저장하는 함수
    window.saveSessionToLocalStorage = function(sessionData, isHost) {
        try {
            const sessionInfo = {
                sessionData: sessionData,
                isHost: isHost,
                timestamp: Date.now(),
                userId: null // Unity에서 업데이트
            };
            
            localStorage.setItem('currentSession', JSON.stringify(sessionInfo));
            console.log('세션 정보가 로컬 스토리지에 저장됨');
            return true;
        } catch (e) {
            console.error('세션 정보 저장 중 오류:', e);
            return false;
        }
    };

    // 로컬 스토리지에서 세션 정보 불러오기
    window.getSessionFromLocalStorage = function() {
        try {
            const sessionInfo = localStorage.getItem('currentSession');
            if (sessionInfo) {
                console.log('로컬 스토리지에서 세션 정보 로드됨');
                return sessionInfo;
            }
            return null;
        } catch (e) {
            console.error('세션 정보 불러오기 중 오류:', e);
            return null;
        }
    };

    // 로컬 스토리지에서 세션 정보 삭제
    window.clearLocalStorageSession = function() {
        try {
            localStorage.removeItem('currentSession');
            console.log('로컬 스토리지에서 세션 정보 삭제됨');
            return true;
        } catch (e) {
            console.error('세션 정보 삭제 중 오류:', e);
            return false;
        }
    };

    // 세션 복구 대화상자 생성 및 표시
    window.showSessionRecoveryDialog = function() {
        try {
            const sessionInfo = JSON.parse(localStorage.getItem('currentSession'));
            if (!sessionInfo) {
                return false;
            }

            // 세션이 30분 이상 지났는지 확인
            const sessionAge = Date.now() - sessionInfo.timestamp;
            const isSessionTooOld = sessionAge > 30 * 60 * 1000; // 30분
            
            if (isSessionTooOld) {
                // 세션이 너무 오래되었으면 자동으로 새 세션 시작
                localStorage.removeItem('currentSession');
                return false;
            }

            // 대화상자 생성
            const dialogOverlay = document.createElement('div');
            dialogOverlay.id = 'session-recovery-overlay';
            dialogOverlay.style.position = 'fixed';
            dialogOverlay.style.top = '0';
            dialogOverlay.style.left = '0';
            dialogOverlay.style.width = '100%';
            dialogOverlay.style.height = '100%';
            dialogOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            dialogOverlay.style.zIndex = '1000';
            dialogOverlay.style.display = 'flex';
            dialogOverlay.style.alignItems = 'center';
            dialogOverlay.style.justifyContent = 'center';

            const dialogBox = document.createElement('div');
            dialogBox.style.backgroundColor = 'white';
            dialogBox.style.padding = '20px';
            dialogBox.style.borderRadius = '8px';
            dialogBox.style.width = '80%';
            dialogBox.style.maxWidth = '400px';
            dialogBox.style.textAlign = 'center';
            dialogBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

            const title = document.createElement('h2');
            title.textContent = '이전 세션 발견';
            title.style.marginTop = '0';
            title.style.color = '#333';

            const message = document.createElement('p');
            message.textContent = '이전에 참여한 세션이 발견되었습니다. 어떻게 하시겠습니까?';
            message.style.marginBottom = '20px';
            message.style.color = '#555';

            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'space-between';

            const recoverButton = document.createElement('button');
            recoverButton.textContent = '기존 세션으로 복귀';
            recoverButton.style.flex = '1';
            recoverButton.style.marginRight = '10px';
            recoverButton.style.padding = '10px';
            recoverButton.style.backgroundColor = '#4CAF50';
            recoverButton.style.color = 'white';
            recoverButton.style.border = 'none';
            recoverButton.style.borderRadius = '4px';
            recoverButton.style.cursor = 'pointer';
            
            const newSessionButton = document.createElement('button');
            newSessionButton.textContent = '새 세션 시작';
            newSessionButton.style.flex = '1';
            newSessionButton.style.padding = '10px';
            newSessionButton.style.backgroundColor = '#f44336';
            newSessionButton.style.color = 'white';
            newSessionButton.style.border = 'none';
            newSessionButton.style.borderRadius = '4px';
            newSessionButton.style.cursor = 'pointer';

            // 이벤트 리스너 추가
            recoverButton.addEventListener('click', function() {
                document.body.removeChild(dialogOverlay);
                if (window.unityInstance) {
                    // sessionInfo 객체를 문자열로 변환하여 전달
                    window.unityInstance.SendMessage('GameSessionManager', 'OnSessionRecoveryDecision', 'recover');
                }
            });

            newSessionButton.addEventListener('click', function() {
                document.body.removeChild(dialogOverlay);
                localStorage.removeItem('currentSession');
                if (window.unityInstance) {
                    window.unityInstance.SendMessage('GameSessionManager', 'OnSessionRecoveryDecision', 'new');
                }
            });

            // 요소 조립
            buttonContainer.appendChild(recoverButton);
            buttonContainer.appendChild(newSessionButton);

            dialogBox.appendChild(title);
            dialogBox.appendChild(message);
            dialogBox.appendChild(buttonContainer);
            dialogOverlay.appendChild(dialogBox);

            document.body.appendChild(dialogOverlay);
            return true;
        } catch (e) {
            console.error('세션 복구 대화상자 표시 중 오류:', e);
            return false;
        }
    };

    // Unity 인스턴스 로드 완료 후 체크
    window.addEventListener('unityInstanceReady', function() {
        if (window.pendingSessionCode && window.unityInstance) {
            window.unityInstance.SendMessage('GameSessionManager', 'JoinSessionFromURL', window.pendingSessionCode);
            window.pendingSessionCode = null;
        }
        
        // 로컬 스토리지에 세션 정보가 있는지 확인하고 복구 대화상자 표시
        const sessionInfo = localStorage.getItem('currentSession');
        if (sessionInfo && window.unityInstance) {
            setTimeout(() => {
                window.unityInstance.SendMessage('GameSessionManager', 'CheckForSessionRecovery');
            }, 1000); // 유니티 초기화 후 약간의 지연 추가
        }
    });
})();
