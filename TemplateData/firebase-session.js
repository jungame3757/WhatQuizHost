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

    // Unity 인스턴스 로드 완료 후 체크
    window.addEventListener('unityInstanceReady', function() {
        if (window.pendingSessionCode && window.unityInstance) {
            window.unityInstance.SendMessage('GameSessionManager', 'JoinSessionFromURL', window.pendingSessionCode);
            window.pendingSessionCode = null;
        }
    });
})();
