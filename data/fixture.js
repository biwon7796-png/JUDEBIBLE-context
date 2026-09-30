// FIXTURE / SAMPLE RELATION DATA — 맥락·인물·장소·사진·교차참조·자료는 샘플이다(본문은 실제 개역한글, data/krv.js).
window.BVC_FIXTURE = {
  meta: { version: "0.1-krv", notice: "관계 데이터(문맥·인물·장소·사진·관련 본문·자료)는 샘플입니다." },
  // 본문은 data/krv.js(개역한글판, 출처·권리는 data/krv.provenance.json)에서 온다. 이 fixture는 관계 데이터(맥락·인물·장소 등)만 가진다.
  featured: ["gen-22", "heb-11", "gen-12"],
  // 본문 텍스트를 수정하지 않고, 표시 시점에 표면형(surface)으로 entity 를 인식한다. featured 본문에만 적용.
  lexicon: {
    abraham: { kind: "p", surfaces: ["아브라함", "아브람"] },
    isaac: { kind: "p", surfaces: ["이삭"] },
    god: { kind: "p", surfaces: ["하나님"] },
    moriah: { kind: "l", surfaces: ["모리아"] },
    beersheba: { kind: "l", surfaces: ["브엘세바"] },
    haran: { kind: "l", surfaces: ["하란"] }
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
    abraham: { name: "아브라함", aliases: ["Abraham", "Abram"], role: "족장, 믿음의 조상", note: "샘플 설명: 하나님의 부르심을 받아 가나안으로 이주한 인물." },
    isaac: { name: "이삭", aliases: ["Isaac"], role: "아브라함의 아들", note: "샘플 설명: 약속의 아들." },
    god: { name: "하나님", aliases: ["God"], role: "명령하고 준비하시는 분", note: "샘플 설명: 본문의 주도자." }
  },
  places: {
    // 장소 Entity 의 단일 fixture 출처(지도 핀·Guide place_ids·Detail·본문 태그가 모두 이 id 를 쓴다). 좌표 x,y 는 화면 검증용 fixture position 이며 검증된 지리 좌표가 아니다.
    // id/type/label 은 Lock v1.1 §13 Entity 형식(name 은 기존 코드용 동일 값 별칭). status·authority 표식은 전 항목 공통.
    moriah: { id: "moriah", type: "place", label: "모리아", status: "FIXTURE_SAMPLE", authority: "NON_AUTHORITATIVE", position_status: "FIXTURE_POSITION", name: "모리아", aliases: ["Moriah"], x: 58, y: 38, note: "샘플: 예배할 산이 있는 지역(위치는 프로토타입용 좌표).", photos: ["ph-moriah"] },
    // 브엘세바: 이 fixture 기록은 승인 연구 투영(data/projection.research.js, JBC-CR-PLACE-BEERSHEBA-001)으로 부팅 시 교체된다.
    // 투영이 없을 때의 안전한 stub: 좌표(지도 점)·출발지 주장·사진 없음.
    beersheba: { id: "beersheba", type: "place", label: "브엘세바", status: "FIXTURE_SAMPLE", authority: "NON_AUTHORITATIVE", position_status: "NO_EXACT_POINT", location_state: "unlocated", name: "브엘세바", aliases: ["Beersheba"], note: "", photos: [] },
    haran: { id: "haran", type: "place", label: "하란", status: "FIXTURE_SAMPLE", authority: "NON_AUTHORITATIVE", position_status: "FIXTURE_POSITION", name: "하란", aliases: ["Haran"], x: 70, y: 8, note: "샘플: 북쪽 · 12장 배경 인근.", photos: [] }
  },
  // (제거됨) 독립 placeLinks 표: 지도 핀 집합은 이제 위 places(단일 Entity 출처) + GuideStep.place_ids + 본문 출현에서 파생된다.
  // D.placeLinks 는 app.js 가 만드는 읽기 전용 호환 뷰일 뿐, 어떤 기능도 이를 진실 출처로 쓰지 않는다.
  placeLinksStatus: "DERIVED_COMPAT_VIEW",
  placeLinksAuthority: "NON_AUTHORITATIVE",   // UI 개발용 임시 데이터. 승인 연구자산이 아니며 연구 결론으로 쓰지 않는다.
  photos: {
    "ph-moriah": { title: "모리아 지역 (샘플 이미지)", credit: "샘플 · 자리표시 이미지", color: "#7f9a93", source: "generated:fixture-placeholder-svg", license: "CC0 (자체 생성 자리표시)", rights: "CLEARED" },
    // (제거됨) "ph-beersheba" 자리표시 이미지: 브엘세바 사진은 연구 투영의 Wikimedia 출처 정보로 대체된다.
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
