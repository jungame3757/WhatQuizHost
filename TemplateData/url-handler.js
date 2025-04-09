// URL 파라미터 처리를 위한 함수들
(function() {
    // URL 파라미터 가져오기
    window.getURLParameter = function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        const paramValue = urlParams.get(name);
        
        if (paramValue) {
            console.log(`URL 파라미터 발견: ${name}=${paramValue}`);
            
            // Unity에 파라미터 전달
            if (window.unityInstance) {
                window.unityInstance.SendMessage("URLHandler", "OnSessionCodeFound", paramValue);
            return paramValue;
            } else {
                console.log("Unity 인스턴스가 준비되지 않았습니다. 나중에 다시 시도합니다.");
                
                // Unity 인스턴스가 준비될 때까지 대기
                window.pendingURLParameter = {
                    name: name,
                    value: paramValue
                };
            }
            
            return paramValue;
        } else {
            console.log(`URL 파라미터 없음: ${name}`);
            
            // Unity에 파라미터 없음 알림
            if (window.unityInstance) {
                window.unityInstance.SendMessage("URLHandler", "OnSessionCodeNotFound");
            }
            
            return null;
        }
    };
    
    // Unity 로드 완료 후 보류된 URL 파라미터 처리
    window.processPendingURLParameter = function() {
        try {
            console.log("보류된 URL 파라미터 처리 시도");
            
            // Unity 인스턴스 확인
            if (!window.unityInstance) {
                console.warn("Unity 인스턴스가 아직 준비되지 않았습니다.");
                return;
            }
            
            // 보류된 파라미터 처리
            if (window.pendingURLParameter) {
                const { name, value } = window.pendingURLParameter;
                console.log(`보류된 URL 파라미터 처리: ${name}=${value}`);
                
                if (name === "session") {
                    try {
                        window.unityInstance.SendMessage("URLHandler", "OnSessionCodeFound", value);
                        console.log(`세션 코드를 Unity로 전송했습니다: ${value}`);
                    } catch (sendError) {
                        console.error(`URL 파라미터 전송 중 오류: ${sendError.message}`);
                    }
                }
                
                // 처리 완료 후 보류 데이터 제거
                window.pendingURLParameter = null;
            } else {
                // URL에서 직접 파라미터 확인
                const urlParams = new URLSearchParams(window.location.search);
                const sessionCode = urlParams.get('session');
                
                if (sessionCode) {
                    console.log(`URL에서 발견된 세션 코드: ${sessionCode}`);
                    try {
                        window.unityInstance.SendMessage("URLHandler", "OnSessionCodeFound", sessionCode);
                        console.log(`세션 코드를 Unity로 전송했습니다: ${sessionCode}`);
                    } catch (sendError) {
                        console.error(`URL 파라미터 전송 중 오류: ${sendError.message}`);
                    }
                }
            }
        } catch (error) {
            console.error(`URL 파라미터 처리 중 예외 발생: ${error.message}`);
        }
    };
})();
