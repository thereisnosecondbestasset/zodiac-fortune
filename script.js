document.addEventListener("DOMContentLoaded", () => {
  // 오늘 날짜를 기반으로 고유 키 생성
  function getTodayKey() {
    const today = new Date();
    return `fortune_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
  }

  // 7일 지난 운세 데이터 삭제
  function cleanOldFortunes() {
    const today = new Date();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("fortune_")) {
        const [_, year, month, day] = key.split("_");
        const storedDate = new Date(parseInt(year), parseInt(month), parseInt(day));
        if ((today - storedDate) / (1000 * 60 * 60 * 24) > 7) {
          localStorage.removeItem(key);
        }
      }
    }
  }
  cleanOldFortunes(); // 페이지 로드 시 실행

  // 현재 날짜 표시
  const currentDateElement = document.getElementById("current-date");
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  currentDateElement.textContent = `${year}년 ${month}월 ${day}일`;

  // 띠별 이모지 매핑
  const zodiacEmojis = {
    "쥐띠": "🐀",
    "소띠": "🐮",
    "호랑이띠": "🐯",
    "토끼띠": "🐰",
    "용띠": "🐉",
    "뱀띠": "🐍",
    "말띠": "🐎",
    "양띠": "🐏",
    "원숭이띠": "🐒",
    "닭띠": "🐓",
    "개띠": "🐕",
    "돼지띠": "🐖"
  };

  // 방문자 수 카운터
  const todayVisitors = document.getElementById("todayVisitors");
  const totalVisitors = document.getElementById("totalVisitors");

  function updateVisitorCount() {
    const todayKey = `visitors_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
    let todayCount = parseInt(localStorage.getItem(todayKey) || "0");
    let totalCount = parseInt(localStorage.getItem("totalVisitors") || "0");

    if (!sessionStorage.getItem("visited")) {
      todayCount++;
      totalCount++;
      localStorage.setItem(todayKey, todayCount);
      localStorage.setItem("totalVisitors", totalCount);
      sessionStorage.setItem("visited", "true");
    }

    todayVisitors.textContent = todayCount;
    totalVisitors.textContent = totalCount;
  }
  updateVisitorCount();

  // 부드럽게 화면 위로 스크롤하는 함수
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // fortune-sentences.json 파일 로드
  fetch("fortune-sentences.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("fortune-sentences.json 로드 실패: " + response.statusText);
      }
      return response.json();
    })
    .then(fortuneSentences => {
      console.log("fortune-sentences.json 로드 성공:", fortuneSentences);

      // 문장을 랜덤으로 선택하는 함수 (중복 방지용)
      function getRandomUniqueFortunes(templates, count) {
        if (!templates || templates.length === 0) return ["운세를 준비 중이에요!"];
        const shuffled = [...templates].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, templates.length));
      }

      // fortunes.json 파일 로드
      fetch("fortunes.json")
        .then(response => {
          if (!response.ok) {
            throw new Error("fortunes.json 로드 실패: " + response.statusText);
          }
          return response.json();
        })
        .then(zodiacs => {
          console.log("fortunes.json 로드 성공:", zodiacs);

          // 버튼 동적 생성
          const buttonContainer = document.getElementById("zodiac-buttons");
          zodiacs.forEach(zodiac => {
            const item = document.createElement("div");
            item.className = "zodiac-item";

            const image = document.createElement("img");
            image.className = "zodiac-image";
            image.src = zodiac.image;
            image.alt = `${zodiac.name} 이미지`;
            image.onerror = () => {
              console.error(`이미지 로드 실패: ${zodiac.image}`);
              image.src = "https://cdn.glitch.global/a53c5bda-aadc-4998-8d4e-093532654a8e/rat.png?v=1741923522857";
            };
            image.addEventListener("click", () => {
              showFortune(zodiac);
              scrollToTop();
            });
            item.appendChild(image);

            const button = document.createElement("button");
            button.className = "zodiac-button";
            button.textContent = zodiac.name;
            button.addEventListener("click", () => {
              showFortune(zodiac);
              scrollToTop();
            });
            item.appendChild(button);

            buttonContainer.appendChild(item);
          });

          function showFortune(zodiac) {
            const resultImage = document.getElementById("zodiac-image");
            const resultName = document.getElementById("zodiac-name");
            const resultGeneralFortune = document.getElementById("zodiac-general-fortune");
            const yearlyList = document.getElementById("zodiac-yearly-fortune");

            const todayKey = getTodayKey();
            const fortuneKey = `${todayKey}_${zodiac.name}`;
            let storedFortune = JSON.parse(localStorage.getItem(fortuneKey));

            if (!storedFortune) {
              const generalFortune = getRandomUniqueFortunes(fortuneSentences.general.default, 1)[0];
              const zodiacFortunes = fortuneSentences.general[zodiac.name] || fortuneSentences.general.default;
              const yearCount = Object.keys(zodiac.yearlyFortunes).length;
              const uniqueFortunes = getRandomUniqueFortunes(zodiacFortunes, yearCount);

              storedFortune = {
                general: generalFortune,
                yearly: uniqueFortunes
              };
              localStorage.setItem(fortuneKey, JSON.stringify(storedFortune));
            }

            resultImage.src = zodiac.image;
            resultImage.alt = `${zodiac.name} 이미지`;
            resultImage.onerror = () => {
              console.error(`결과 이미지 로드 실패: ${zodiac.image}`);
              resultImage.src = "https://cdn.glitch.global/a53c5bda-aadc-4998-8d4e-093532654a8e/rat.png?v=1741923522857";
            };
            resultName.textContent = zodiac.name;
            resultGeneralFortune.textContent = storedFortune.general;
            yearlyList.innerHTML = "";

            let i = 0;
            for (const [year] of Object.entries(zodiac.yearlyFortunes)) {
              const fortune = storedFortune.yearly[i] || "추가 운세를 준비 중이에요!";
              const li = document.createElement("li");
              const emoji = zodiacEmojis[zodiac.name] || "";
              li.textContent = `${emoji}${year}년생: ${fortune}`;
              yearlyList.appendChild(li);
              i++;
            }
          }
        })
        .catch(error => {
          console.error("fortunes.json 로드 중 오류 발생:", error);
          const buttonContainer = document.getElementById("zodiac-buttons");
          buttonContainer.innerHTML = "<p>운세 데이터를 불러오지 못했습니다. 관리자에게 문의하세요.</p>";
        });
    })
    .catch(error => {
      console.error("fortune-sentences.json 로드 중 오류 발생:", error);
      const buttonContainer = document.getElementById("zodiac-buttons");
      buttonContainer.innerHTML = "<p>문장 데이터를 불러오지 못했습니다. 관리자에게 문의하세요.</p>";
    });
});