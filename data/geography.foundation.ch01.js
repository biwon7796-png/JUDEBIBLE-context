// JudeBible Biblical Geography Foundation — Holman Bible Atlas Chapter 1 projection.
// Source research: Project01 HBA01-01..06 + normalized handoff, 2026-10-07.
// IMPORTANT: semantic/search/research projection only. No authoritative GIS geometry is created here.
(function () {
  "use strict";

  var SRC = {
    "01": { id:"JBC_HBA01_01_ANE_FERTILE_CRESCENT_WORBS_20261007_01", sha256:"FAF4CFEE3BE35FD9949BC6A9790D64BBBBEDBC5154415351A50F09EC208B7BBD" },
    "02": { id:"JBC_HBA01_02_MESOPOTAMIA_TIGRIS_EUPHRATES_WORBS_20261007_01", sha256:"190075D18DCE140976F45DC16D5DB3F1CB07669A7B3E41176E24E4E1C930ED11" },
    "03": { id:"JBC_HBA01_03_EGYPT_NILE_TWO_LANDS_WORBS_20261007_01", sha256:"DD42932DAE4EF01AA649D95888BABE8DF268DA434E8175AF00EFFD4D57126247" },
    "04": { id:"JBC_HBA01_04_LEVANT_LAND_BRIDGE_WORBS_20261007_01", sha256:"03292714C9609732044EBB4AC9B83BC26459EE336E80054694F2E9B343634864" },
    "05": { id:"JBC_HBA01_05_INTERNATIONAL_COASTAL_HIGHWAY_WORBS_20261007_01", sha256:"07695F58BE0800E6F1F28A1586D166203CB8BFC82E6DD15F385061CE4EC4F172" },
    "06": { id:"JBC_HBA01_06_KINGS_HIGHWAY_WORBS_20261007_01", sha256:"5865ED8C290A35C03784E86D4798641533216BB1CDB4DB1086A1D1E317FF8774" }
  };

  function sourceRef(pkg) {
    return [{ id:SRC[pkg].id, version:"v1.0", sha256:SRC[pkg].sha256, role:"PROFESSIONAL_RESEARCH_SOURCE" }];
  }
  function baseAuthority() {
    return {
      project:"01_목회연구_WORBS_BICS",
      module:"WORBS",
      approval:"CAPTAIN_APPROVED",
      approval_record_id:"PROJECT01_HOLMAN_CH01_FOUNDATION_HANDOFF_TO_JUDEBIBLE_v1.0_20261007",
      approval_scope:"INTERNAL_PRODUCT_PROJECTION",
      registry_effect:"NONE",
      downstream:"APPROVED_DOWNSTREAM_PROJECTION",
      external_release:"NOT_AUTHORIZED"
    };
  }
  function identityBinding(id) {
    return {
      viewer_stable_id:id,
      binding_role:"FOUNDATION_STABLE_ID_REUSE",
      source_registry_id:null,
      source_registry_id_role:"NONE",
      equivalence_semantics:"NORMALIZED_CHAPTER1_IDENTITY",
      BAT01_PLACE_reuse:false,
      BAT01_P_crosswalk:false,
      automatic_merge:false
    };
  }
  function region(id, label, en, foundationType, pkg, summary, facts, opts) {
    opts = opts || {};
    var verify = (opts.verify || [{id:"GEOMETRY-01", issue:"권위 있는 고대 경계/좌표 geometry는 별도 검증이 필요합니다.", blocking:false}]).slice();
    return {
      entity_type:"Region",
      stable_id:id,
      display_label:label,
      label_en:en,
      reader_type:opts.reader_type || ({
        GEOGRAPHIC_REGION:"지리 권역", HISTORICAL_REGION:"역사 권역", HYDROLOGY:"강·수계",
        HYDRO_FEATURE_SYSTEM:"수문 지형 체계", LANDFORM:"지형", GEOGRAPHIC_RELATION:"지리 관계"
      }[foundationType] || "지리 연구"),
      foundation_type:foundationType,
      aliases:(opts.aliases || []).slice(),
      semantic_note:summary,
      status:"STAGE_APPROVED_WITH_VERIFY",
      authority:baseAuthority(),
      identity_binding:identityBinding(id),
      source_refs:sourceRef(pkg),
      source_locator:"Project01 HBA01-"+pkg+" · normalized Chapter 1 foundation handoff",
      reader:{
        published:false,
        internal_product_projection:true,
        headline:summary,
        concise_summary:summary,
        quick_facts:facts || []
      },
      activation:{state:"INTERNAL_PRODUCT_PROJECTION", publishable:false, internal_product_projection:true},
      coordinates:null,
      centroid:null,
      coordinate_status:"NONE",
      geometry:{status:"none", type:null, approved:false, approximate_area:null, map_polygon:"OMIT", detail:"AVAILABLE", relations:"AVAILABLE"},
      spatial:{
        certainty:opts.spatial_certainty || "GEOMETRY_VERIFY",
        primary:null,
        verify_hold:{verify:verify, hold:0}
      },
      verify:verify,
      hold:[],
      parent_ids:(opts.parent_ids || []).slice(),
      child_ids:(opts.child_ids || []).slice(),
      relations:(opts.relations || []).map(function (x) { if (x.name || x.relation) return x; var target = x.target || (x.targets && x.targets.join(", ")) || ""; return { name:target, relation:x.type || "RELATED", resolved:false, foundation_relation:x }; }),
      passage_links:(opts.passage_links || []).slice(),
      passage_refs:(opts.passage_refs || []).slice(),
      projection:{
        map_layer:opts.map_layer || "FOUNDATION.ANE.REGIONS",
        map_semantic_ready:true,
        authoritative_geometry:false,
        search_visible:opts.search_visible !== false,
        research_panel:true,
        scripture_context:opts.scripture_context !== false,
        timeline_mode:"ERA_INTERACTIONS_ONLY"
      },
      projection_visibility:{internal_product:true, search:opts.search_visible !== false, research:true, scripture_context:opts.scripture_context !== false}
    };
  }
  function route(id, label, en, pkg, summary, facts, opts) {
    opts = opts || {};
    var verify = (opts.verify || [{id:"GEOMETRY-01", issue:"고대 노선의 authoritative GIS polyline은 별도 source lock이 필요합니다.", blocking:false}]).slice();
    return {
      type:"Route",
      stable_id:id,
      display_label:label,
      label_en:en,
      reader_type:opts.reader_type || "고대 경로",
      foundation_type:opts.foundation_type || "ROUTE",
      aliases:(opts.aliases || []).slice(),
      status:"STAGE_APPROVED_WITH_VERIFY",
      authority:baseAuthority(),
      source_refs:sourceRef(pkg),
      source_locator:"Project01 HBA01-"+pkg+" · normalized Chapter 1 foundation handoff",
      reader:{published:false, internal_product_projection:true, headline:summary, concise_summary:summary, quick_facts:facts || []},
      activation:{state:"INTERNAL_PRODUCT_PROJECTION", publishable:false, internal_product_projection:true},
      coordinates:null,
      geometry:{approved:false, map_polyline:"OMIT"},
      spatial:{geometryType:opts.geometryType || "CORRIDOR_WITH_PERIOD_SENSITIVE_SEGMENTS", coordinates:null, geometryRef:null, verify_hold:{verify:verify, hold:0}},
      verify:verify,
      hold:[],
      parent_ids:(opts.parent_ids || []).slice(),
      child_ids:(opts.child_ids || []).slice(),
      relations:(opts.relations || []).slice(),
      passage_links:(opts.passage_links || []).slice(),
      passage_refs:(opts.passage_refs || []).slice(),
      source_place:null,
      target_place:null,
      projection:{map_layer:"FOUNDATION.ANE.INTERNATIONAL_ROUTES", map_semantic_ready:true, authoritative_geometry:false, search_visible:opts.search_visible !== false, research_panel:true, timeline_mode:"ERA_INTERACTIONS_ONLY"},
      projection_visibility:{internal_product:true, search:opts.search_visible !== false, research:true, scripture_context:true}
    };
  }
  function p(book, chapter, v1, v2, group) { return {group:group || "related", book:book, chapter:chapter, v1:v1 == null ? null : v1, v2:v2 == null ? v1 : v2}; }

  var R = {};
  R["geo.ane"] = region("geo.ane","고대 근동","Ancient Near East","GEOGRAPHIC_REGION","01",
    "메소포타미아·이집트·레반트와 주변 지역을 함께 보는 성경 세계의 거시 지리 프레임입니다.",
    [["유형","거시 지리 권역"],["지도","고정 경계 없음"],["핵심","문명권·교역·전쟁·이동의 상위 공간"]],
    {aliases:["ANE"],child_ids:["geo.fertile_crescent","geo.egypt","geo.levant","route.network.ane"],spatial_certainty:"CONCEPTUAL_MACRO_EXTENT"});

  R["geo.fertile_crescent"] = region("geo.fertile_crescent","비옥한 초승달","Fertile Crescent","GEOGRAPHIC_REGION","01",
    "시리아-아라비아 사막 주변의 상대적으로 비옥한 지대를 묶는 현대 학술 지리 개념으로, 범위는 자료마다 조금씩 다릅니다.",
    [["유형","현대 학술 지리 개념"],["핵심","레반트와 메소포타미아의 농경·정착 회랑"],["주의","이집트 포함 범위는 자료별 차이"]],
    {parent_ids:["geo.ane"],child_ids:["geo.mesopotamia"],relations:[{type:"OVERLAPS",target:"geo.levant",confidence:"HIGH"}],map_layer:"FOUNDATION.ANE.FERTILE_CRESCENT",spatial_certainty:"SOURCE_DEPENDENT_EXTENT",
     verify:[{id:"VERIFY-HBA01-01-C",issue:"비옥한 초승달의 정확한 외연은 source-dependent입니다.",blocking:false}]});

  R["geo.mesopotamia"] = region("geo.mesopotamia","메소포타미아","Mesopotamia","GEOGRAPHIC_REGION","02",
    "티그리스와 유프라테스 수계를 중심으로 한 핵심 고대 지역이며, 북부와 남부의 지형·강수·농업 조건이 뚜렷하게 다릅니다.",
    [["유형","지리 권역"],["수계","티그리스 · 유프라테스"],["구조","북부와 남부를 구분"]],
    {parent_ids:["geo.fertile_crescent"],child_ids:["geo.mesopotamia.north","geo.mesopotamia.south","geo.assyria","hydro.tigris","hydro.euphrates"]});

  R["geo.mesopotamia.north"] = region("geo.mesopotamia.north","북부 메소포타미아","Northern Mesopotamia","GEOGRAPHIC_REGION","02",
    "하란과 앗수르권을 포함하는 북부의 평야·고원 전이지대로, 남부보다 강수의 도움을 더 받을 수 있는 농업 환경입니다.",
    [["지역","메소포타미아 북부"],["농업","지역에 따라 우천농업 가능"],["관련 장소","하란"]],
    {parent_ids:["geo.mesopotamia"],passage_links:[p("gen",11,31,32),p("gen",24,10,10)]});

  R["geo.mesopotamia.south"] = region("geo.mesopotamia.south","남부 메소포타미아","Southern Mesopotamia","GEOGRAPHIC_REGION","02",
    "우르와 바빌로니아가 자리한 저평한 충적평야로, 높은 농업 생산성은 강과 관개·수리 관리에 크게 의존했습니다.",
    [["지역","메소포타미아 남부"],["지형","충적평야"],["농업","관개 의존"]],
    {parent_ids:["geo.mesopotamia"],child_ids:["geo.babylonia"],passage_links:[p("gen",11,31,31),p("gen",15,7,7)]});

  R["geo.assyria"] = region("geo.assyria","앗수르","Assyria","HISTORICAL_REGION","02",
    "북부 메소포타미아를 물리적 기반으로 한 역사 권역으로, 정치적 경계는 시대에 따라 크게 변합니다.",
    [["유형","시대 가변 역사 권역"],["물리 기반","북부 메소포타미아"],["지도","시대별 경계만 허용"]],
    {parent_ids:["geo.mesopotamia"],relations:[{type:"HAS_PHYSICAL_SUBSTRATE",target:"geo.mesopotamia.north",confidence:"HIGH"}],passage_links:[p("2ki",17,null,null),p("2ki",18,null,null),p("2ki",19,null,null)],
     spatial_certainty:"HISTORICAL_BOUNDARY_VARIABLE",verify:[{id:"VERIFY-HBA01-02-B",issue:"앗수르의 시대별 boundary polygon은 별도 역사 연구가 필요합니다.",blocking:false}]});

  R["geo.babylonia"] = region("geo.babylonia","바빌로니아","Babylonia","HISTORICAL_REGION","02",
    "남부 메소포타미아의 충적평야를 물리적 기반으로 한 역사 권역이며, 제국의 정치적 외연은 시대마다 달라집니다.",
    [["유형","시대 가변 역사 권역"],["물리 기반","남부 메소포타미아"],["성경 맥락","유다 멸망 · 포로 · 귀환"]],
    {parent_ids:["geo.mesopotamia.south"],relations:[{type:"HAS_PHYSICAL_SUBSTRATE",target:"geo.mesopotamia.south",confidence:"HIGH"}],passage_links:[p("2ki",24,null,null),p("2ki",25,null,null),p("ezr",1,null,null)]});

  R["hydro.tigris"] = region("hydro.tigris","티그리스 강","Tigris River","HYDROLOGY","02",
    "메소포타미아의 주요 대하천으로, 유프라테스보다 상대적으로 빠른 흐름과 동쪽 산지의 지류 체계를 가집니다.",
    [["유형","강"],["성경명","힛데켈"],["지도","고대 수로 변동성 보존"]],
    {reader_type:"강·수계",parent_ids:["geo.mesopotamia"],map_layer:"FOUNDATION.ANE.MAJOR_RIVERS",passage_links:[p("gen",2,14,14),p("dan",10,4,4)],
     verify:[{id:"VERIFY-HBA01-02-A",issue:"특히 남부 충적평야의 고대 강줄기는 시대별 변동이 있습니다.",blocking:false}]});

  R["hydro.euphrates"] = region("hydro.euphrates","유프라테스 강","Euphrates River","HYDROLOGY","02",
    "메소포타미아의 주요 대하천으로, 성경에서는 ‘큰 강’으로도 불리며 동쪽 지리적 기준점 역할을 합니다.",
    [["유형","강"],["성경명","프라트"],["기능","농업 · 정착 · 교통"]],
    {reader_type:"강·수계",parent_ids:["geo.mesopotamia"],map_layer:"FOUNDATION.ANE.MAJOR_RIVERS",passage_links:[p("gen",15,18,18),p("deu",1,7,7),p("jos",1,4,4)],
     verify:[{id:"VERIFY-HBA01-02-A",issue:"고대 강줄기의 세부 geometry는 별도 source lock이 필요합니다.",blocking:false}]});

  R["geo.egypt"] = region("geo.egypt","이집트","Egypt","GEOGRAPHIC_REGION","03",
    "나일 계곡과 삼각주를 중심으로 형성된 성경 세계의 핵심 문명권으로, 주변 건조지대와 강의 대비가 정착과 농업을 조직했습니다.",
    [["유형","나일 중심 지리 권역"],["구조","상이집트 · 하이집트"],["핵심","나일 · 충적토 · 교통"]],
    {parent_ids:["geo.ane"],child_ids:["geo.egypt.upper","geo.egypt.lower","hydro.nile"],passage_links:[p("gen",12,10,20),p("exo",1,null,null)]});

  R["geo.egypt.upper"] = region("geo.egypt.upper","상이집트","Upper Egypt","GEOGRAPHIC_REGION","03",
    "나일 상류의 남쪽 좁은 계곡 지역으로, 사막 사이의 선형 경작지와 정착 회랑이 특징입니다.",
    [["방향","남쪽 · 상류"],["지형","좁은 나일 계곡"],["농업","범람원 의존"]],
    {parent_ids:["geo.egypt"]});

  R["geo.egypt.lower"] = region("geo.egypt.lower","하이집트","Lower Egypt","GEOGRAPHIC_REGION","03",
    "나일 하류의 북쪽 삼각주 지역으로, 넓은 충적평야와 분류 수로·습지 환경이 특징입니다.",
    [["방향","북쪽 · 하류"],["지형","나일 삼각주"],["관련 장소","고센"]],
    {parent_ids:["geo.egypt"],child_ids:["landform.nile_delta"],passage_links:[p("gen",45,10,10),p("gen",47,1,6)]});

  R["hydro.nile"] = region("hydro.nile","나일 강","Nile River","HYDROLOGY","03",
    "이집트의 농업·정착·교통을 조직한 북향 대하천이며, 역사적 연례 범람과 퇴적물 공급이 경작지 형성에 중요했습니다.",
    [["유형","강"],["흐름","남 → 북"],["기능","농업 · 정착 · 교통"]],
    {reader_type:"강·수계",parent_ids:["geo.egypt"],child_ids:["hydro.nile_cataracts"],map_layer:"FOUNDATION.ANE.NILE_SYSTEM",passage_links:[p("exo",1,22,22),p("exo",2,3,5),p("exo",7,15,25)]});

  R["landform.nile_delta"] = region("landform.nile_delta","나일 삼각주","Nile Delta","LANDFORM","03",
    "나일이 지중해로 퍼지며 형성한 넓은 충적·분류 수로 지형으로, 고대의 해안선과 수로망은 시대에 따라 변화했습니다.",
    [["유형","충적 삼각주"],["지역","하이집트"],["지도","시대·자료별 geometry"]],
    {reader_type:"지형",parent_ids:["geo.egypt.lower"],map_layer:"FOUNDATION.ANE.NILE_SYSTEM",
     verify:[{id:"VERIFY-HBA01-03-B",issue:"고대 나일 삼각주의 수로와 해안선은 시대별로 변동합니다.",blocking:false}]});

  R["hydro.nile_cataracts"] = region("hydro.nile_cataracts","나일 급류 지대","Nile Cataracts","HYDRO_FEATURE_SYSTEM","03",
    "나일 남부의 암반 급류 체계로, 단순 폭포가 아니라 항행을 방해하고 이집트와 누비아의 경계·방어에 영향을 준 수문 지형입니다.",
    [["유형","복합 수문 지형"],["기능","항행 장애 · 경계"],["주의","단일 폭포 아님"]],
    {reader_type:"수문 지형 체계",parent_ids:["hydro.nile"],map_layer:"FOUNDATION.ANE.NILE_SYSTEM"});

  R["geo.levant"] = region("geo.levant","레반트","Levant","GEOGRAPHIC_REGION","04",
    "이집트·시리아·메소포타미아와 지중해를 이어 준 동지중해의 거시 지리·문화권으로, 하나의 고대 국가나 고정 국경이 아닙니다.",
    [["유형","동지중해 거시 권역"],["기능","교역 · 군사 · 문화 연결"],["지도","source-specific extent"]],
    {parent_ids:["geo.ane"],child_ids:["geo.syria","geo.lebanon","geo.canaan_macro","relation.levant_land_bridge"],spatial_certainty:"VARIABLE_SCHOLARLY_EXTENT",
     verify:[{id:"VERIFY-HBA01-04-A",issue:"레반트의 정확한 외연은 학술적 문맥마다 달라집니다.",blocking:false}]});

  R["geo.syria"] = region("geo.syria","시리아","Syria","GEOGRAPHIC_REGION","04",
    "북부·내륙 레반트와 메소포타미아·아나톨리아를 잇는 접경·회랑 지역으로, 성경의 아람과 현대 시리아를 자동 동일시하지 않습니다.",
    [["유형","북부·내륙 레반트 권역"],["기능","메소포타미아·아나톨리아 연결"],["주의","현대 국경 ≠ 고대 범위"]],
    {parent_ids:["geo.levant"],verify:[{id:"VERIFY-HBA01-04-B",issue:"고대 시리아의 범위는 현대 시리아 국경과 동일하지 않습니다.",blocking:false}]});

  R["geo.lebanon"] = region("geo.lebanon","레바논","Lebanon","GEOGRAPHIC_REGION","04",
    "산악과 좁은 지중해 해안, 목재 자원과 해상 교역이 결합된 레반트 북부 지역입니다.",
    [["유형","산악·해안 지리 권역"],["자원","역사적 목재 자원"],["기능","해상 교역"]],
    {parent_ids:["geo.levant"],passage_links:[p("1ki",5,null,null),p("isa",35,2,2)]});

  R["geo.canaan_macro"] = region("geo.canaan_macro","가나안·팔레스타인 거시 지역","Canaan / Palestine Macro Region","GEOGRAPHIC_REGION","04",
    "성경의 가나안과 남부 레반트를 Chapter 1 수준에서 묶는 상위 지리이며, 해안평야·고지·요단열곡 같은 세부 자연지형은 Chapter 2로 넘깁니다.",
    [["유형","남부 레반트 상위 지리"],["기능","이집트–시리아 연결"],["범위","세부 자연지형은 Chapter 2"]],
    {parent_ids:["geo.levant"],passage_links:[p("gen",12,null,null),p("num",34,null,null),p("jos",1,null,null)],
     verify:[{id:"VERIFY-HBA01-04-C",issue:"가나안/팔레스타인의 exact extent는 시대와 source에 따라 달라집니다.",blocking:false}]});

  R["relation.levant_land_bridge"] = region("relation.levant_land_bridge","레반트 육교 관계","Levant / Palestine as Land Bridge","GEOGRAPHIC_RELATION","04",
    "이집트와 시리아·메소포타미아 사이에서 사람·상품·군대·사상이 이동한 기능적 연결 관계이며, 독립 polygon 지형이 아닙니다.",
    [["유형","지리 관계"],["기능","지역 간 연결"],["geometry","기본적으로 없음"]],
    {reader_type:"지리 관계",parent_ids:["geo.levant"],relations:[{type:"CONNECTS",targets:["geo.egypt","geo.levant","geo.syria","geo.mesopotamia"],confidence:"HIGH"}],
     passage_links:[p("gen",12,4,10),p("2ki",17,null,null),p("2ki",18,null,null),p("2ki",19,null,null)],spatial_certainty:"RELATIONAL_NOT_OBJECT_GEOMETRY"});

  var Q = {};
  Q["route.international_coastal"] = route("route.international_coastal","국제 해안도로","International Coastal Highway","05",
    "북부 시나이와 남부 해안평야를 지나 와디 아라–므깃도를 거쳐 북부 레반트로 이어진 장거리 교역·군사 회랑입니다.",
    [["유형","고대 국제 회랑"],["핵심 노드","가자 · 아벡 · 와디 아라 · 므깃도"],["명칭 주의","Via Maris는 제한적으로 사용"]],
    {aliases:["Coastal Highway","Via Maris"],parent_ids:["route.network.ane","geo.levant"],relations:[{type:"MEMBER_OF",target:"route.network.ane",confidence:"HIGH"}],
     passage_links:[p("isa",8,23,23),p("jdg",5,19,19),p("1ki",9,15,15),p("2ki",23,29,29)],
     verify:[
       {id:"VERIFY-HBA01-05-A",issue:"정확한 GIS geometry와 segment chronology는 별도 검증이 필요합니다.",blocking:false},
       {id:"VERIFY-HBA01-05-D",issue:"Via Maris 명칭은 전체 국제로의 고대 고유명으로 사용하기에 학술적 주의가 필요합니다.",blocking:false}
     ]});

  Q["route.kings_highway"] = route("route.kings_highway","왕의 대로","King's Highway","06",
    "아카바만·에시온게벨 부근에서 에돔·모압·암몬 고원을 거쳐 북쪽 다메섹 방향으로 이어진 트랜스요르단의 장거리 회랑입니다.",
    [["유형","트랜스요르단 고원 경로"],["성경 표현","דֶּרֶךְ הַמֶּלֶךְ"],["지도","시대별 segment 검증 필요"]],
    {aliases:["King's Road","왕의 길"],parent_ids:["route.network.ane","geo.levant"],relations:[{type:"MEMBER_OF",target:"route.network.ane",confidence:"HIGH"}],
     passage_links:[p("num",20,17,17,"direct"),p("num",21,22,22,"direct"),p("deu",2,null,null),p("1ki",9,26,26),p("1ki",22,48,48)],
     verify:[{id:"VERIFY-HBA01-06-A",issue:"왕의 대로의 정확한 고대 선형은 시대별 source-specific geometry 검증이 필요합니다.",blocking:false}]});

  Q["route.network.ane"] = route("route.network.ane","고대 근동 국제 교통망","Ancient Near East International Route Network","01",
    "고대 근동의 주요 장거리 육상 회랑을 묶는 상위 교통망으로, 하나의 단일 경로나 geometry를 뜻하지 않습니다.",
    [["유형","경로 네트워크"],["하위 경로","국제 해안도로 · 왕의 대로"],["geometry","단일 geometry 없음"]],
    {reader_type:"교통망",foundation_type:"ROUTE_NETWORK",parent_ids:["geo.ane"],child_ids:["route.international_coastal","route.kings_highway"],geometryType:"AGGREGATE_NETWORK_NO_SINGLE_GEOMETRY",search_visible:true,
     verify:[{id:"NETWORK-GEOMETRY-01",issue:"상위 교통망은 단일 authoritative geometry를 갖지 않습니다.",blocking:false}]});

  window.JBC_GEOGRAPHY_FOUNDATION = {
    meta:{
      schema:"JUDEBIBLE_GEOGRAPHY_FOUNDATION_PROJECTION_v1.0",
      chapter:"Holman Bible Atlas Chapter 1",
      generated_from:"PROJECT01_HOLMAN_CH01_FOUNDATION_HANDOFF_TO_JUDEBIBLE_v1.0_20261007",
      normalized:true,
      stable_id_count:23,
      geometry_policy:"NO_INVENTED_GEOMETRY",
      source_hashes:Object.keys(SRC).map(function(k){return SRC[k].sha256;})
    },
    regions:R,
    routes:Q
  };
})();
