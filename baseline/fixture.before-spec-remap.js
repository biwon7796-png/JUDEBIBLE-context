// FIXTURE / SAMPLE DATA — 실제 공개 데이터 아님. 본문은 자체 요약문(paraphrase)이며 성경 번역본이 아니다.
// 마크업: [[p:id|표시]] = 인물, [[l:id|표시]] = 장소
window.BVC_FIXTURE = {
  meta: { version: "0.1-fixture", notice: "샘플 데이터 — 공개 데이터 결속 전 프로토타입" },
  passages: {
    "gen-22": { ref: "창세기 22장 (샘플)", verses: [
      { n: 1, text: "이 일들 후에 [[p:god|하나님]]이 [[p:abraham|아브라함]]을 시험하시며 그를 부르셨다." },
      { n: 2, text: "하나님이 말씀하셨다. 네가 사랑하는 아들 [[p:isaac|이삭]]을 데리고 [[l:moriah|모리아]] 땅으로 가서 내가 일러 줄 산에서 번제로 드려라." },
      { n: 3, text: "[[p:abraham|아브라함]]은 아침 일찍 일어나 나귀에 안장을 얹고 종 둘과 [[p:isaac|이삭]]을 데리고 길을 떠났다." },
      { n: 4, text: "사흘째 되는 날 [[p:abraham|아브라함]]이 눈을 들어 멀리 그곳을 바라보았다." },
      { n: 5, text: "[[p:abraham|아브라함]]이 종들에게 말했다. 너희는 여기 있어라. 우리는 경배하고 너희에게 돌아오겠다." },
      { n: 6, text: "[[p:abraham|아브라함]]은 번제에 쓸 나무를 [[p:isaac|이삭]]에게 지우고 자기는 불과 칼을 들었다. 둘이 함께 걸어갔다." },
      { n: 7, text: "[[p:isaac|이삭]]이 물었다. 불과 나무는 있는데 번제할 어린 양은 어디 있습니까?" },
      { n: 8, text: "[[p:abraham|아브라함]]이 대답했다. 내 아들아, [[p:god|하나님]]이 친히 어린 양을 준비하실 것이다. 둘이 함께 걸어갔다." }
    ]},
    "heb-11": { ref: "히브리서 11장 17–19절 (샘플)", verses: [
      { n: 17, text: "믿음으로 [[p:abraham|아브라함]]은 시험받을 때 [[p:isaac|이삭]]을 드렸다." },
      { n: 18, text: "[[p:isaac|이삭]]으로 네 자손이 일컬어질 것이라 약속받은 자가 그 독자를 드렸다." },
      { n: 19, text: "그는 [[p:god|하나님]]이 죽은 자 가운데서도 살리실 수 있다고 생각했다." }
    ]},
    "gen-12": { ref: "창세기 12장 1–3절 (샘플)", verses: [
      { n: 1, text: "[[p:god|하나님]]이 [[p:abraham|아브람]]에게 말씀하셨다. 네 고향과 친척과 아버지 집을 떠나 내가 보여 줄 땅으로 가라." },
      { n: 2, text: "내가 너로 큰 민족을 이루고 복을 주어 네 이름을 창대하게 하리니 너는 복이 될 것이다." },
      { n: 3, text: "너를 축복하는 자에게 복을 주고 땅의 모든 족속이 너로 말미암아 복을 얻을 것이다." }
    ]}
  },
  context: {
    "gen-22": {
      genre: "내러티브 (족장 서사)",
      before: "이삭의 출생(21장)과 하갈·이스마엘의 내보냄, 브엘세바의 언약 이후.",
      after: "사라의 죽음과 막벨라 굴 매장(23장)으로 이어짐.",
      structure: ["1–2 명령", "3–6 순종의 여정", "7–8 이삭의 질문과 대답"],
      theme: "시험, 순종, 하나님의 준비(여호와 이레)"
    },
    "heb-11": { genre: "서신 (믿음의 사례 목록)", before: "믿음의 정의와 초기 사례(1–16절).", after: "이삭·야곱·요셉의 믿음(20–22절).", structure: ["17–19 아브라함의 믿음"], theme: "부활 신앙으로서의 순종" },
    "gen-12": { genre: "내러티브 (부르심)", before: "바벨과 데라의 계보(11장).", after: "가나안 이주와 애굽 체류(12:4 이하).", structure: ["1 명령", "2–3 약속"], theme: "부르심과 복의 약속" }
  },
  people: {
    abraham: { name: "아브라함", role: "족장, 믿음의 조상", note: "샘플 설명: 하나님의 부르심을 받아 가나안으로 이주한 인물." },
    isaac: { name: "이삭", role: "아브라함의 아들", note: "샘플 설명: 약속의 아들." },
    god: { name: "하나님", role: "명령하고 준비하시는 분", note: "샘플 설명: 본문의 주도자." }
  },
  places: {
    moriah: { name: "모리아", x: 58, y: 38, note: "샘플: 예배할 산이 있는 지역(위치는 프로토타입용 좌표).", photos: ["ph-moriah"] },
    beersheba: { name: "브엘세바", x: 40, y: 78, note: "샘플: 남쪽 거주지 · 출발지로 추정.", photos: ["ph-beersheba"] },
    haran: { name: "하란", x: 70, y: 8, note: "샘플: 북쪽 · 12장 배경 인근.", photos: [] }
  },
  placeLinks: { "gen-22": ["beersheba", "moriah"], "gen-12": ["haran"], "heb-11": [] },
  photos: {
    "ph-moriah": { title: "모리아 지역 (샘플 이미지)", credit: "샘플 · 자리표시 이미지", color: "#8a6d3b", source: "generated:fixture-placeholder-svg", license: "CC0 (자체 생성 자리표시)", rights: "CLEARED" },
    "ph-beersheba": { title: "브엘세바 (샘플 이미지)", credit: "샘플 · 자리표시 이미지", color: "#5d7f5a", source: "generated:fixture-placeholder-svg", license: "CC0 (자체 생성 자리표시)", rights: "CLEARED" }
  },
  crossrefs: [
    { from: "gen-22:2", to: "heb-11:17", type: "인용/해석", label: "히 11:17 — 드림의 신앙적 해석" },
    { from: "gen-22:1", to: "gen-12:1", type: "병행 주제", label: "창 12:1 — 최초의 부르심과 순종" },
    { from: "gen-22:8", to: "heb-11:19", type: "신학적 연결", label: "히 11:19 — 살리실 수 있다는 확신" },
    { from: "heb-11:17", to: "gen-22:2", type: "원본문", label: "창 22:2 — 원본문으로 돌아가기" },
    { from: "gen-12:1", to: "gen-22:1", type: "병행 주제", label: "창 22:1 — 시험의 절정" }
  ],
  resources: [
    { title: "샘플 주석: 창세기 22장", kind: "주석", url: "https://example.com/commentary-gen22", passages: ["gen-22"] },
    { title: "샘플 지도: 족장 시대 이동로", kind: "지도", url: "https://example.com/map-patriarchs", passages: ["gen-22", "gen-12"] },
    { title: "샘플 논문: 히브리서의 아브라함", kind: "논문", url: "https://example.com/paper-heb11", passages: ["heb-11"] },
    { title: "샘플 사전: 번제(עֹלָה)", kind: "사전", url: "https://example.com/dict-burnt", passages: ["gen-22"] }
  ]
};
