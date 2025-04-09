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
        if (window.pendingURLParameter && window.unityInstance) {
            const { name, value } = window.pendingURLParameter;
            
            if (name === "session") {
                window.unityInstance.SendMessage("URLHandler", "OnSessionCodeFound", value);
            }
            
            // 처리 완료 후 보류 데이터 제거
            window.pendingURLParameter = null;
        }
    };
})();
