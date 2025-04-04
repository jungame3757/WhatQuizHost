// Unity와 웹 브라우저 간의 통신을 관리하는 브릿지
(function() {
    // Unity 로더 설정
    var buildUrl = "Build";
    var loaderUrl = buildUrl + "/{WEBGL_LOADER_FILE_NAME}";
    var config = {
        dataUrl: buildUrl + "/{WEBGL_DATA_FILE_NAME}",
        frameworkUrl: buildUrl + "/{WEBGL_FRAMEWORK_FILE_NAME}",
        codeUrl: buildUrl + "/{WEBGL_CODE_FILE_NAME}",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "WhatQuiz",
        productName: "WhatQuizBase",
        productVersion: "1.0.0",
    };

    // Unity 인스턴스 생성 시 처리할 콜백
    function onUnityInstanceCreated(instance) {
        // 전역 변수에 Unity 인스턴스 저장
        window.setUnityInstance(instance);

        // 로딩 UI 숨기기
        hideLoadingUI();
    }

    // 로딩 진행 상황 업데이트
    function onProgress(progress) {
        const progressBarFill = document.querySelector("#unity-progress-bar-fill");
        if (progressBarFill) {
            progressBarFill.style.width = 100 * progress + "%";
        }

        const progressText = document.querySelector("#unity-progress-text");
        if (progressText) {
            progressText.innerText = Math.round(100 * progress) + "%";
        }
    }

    // 로딩 UI 숨기기
    function hideLoadingUI() {
        const loadingBar = document.querySelector("#unity-loading-bar");
        if (loadingBar) {
            loadingBar.style.display = "none";
        }
    }

    // Unity 앱 로드 함수
    window.loadUnityApp = function() {
        if (typeof createUnityInstance === "undefined") {
            console.error("Unity Web Player를 로드할 수 없습니다. Unity Loader 스크립트가 포함되어 있는지 확인하세요.");
            return;
        }

        // 캔버스 요소 가져오기
        var canvas = document.querySelector("#unity-canvas");
        if (!canvas) {
            console.error("Unity 캔버스 요소를 찾을 수 없습니다.");
            return;
        }

        // 로딩 UI 표시
        const loadingBar = document.querySelector("#unity-loading-bar");
        if (loadingBar) {
            loadingBar.style.display = "block";
        }

        // Unity 인스턴스 생성
        createUnityInstance(canvas, config, onProgress)
            .then(onUnityInstanceCreated)
            .catch((error) => {
                console.error("Unity 인스턴스 생성 중 오류 발생:", error);
                alert("Unity 웹 앱을 로드하는 중 오류가 발생했습니다: " + error.message);
            });
    };

    // 페이지 로드 완료 시 Unity 앱 로드
    window.addEventListener('DOMContentLoaded', function() {
        // Firebase 초기화 확인 후 앱 로드
        var firebaseCheck = setInterval(function() {
            if (window.firebaseInitialized || typeof firebase === 'undefined') {
                clearInterval(firebaseCheck);
                window.loadUnityApp();
            }
        }, 100);

        // 최대 10초 후에는 강제로 앱 로드
        setTimeout(function() {
            clearInterval(firebaseCheck);
            if (!window.unityInstance) {
                console.warn("Firebase 초기화 대기 시간 초과, Unity 앱을 강제로 로드합니다.");
                window.loadUnityApp();
            }
        }, 10000);
    });
})();
