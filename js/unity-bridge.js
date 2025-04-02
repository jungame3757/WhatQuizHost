/**
 * Unity와 JavaScript 간의 통신을 관리하는 모듈
 */
const UnityBridgeModule = (function() {
    let unityInstance = null;
    
    // UTF8ToString 대체 함수 (Unity 인스턴스 없이도 동작하도록 구현)
    function safeUTF8ToString(ptr) {
        if (window.UTF8ToString) {
            return window.UTF8ToString(ptr);
        } else if (unityInstance && unityInstance.Module) {
            return unityInstance.Module.UTF8ToString(ptr);
        } else {
            console.warn("UTF8ToString을 사용할 수 없습니다 - Unity 인스턴스가 아직 준비되지 않았습니다.");
            return "";
        }
    }
    
    /**
     * Unity 인스턴스 설정
     * @param {Object} instance - Unity 인스턴스
     */
    function setUnityInstance(instance) {
        unityInstance = instance;
        window.unityInstance = instance; // 전역 접근을 위해 필요
        console.log("Unity 인스턴스가 설정되었습니다.");
        
        // Unity 인스턴스가 설정되면 Firebase 초기화
        if (typeof FirebaseModule !== 'undefined') {
            FirebaseModule.initialize();
        } else {
            console.error("FirebaseModule이 로드되지 않았습니다.");
        }
    }
    
    /**
     * Unity로 메시지 전송
     * @param {string} gameObject - 메시지를 받을 Unity 게임 오브젝트 이름
     * @param {string} method - 호출할 메서드 이름
     * @param {string} parameter - 전달할 매개변수
     */
    function sendMessage(gameObject, method, parameter) {
        if (!unityInstance) {
            console.error("Unity 인스턴스가 설정되지 않았습니다.");
            return;
        }
        
        try {
            unityInstance.SendMessage(gameObject, method, parameter);
        } catch (error) {
            console.error("Unity에 메시지 전송 중 오류 발생:", error);
        }
    }
    
    /**
     * 디버그 로그 출력
     * @param {string} message - 출력할 메시지
     * @param {string} level - 로그 레벨 (log, warn, error)
     */
    function log(message, level = 'log') {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ${message}`;
        
        switch (level) {
            case 'warn':
                console.warn(formattedMessage);
                break;
            case 'error':
                console.error(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
        
        // Unity에도 로그 전송 (선택적)
        if (unityInstance) {
            sendMessage('Logger', 'LogMessage', `${level}:${formattedMessage}`);
        }
    }
    
    // 공개 API
    return {
        setUnityInstance: setUnityInstance,
        sendMessage: sendMessage,
        log: log,
        safeUTF8ToString: safeUTF8ToString
    };
    
})();

// 전역에 UTF8ToString 함수를 노출 - 즉시 호출되도록 변경
if (!window.UTF8ToString) {
    window.UTF8ToString = function(ptr) {
        if (window.unityInstance && window.unityInstance.Module) {
            return window.unityInstance.Module.UTF8ToString(ptr);
        } else {
            console.warn("UTF8ToString을 사용할 수 없습니다 - Unity 인스턴스가 아직 준비되지 않았습니다.");
            // 임시 방안: ptr가 문자열이면 그대로 반환, 아니면 빈 문자열
            return typeof ptr === 'string' ? ptr : "";
        }
    };
}
