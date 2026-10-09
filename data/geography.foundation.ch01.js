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
    {parent_ids:["geo.fertile_crescent"],child_ids:["geo.mesopotamia.north","geo.mesopotamia.south","geo.assyria","hydro.tigris","hydro.euphrates"],passage_links:[p("gen",11,31,32,"contextual"),p("gen",24,10,10,"contextual")]});

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


  var REGION_SECTIONS = {
    "geo.ane":[
      {title:"거시 지리 프레임",body:"고대 근동은 메소포타미아·이집트·레반트와 주변 문명권의 상호작용을 이해하기 위한 거시 지리 프레임입니다. 성경의 사건은 이 문명권들의 교역·전쟁·이주와 긴밀히 연결됩니다."},
      {title:"연구 경계",body:"현대 행정구역처럼 하나의 고정 경계로 보지 않고, 하위 지리 권역과 관계망을 통해 이해합니다."}
    ],
    "geo.fertile_crescent":[
      {title:"비옥한 초승달의 의미",body:"비옥한 초승달은 성경 자체의 지명이 아니라 근대 학술 지리 개념입니다. 레반트와 메소포타미아를 잇는 상대적으로 수자원과 농경 가능성이 높은 정착 회랑을 가리킵니다."},
      {title:"범위의 불확실성",body:"이집트 포함 여부 등 정확한 외연은 학술 자료마다 달라지므로 고정 경계가 아니라 source-dependent extent로 다룹니다."}
    ],
    "geo.mesopotamia":[
      {title:"두 강 사이의 땅, 그러나 하나의 풍경은 아니다",body:"메소포타미아는 그리스어 계통의 ‘두 강 사이의 땅’이라는 지리 표현이다. 하지만 티그리스와 유프라테스라는 공통 수계만으로 지역 전체를 균일한 평야로 이해할 수 없다. 북부의 구릉과 평야, 남부의 낮은 충적평야는 비와 물을 얻는 조건부터 다르다."},
      {title:"북부와 남부가 다른 까닭",body:"북부에서는 지역에 따라 겨울 강수의 도움을 받는 농업이 가능하지만, 건조한 남부의 경작은 강물과 인공 관개에 크게 의존했다. 남부의 도시와 농업이 발달한 배경에는 운하와 제방, 수로 유지 같은 집단적 물 관리가 있었다. 강이 가까이 있다는 사실만으로 안정된 풍요가 보장된 것은 아니다."},
      {title:"강의 흐름과 문명의 형성",body:"티그리스는 상대적으로 빠른 흐름과 동쪽 산지에서 내려오는 지류를 지녔고, 유프라테스는 더 길고 굽이치는 흐름으로 넓은 정착 세계를 연결했다. 범람은 토지를 적시면서도 정착과 농업에 위험을 가져왔다. 특히 남부에서는 퇴적과 수로 변화, 토양 염류화가 장기적인 관리 문제였다."},
      {title:"우르에서 하란으로 · 족장 서사의 공간",body:"창세기 11:31은 데라의 가족이 갈대아 우르에서 가나안으로 향하다 하란에 이르러 머물렀다고 기록한다. 통상적인 남부 우르 식별 가설을 전제로 할 때, 이는 남부 메소포타미아에서 북부 하란을 거쳐 레반트로 이어지는 거시적 이동의 배경이다. 그러나 성경은 가족이 지나간 정확한 도로와 숙영지를 밝히지 않으며 우르의 고고학적 동일시도 본문만으로 확정되지 않는다."},
      {title:"아람 나하라임과 후대 제국을 구분하기",body:"창세기 24:10의 아람 나하라임(אֲרַם נַהֲרַיִם, 아람 나하라임)은 ‘두 강’과 관련된 성경 지명 표현이지만 현대 학술 용어인 메소포타미아 전체와 동일하다고 단정할 수 없다. 앗수르와 바빌로니아는 각각 북부와 남부를 주요 기반으로 삼은 역사적 권역으로 정치적 경계는 시대에 따라 달라졌다."},
      {title:"더 깊이 읽기 · 지도에서 말할 수 있는 범위",body:"고대 강줄기와 왕국의 경계는 시대에 따라 변했다. 오늘날의 하천 선형을 아브라함 시대의 수로라고 그대로 표시하거나 한 경로를 창세기 11장의 실제 여정이라고 확정하는 것은 자료가 허용하는 범위를 넘는다. 메소포타미아는 성경의 이동과 정착, 제국사를 이해하도록 돕는 넓은 지리적 배경이다."}
    ],
    "geo.mesopotamia.north":[
      {title:"북부 메소포타미아의 지형과 수계",body:"북부 메소포타미아는 티그리스와 유프라테스 상류 사이의 평야·구릉·고원 가장자리가 만나는 넓은 지역이다. 하부르와 발리크 같은 유프라테스 지류 유역은 취락과 농경, 지역 간 이동을 연결했다. 북부 전체를 균일한 기후의 평야로 보는 것은 부정확하다."},
      {title:"겨울비와 농업의 차이",body:"북부의 일부 지역은 겨울 강수에 힘입어 우천농업이 가능했다. 반면 남부의 경작은 대체로 인공 관개에 더 크게 의존했다. 북부에도 지역별 강수 편차와 가뭄이 있었으므로 강과 샘, 수리시설의 중요성이 사라진 것은 아니다. 이 차이는 정착과 이동의 조건을 설명한다."},
      {title:"하란이 놓인 교통의 결절점",body:"고대 하란은 오늘날 튀르키예 남동부의 Harran과 일반적으로 연결되는 도시로, 발리크 유역과 아나톨리아·시리아·메소포타미아의 교역망을 잇는 곳이다. 그러나 알려진 후대 교역로의 특정 구간을 데라와 아브람 가족이 실제 걸었던 길로 단정할 수는 없다."},
      {title:"창세기의 인물 하란과 도시 하란",body:"창세기 11:27–28의 데라의 아들 하란은 הָרָן(하란)이며, 11:31–32에서 가족이 거주한 도시 하란은 חָרָן(하란)이다. 한국어 음역이 같아도 서로 다른 인물과 장소이다. 가족이 하란에 머문 사실은 명시되지만 그 이유와 기간은 설명되지 않는다."},
      {title:"족장 가족의 여러 이동",body:"창세기 12:4–5는 아브람이 하란을 떠나 가나안으로 갔다고 기록한다. 28:10은 야곱이 브엘세바를 떠나 하란으로 향한다고 말하며 29:4에서도 하란이 언급된다. 서로 다른 세대의 이동을 하나의 정확한 도로로 합치지 말고 본문이 직접 말하는 출발지와 목적지를 구분해야 한다."},
      {title:"아람 나하라임과 앗수르를 구별하기",body:"창세기 24:10의 אֲרַם נַהֲרַיִם(아람 나하라임)은 아람과 ‘두 강’의 표현이 결합한 성경 지명이다. 북부의 친족 관계와 관련되지만 메소포타미아 전체와 무조건 동일하지 않다. 후대 앗수르의 정치적 경계도 이 자연지리권에 그대로 소급할 수 없다."},
      {title:"본문을 깊이 읽기 · 약속과 거주의 사이",body:"하란의 지리는 가족의 이동이 실제 물과 거리, 교통과 생계의 제약 속에서 일어났음을 보여 준다. 그러나 창세기 11장은 하란 정착을 반드시 불순종이나 안락함에 대한 집착으로 평가하지 않는다. 아직 가나안에 이르지 못한 가족의 역사 속에서 하나님의 부르심과 약속이 새 방향을 연다."},
      {title:"더 깊은 연구 · 지도에서 허용되는 주장",body:"고대 하란과 현대 Harran의 일반적 동일시, 성경의 하란 언급, 데라 가족의 구체적 이동 경로는 서로 다른 증거 층위이다. 본문은 특정 강변 길·숙영지·정확한 고대 좌표를 제공하지 않는다. 확인된 유적, 북부의 넓은 지리권, 미확정 이동 회랑을 구분해야 한다."}
    ],
    "geo.mesopotamia.south":[
      {title:"남부 충적평야와 변화하는 강",body:"남부 메소포타미아는 티그리스·유프라테스 하류의 낮은 충적평야와 옛 습지·수로가 펼쳐진 지역이다. 강은 농업과 교통의 기반이었지만 범람과 퇴적으로 물길과 경작 조건이 달라졌다. 오늘날의 하천 선형을 모든 고대 시대의 강줄기와 동일하게 볼 수 없다."},
      {title:"비가 적은 땅의 농업과 협력",body:"남부는 북부보다 자연 강수가 적어 관개수 확보와 운하·제방의 유지가 중요했다. 물을 분배하고 수로를 관리하는 일은 정착지와 도시의 협력을 필요로 했다. 비옥한 충적토가 있었다는 사실과 안정적인 농업 생산이 저절로 보장되었다는 주장은 다르다."},
      {title:"풍요와 위험이 함께 있는 환경",body:"하류의 강과 운하는 곡물 생산과 물자 이동을 가능하게 했지만 범람·퇴적·배수 문제와 토양 염류화는 장기적인 관리 과제였다. 이러한 환경은 남부 도시의 발전을 설명하는 배경이지만 특정 성경 인물의 직업이나 거주 조건을 직접 증명하지는 않는다."},
      {title:"갈대아 우르와 고대 도시",body:"창세기 11:28, 31과 15:7은 아브람 가족의 출발지를 ‘갈대아 우르’라고 부른다. 남부 이라크의 고대 도시 우르(Tell el-Muqayyar)는 널리 채택되는 식별 후보이며 발굴 자료는 도시·교역·문자·수리 문화를 보여 준다. 발굴된 도시의 존재만으로 아브람의 실제 거주가 입증되는 것은 아니다."},
      {title:"우르의 동일시와 지명 시대",body:"성경의 우르를 남부 우르와 연결하는 견해가 널리 알려져 있으나 북부 후보를 제시하는 논의도 있다. ‘갈대아’라는 명칭은 후대 역사적 용례와의 관계를 별도로 검토해야 한다. 도시 유적의 현대 좌표와 성경 사건의 확정된 출발점은 같은 종류의 증거가 아니다."},
      {title:"우르에서 하란으로 가려던 가족",body:"창세기 11:31은 데라가 가족을 이끌고 가나안으로 가려고 우르를 떠났으나 하란에 이르러 거주했다고 서술한다. 남부 우르 가설 아래에서는 하류 평야에서 북부로 향하는 장거리 이동의 넓은 배경을 설명할 수 있다. 그러나 통과 도시와 숙영지, 특정 강변 도로와 이동 날짜는 본문이 제공하지 않는다."},
      {title:"후대 바빌로니아와 다른 시대",body:"남부 메소포타미아는 후대 바빌로니아의 지리적 기반이지만 제국의 특정 시대 경계를 족장 시대의 우르에 소급할 수 없다. 열왕기하 24–25장과 에스라 1장의 포로·귀환은 같은 넓은 지역을 다른 정치·신학적 문맥에서 사용한다. 한 지역의 역할은 시대에 따라 달라진다."},
      {title:"더 깊은 연구 · 지리와 약속의 관계",body:"느헤미야 9:7과 창세기 15:7은 하나님이 아브람을 우르에서 이끌어 내셨다는 신학적 기억을 전한다. 이는 도시 생활 자체가 악했다거나 아브람이 특정 고대 도로를 이용했다는 주장이 아니다. 하나님의 선택과 약속을 중심에 두되 고고학적 동일시와 지도 경로는 그 증거 수준에서 설명해야 한다."}
    ],
    "geo.assyria":[
      {title:"앗수르의 지리적 기반",body:"앗수르는 북부 메소포타미아, 특히 티그리스 중상류권을 물리적 기반으로 성장한 역사 권역입니다."},
      {title:"역사 권역이라는 점",body:"정치적 영토는 시대마다 달라지므로 고정된 자연지리 경계로 다루지 않습니다."}
    ],
    "geo.babylonia":[
      {title:"바빌로니아의 지리적 기반",body:"바빌로니아는 남부 메소포타미아의 충적평야를 기반으로 한 역사 권역이며 강과 관개망, 도시 집적이 중요했습니다."},
      {title:"성경적 연결",body:"열왕기하 24–25장과 에스라 1장 등 유다의 멸망·포로·귀환의 역사 지리와 연결됩니다."}
    ],
    "hydro.tigris":[
      {title:"성경의 힛데켈",body:"티그리스는 메소포타미아를 형성한 두 대하천 중 하나이다. 성경은 이를 힛데켈(חִדֶּקֶל, 힛데켈)이라는 이름으로 기록하며 창세기 2:14와 다니엘 10:4에서 언급한다. 이 이름은 티그리스와 연결되지만 그것만으로 에덴동산의 정확한 위치를 결정할 수는 없다."},
      {title:"빠른 물길과 동쪽 산지의 지류",body:"티그리스는 유프라테스보다 상대적으로 흐름이 빠르고 동쪽 자그로스 산지에서 내려오는 지류를 많이 받는다. 강과 지류의 물은 도시와 농업, 교통을 지탱했지만 범람과 수량 변화는 지속적인 위험이기도 했다. 두 강의 유속과 지류 구조를 구분해야 주변 생활 조건이 분명해진다."},
      {title:"창세기와 다니엘서의 서로 다른 문맥",body:"창세기 2:14에서 힛데켈은 에덴에서 흘러나오는 강들에 관한 원역사의 지리 언어 안에 등장한다. 다니엘 10:4에서는 예언자가 큰 강 힛데켈 곁에 있었다는 환상 서사의 공간 배경으로 나온다. 두 본문은 같은 강 이름을 사용하지만 원역사적 지리의 현대 좌표 복원과 다니엘서의 장소 지시는 구분해야 한다."},
      {title:"고대 수로와 지도의 한계",body:"특히 남부 충적평야의 강줄기와 분류 수로는 긴 시간에 걸쳐 변화했다. 오늘날 확인되는 강의 흐름을 모든 성경 시대에 동일하게 적용할 수 없다. 강의 일반적인 지리적 실재는 설명할 수 있지만, 시대가 고정되지 않은 고대의 정확한 수로 선형을 새로 확정하거나 지도에 임의로 그려서는 안 된다."},
      {title:"더 깊이 읽기 · 지명과 지형의 증거 수준",body:"히브리어 힛데켈과 티그리스의 식별은 성경 지명 연구의 중요한 기준점이다. 그러나 큰 강의 현대적 대응이 알려졌다는 사실과 그 강의 모든 고대 지류·하구·주변 도시 위치가 정확히 확인되었다는 주장은 별개이다. 본문에 명시된 이름, 지리적 배경, 후대의 지도 복원을 서로 다른 증거 층위로 보존해야 한다."}
    ],
    "hydro.euphrates":[
      {title:"성경의 프라트",body:"유프라테스는 티그리스와 함께 메소포타미아의 농업과 정착, 교통을 조직한 주요 수계이다. 히브리어 이름은 프라트(פְּרָת, 프라트)이며 창세기 15:18은 이를 ‘큰 강’이라고 부른다. 성경의 약속과 지리적 방향을 읽을 때 중요한 기준점이다."},
      {title:"넓은 굽이와 수로가 형성한 생활권",body:"유프라테스는 일반적으로 티그리스보다 길고 완만하며 크게 굽어 흐른다. 북부에서는 발리크와 하부르 같은 지류 체계가 주변 평야와 정착을 연결하고, 남부에서는 강과 인공 운하가 농업 생산을 지탱했다. 범람과 수로 변화는 안정된 풍요를 보장하지 않았고 물을 조절하고 유지하는 노력이 필요했다."},
      {title:"아브라함에게 주어진 약속의 지리 언어",body:"창세기 15:18에서 하나님은 아브람에게 땅에 관한 언약의 말씀을 주시며 큰 강 유프라테스를 지리적 지평의 기준으로 제시한다. 신명기 1:7과 여호수아 1:4도 약속의 땅을 말하는 문맥에서 유프라테스를 언급한다. 이러한 언급을 하나의 시대 불변 정치 국경선이나 정확한 측량도로 바꾸어서는 안 된다."},
      {title:"족장 여정과 강변 교통을 구별하기",body:"유프라테스 유역의 물과 정착망은 메소포타미아에서 북서쪽으로 이어지는 장거리 이동을 이해하는 배경이다. 그러나 창세기 11:31은 데라 가족이 지나간 강변 도로와 통과 도시를 구체적으로 말하지 않는다. 지리적으로 그럴듯한 이동 회랑과 본문이 증언하는 실제 이동 경로는 구분해야 한다."},
      {title:"더 깊이 읽기 · 강줄기와 경계의 불확실성",body:"오늘날의 유프라테스는 실재하는 지리적 기준이지만 특히 남부 충적평야의 고대 강줄기와 분류 수로는 시대별로 달라졌다. 성경의 지명 사용, 고대의 수문 환경, 현대 지도의 선형을 서로 구분해야 한다. 본문이 말하지 않는 고대 수로 좌표나 왕국의 고정 경계를 만들어 내지 않는 것이 정확한 연구이다."}
    ],
    "geo.egypt":[
      {title:"나일 중심의 이집트",body:"고대 이집트의 지리적 핵심은 사막 사이를 관통하는 나일 계곡과 북쪽의 넓은 삼각주입니다."},
      {title:"성경 세계에서의 역할",body:"족장 시대의 기근과 이주, 요셉과 야곱 가족의 정착, 출애굽 서사의 핵심 문명 배경입니다."}
    ],
    "geo.egypt.upper":[
      {title:"상이집트는 남쪽",body:"상이집트는 나일 상류의 남쪽 지역으로, 좁은 계곡과 강을 따라 선형으로 발달한 경작지·정착지가 특징입니다."},
      {title:"명칭의 기준",body:"‘상’과 ‘하’는 북남이 아니라 나일의 흐름과 고도에 따른 구분입니다."}
    ],
    "geo.egypt.lower":[
      {title:"하이집트와 삼각주",body:"하이집트는 나일 하류의 북쪽 지역으로 넓은 삼각주와 분류 수로·습지가 특징입니다."},
      {title:"고센과의 관계",body:"고센은 동부 삼각주 맥락에 강하게 연결되지만 정확한 위치와 경계는 별도 검증이 필요합니다."}
    ],
    "hydro.nile":[
      {title:"이집트를 조직한 강",body:"나일은 이집트의 물 공급·범람원·농업·정착·남북 교통을 동시에 조직한 핵심 대하천입니다."},
      {title:"성경적 배경",body:"출애굽기 1–2장과 7장의 중요한 공간 배경으로 등장합니다."}
    ],
    "landform.nile_delta":[
      {title:"동적인 삼각주",body:"나일 삼각주는 여러 분류 수로와 충적지·습지를 형성한 넓은 하류 지형이며 고대 수로망과 해안선은 시대별로 변했습니다."},
      {title:"지도 사용 원칙",body:"현대 삼각주의 모양을 고대의 고정 경계로 소급하지 않습니다."}
    ],
    "hydro.nile_cataracts":[
      {title:"폭포가 아니라 급류 체계",body:"나일의 cataracts는 단일 폭포가 아니라 암반 노출과 좁은 수로가 만든 급류·암초 지대입니다."},
      {title:"경계 기능",body:"항행을 어렵게 하고 이집트와 누비아 사이 이동·방어에 영향을 주었습니다."}
    ],
    "geo.levant":[
      {title:"동지중해의 거시 권역",body:"레반트는 하나의 고대 국가가 아니라 시리아·레바논·가나안/팔레스타인과 주변을 포괄하는 거시 지리·문화권입니다."},
      {title:"문명권 사이의 연결",body:"이집트와 메소포타미아·아나톨리아 사이의 사람·상품·군대·사상 이동을 연결한 핵심 공간입니다."}
    ],
    "geo.syria":[
      {title:"북부·내륙 레반트",body:"시리아는 북부 레반트의 내륙 평야·산지·스텝이 교차하며 메소포타미아와 아나톨리아로 이어지는 통로를 제공합니다."},
      {title:"성경의 아람과 구분",body:"현대 시리아의 국경과 성경의 아람을 자동 동일시하지 않습니다."}
    ],
    "geo.lebanon":[
      {title:"산과 해안의 결합",body:"레바논은 높은 산지와 좁은 지중해 해안이 나란히 놓이며 목재 자원과 해상 교역이 결합된 지역입니다."},
      {title:"성경적 연결",body:"열왕기상 5장의 레바논 백향목과 두로 교역이 대표적 성경 지리 연결입니다."}
    ],
    "geo.canaan_macro":[
      {title:"남부 레반트의 상위 지리",body:"가나안·팔레스타인 거시 지역은 성경의 가나안과 남부 레반트를 Chapter 1 수준에서 묶는 상위 공간입니다."},
      {title:"Chapter 2와의 경계",body:"해안평야·쉐펠라·중앙산지·갈릴리·네게브·요단열곡 같은 세부 자연지형은 Chapter 2에서 별도로 연구합니다."}
    ],
    "relation.levant_land_bridge":[
      {title:"‘육교’의 의미",body:"레반트의 land bridge는 독립된 지형 물체가 아니라 이집트와 시리아·메소포타미아 사이를 연결하는 기능적 지리 관계입니다."},
      {title:"단순한 평탄 통로가 아님",body:"산맥과 협곡, 고개와 해안평야가 이동을 특정 회랑으로 집중시켰다는 점을 함께 봐야 합니다."}
    ]
  };
  Object.keys(REGION_SECTIONS).forEach(function (id) { if (R[id] && R[id].reader) R[id].reader.sections = REGION_SECTIONS[id]; });

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
