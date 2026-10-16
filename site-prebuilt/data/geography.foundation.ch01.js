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
      {
        "title": "한눈에 보기 · 나일을 따라 형성된 이집트",
        "body": "성경의 이집트는 단순히 현대 국가의 국경 안에 놓인 한 점이 아니라, 사막 사이를 흐르는 나일강과 북부 삼각주를 중심으로 형성된 오랜 문명 세계이다. 남쪽의 좁은 상이집트 계곡과 북쪽의 넓은 하이집트 삼각주는 서로 다른 자연환경을 지니면서 강을 통해 연결되었다. 이 지리적 구조를 이해하면 창세기의 기근과 이주, 출애굽기의 억압과 해방, 예언서의 이집트 관련 말씀을 같은 지명 안에서도 구별하여 읽을 수 있다."
      },
      {
        "title": "사막과 물의 대비 · 경작지와 정착",
        "body": "이집트의 핵심 농경지는 강과 범람원이 만든 좁은 띠와 북부의 넓은 충적평야에 집중되었다. 건조한 주변 지대와 나일의 물은 정착과 농업의 공간을 뚜렷하게 구별했다. 계절적 범람과 퇴적은 생산성을 높였지만 물의 높낮이와 수로 관리에 따라 위험도 뒤따랐다. ‘나일의 선물’이라는 표현은 지리적 의존을 보여 주지만 기근이나 인간의 노동이 없었다는 뜻이 아니다."
      },
      {
        "title": "두 땅과 왕권 · 자연지리와 정치사의 차이",
        "body": "상이집트는 남쪽 상류의 계곡, 하이집트는 북쪽 하류의 삼각주이다. 고대 이집트는 이 둘의 결합을 ‘두 땅(Two Lands)’이라는 왕권의 언어와 상징으로 표현했다. 그러나 두 지형의 구분이 모든 왕조의 동일한 정치 경계나 이집트가 지배했던 모든 지역의 범위를 뜻하지는 않는다. 누비아와 레반트에 대한 정치적 영향력은 시대에 따라 달랐으므로 자연지리, 왕조사, 제국의 영토를 따로 다루어야 한다."
      },
      {
        "title": "창세기 12장 · 기근과 아브람의 이주",
        "body": "창세기 12:10–20에서 아브람은 가나안의 기근 때문에 이집트로 내려간다. 이집트의 나일 중심 농업 환경은 기근을 피해 이동하는 이야기에 현실적 배경을 제공하지만, 당시의 강 수위나 아브람의 정확한 국경 통과 경로를 확정해 주지는 않는다. 이 장면의 중심은 지리 자체보다 위험 앞에서 드러난 아브람의 두려움과 하나님의 개입이다. 지리 연구는 본문이 말하는 사건을 더 잘 이해하게 하는 보조 근거이다."
      },
      {
        "title": "요셉과 고센 · 생존의 땅이 된 이집트",
        "body": "창세기 41–47장은 기근과 식량 관리, 요셉의 역할, 야곱 가족의 이집트 정착을 연결한다. 창세기 45:10과 46–47장에서 고센은 가족이 거주하는 지역으로 등장하며, 일반적으로 동부 삼각주의 지리적 맥락과 관련된다. 그러나 고센을 이집트 전체나 나일 삼각주 전체와 동일시할 수 없고 정확한 고고학적 경계도 확정되지 않았다. 성경이 설명하는 생명의 보존과 가족의 이주를 고정된 GPS 경로로 바꾸지 않는 것이 중요하다."
      },
      {
        "title": "출애굽기 · 생존의 공간이 억압의 공간이 되다",
        "body": "출애굽기 1–2장은 이집트에서 이스라엘 자손이 강제 노동과 살해 명령을 겪는 모습을 보여 준다. 1:22의 강과 2:3–5의 갈대 상자는 나일 수계가 생명 위협과 생명 보존의 장면 모두에 등장함을 드러낸다. 7장의 나일 재앙과 12–14장의 구원 서사는 하나님의 심판과 해방을 중심으로 전개된다. 그러나 강의 특정 지류나 바다 건넘의 정확한 현대 좌표는 이 광역 지리 연구만으로 결정할 수 없다."
      },
      {
        "title": "원어와 정경 · 미츠라임의 여러 역할",
        "body": "히브리어 מִצְרַיִם(미츠라임, Miṣrayim)은 이집트의 일반적 성경 명칭이며, 쌍수처럼 보이는 형태만으로 ‘상이집트와 하이집트’라는 확정 어원을 주장할 수 없다. יְאֹר(여오르, yəʾōr)는 출애굽기의 나일 문맥에서 강 또는 수로를 가리킨다. 이집트는 억압의 무대만이 아니다. 이사야 19:24–25는 이집트와 앗수르, 이스라엘을 함께 언급하는 미래의 복을 말하며, 마태복음 2:13–15는 예수 가족의 이집트 피신을 기록하고 호세아 11:1을 인용한다. 각 본문의 시대와 신학적 기능을 구분해야 한다."
      },
      {
        "title": "더 깊은 연구 · 지리·역사·성경 사건의 증거 구분",
        "body": "나일 계곡과 삼각주라는 자연지리, 상·하 이집트의 문화적 구분, 성경의 이집트 서사는 서로 연결되지만 동일한 종류의 증거가 아니다. 고대 수로·해안선·왕조별 국경·고센의 정확한 위치·출애굽 경로는 각각 별도 검증이 필요하다. 발굴과 지형 연구가 고대 이집트의 생활 조건을 밝혀 주더라도 개별 성경 인물의 방문이나 특정 사건을 자동 입증하지는 않는다. 이 Reader는 기존 이집트 foundation identity와 관련 본문 연결을 유지하며 새로운 좌표나 경계 geometry를 만들지 않는다."
      }
    ],
    "geo.egypt.upper":[
      {
        "title": "한눈에 보기 · 남쪽 상류의 이집트",
        "body": "상이집트(Upper Egypt)는 나일강을 거슬러 올라가는 남쪽의 좁은 계곡 지대이다. 이름의 ‘상(上)’은 현대 지도에서 위쪽에 놓인 북쪽을 뜻하지 않고, 강의 흐름을 기준으로 높은 상류를 가리킨다. 하이집트가 북쪽의 넓은 삼각주를 중심으로 한다면, 상이집트는 사막 사이를 길게 이어지는 나일 계곡과 경작지의 띠로 이해하는 것이 정확하다."
      },
      {
        "title": "좁은 강변과 넓은 사막 · 정착의 공간",
        "body": "나일 양쪽에는 범람원이 이어지지만 그 폭은 구간마다 다르며, 곧바로 건조한 사막과 암석 지대가 시작된다. 비가 드문 환경에서 강물이 공급하는 수분과 퇴적토는 농업과 취락의 기초가 되었다. 이 대비는 상이집트의 마을과 도시가 계곡을 따라 길게 연결된 이유를 설명한다. 다만 ‘좁은 계곡’이 전 구간의 동일한 폭이나 시대불변 경작 면적을 뜻하지는 않는다."
      },
      {
        "title": "범람과 농업 · 물의 선물과 관리의 책임",
        "body": "고대 나일의 연례 범람은 상류 유역의 계절 강우와 연결되었고, 상이집트의 범람원에도 물과 퇴적물을 공급했다. 사람들은 범람 분지와 수로를 관리하며 작물을 재배했다. 지나치게 낮거나 높은 수위는 모두 생활의 위험이 될 수 있었으므로 나일을 무조건 풍요를 보장하는 강으로 묘사해서는 안 된다. 강의 물리적 조건과 역사 속 농업 기술을 함께 살필 때 본문 배경이 선명해진다."
      },
      {
        "title": "남북 교통과 도시 · 테베의 시대적 위치",
        "body": "북쪽으로 흐르는 강물과 상류 방향 항해에 유리한 북풍은 이집트의 긴 계곡을 따라 물자와 사람이 오갈 수 있는 조건을 만들었다. 후대의 테베(오늘날 룩소르 일대)는 상이집트의 중요한 종교·정치 중심지가 되었다. 그러나 이 사실을 곧바로 아브라함이나 요셉이 테베를 방문했다는 증거로 바꿀 수는 없다. 지리적 이동 가능성과 성경이 실제로 서술한 여정은 별개의 주장이다."
      },
      {
        "title": "두 땅의 통일 · 자연지리와 왕권의 상징",
        "body": "상이집트와 하이집트의 대비는 이집트 왕권이 사용한 ‘두 땅(Two Lands)’의 상징과 연결된다. 이집트의 문화와 통치에서 남쪽 계곡과 북쪽 삼각주의 결합은 중요한 의미를 지녔다. 그러나 자연지리상의 두 권역과 특정 왕조의 행정 경계, 이집트 제국이 지배한 영토를 하나로 합쳐서는 안 된다. 시대별 정치 권력은 넓어지고 줄어들었으며, 두 땅의 상징은 그러한 변화 속에서도 계속 사용되었다."
      },
      {
        "title": "남쪽 경계 · 수에네와 누비아의 관계",
        "body": "상이집트 남단의 아스완 일대에는 나일 제1급류 지대가 있으며, 이곳은 이집트와 누비아의 접촉·교역·군사 활동에서 중요한 지리적 관문이었다. 에스겔 29:10은 이집트에 대한 심판 선언에서 ‘수에네’와 구스의 경계를 언급한다. 이것은 남쪽 공간의 성경적 지평을 보여 주지만, 한 시대의 표현을 모든 왕조에 동일한 국경선으로 고정하는 근거는 아니다. 누비아를 상이집트와 자동 동일시하지 않는다."
      },
      {
        "title": "원어와 정경 · 미츠라임은 상이집트만이 아니다",
        "body": "성경 히브리어 מִצְרַיִם(미츠라임, Miṣrayim)은 일반적으로 이집트를 가리킨다. 어형의 끝이 쌍수처럼 보인다는 이유만으로 그 이름이 상이집트와 하이집트의 결합에서 유래했다고 확정할 수는 없다. 창세기 12장과 41–47장, 출애굽기 1–14장은 이집트를 중요 무대로 삼지만 대부분의 장면을 상이집트의 특정 도시나 강변에 직접 묶지 않는다. 광역 지리와 본문이 명시한 개별 장소를 구별하는 것이 필요하다."
      },
      {
        "title": "더 깊은 연구 · 지리의 확실성과 경계의 불확실성",
        "body": "상이집트가 나일의 남쪽 상류 계곡이라는 자연지리적 구분은 확실하다. 반면 고대의 세부 수로·취락 분포, 왕조별 행정 경계, 성경 인물이 실제로 지났을 길은 시대별 자료가 필요하다. 아스완과 제1급류 지대의 일반적 위치를 알더라도 족장이나 출애굽 공동체의 구체적 동선을 거기까지 연장할 수는 없다. 이 Reader는 넓은 권역 설명만 제공하며 새 점·경계·경로 geometry를 승인하지 않는다."
      }
    ],
    "geo.egypt.lower":[
      {title:"한눈에 보기 · 북쪽 하류의 하이집트",body:"하이집트(Lower Egypt)는 이집트의 북부, 나일강 하류와 삼각주를 중심으로 한 넓은 지역이다. '하(下)'는 남쪽을 뜻하지 않고 강물이 흘러 내려가는 하류를 뜻한다. 남쪽 상이집트의 좁은 계곡과 달리, 이 지역에는 분류 수로·충적평야·습지·경작지와 정착지가 복합적으로 펼쳐졌다."},
      {title:"물이 여러 갈래로 퍼지는 생활 환경",body:"나일이 지중해에 가까워지면서 강물은 여러 분류 수로와 범람원으로 확산되었다. 수로와 저습지는 물 공급·농경·어업·갈대 자원과 이동에 영향을 주었다. 그러나 수로가 변하고 퇴적이 계속되므로 현재의 삼각주 지형을 족장 시대나 출애굽 시기의 완성된 지도로 소급해서는 안 된다."},
      {title:"고센 · 야곱 가족의 거주와 땅의 성격",body:"창세기 45:10에서 요셉은 아버지 가족이 고센에 거주하도록 초청한다. 46:28–34와 47:1–6은 가족의 이동, 목축 생활, 정착 허가를 연결한다. 고센(גֹּשֶׁן, 고셴, Gōšen)은 이집트 안의 거주 지역으로 서술되며, 동부 삼각주와의 연관이 유력하다. 그러나 본문은 고센의 정확한 고고학적 지점이나 모든 경계선을 제공하지 않는다."},
      {title:"기근과 이주 · 물이 많은 땅도 무조건 풍요롭지 않다",body:"창세기 41–47장은 기근 가운데 식량 관리와 가족의 이집트 이주를 서술한다. 나일 수계가 농업 생산의 토대였다는 사실은 기근이 결코 일어나지 않았다는 뜻이 아니다. 요셉의 행정과 가족의 이주를 설명할 때 지리적 환경은 배경이지만, 특정 고대 기근의 수문 연도나 정착 경로를 성경만으로 복원할 수는 없다."},
      {title:"출애굽의 무대 · 노동과 권력의 지리",body:"출애굽기 1장은 이스라엘 자손의 번성과 강제 노동, 국고성 비돔과 라암셋을 기록한다. 이집트 동북부와 삼각주가 역사적 논의에서 중요하더라도 성경이 제시하는 장소들 사이의 모든 이동을 하나의 확정 노선으로 연결할 수는 없다. 고센의 거주권, 왕의 노동 동원, 출애굽의 실제 경로는 서로 다른 증거와 검증 수준을 가진다."},
      {title:"동쪽으로 열린 통로와 교역",body:"동부 삼각주는 시나이와 남부 레반트로 이어지는 여러 통행 회랑과 맞닿는다. 와디 투밀라트(Wadi Tumilat)는 동부 삼각주와 동쪽 지역을 잇는 역사 지리 연구에서 중요하지만, 그것이 성경의 고센 전체와 정확히 일치하거나 특정 출애굽 노선임을 자동 증명하지는 않는다. 교역·군사 이동의 일반 지리와 개별 성경 사건의 경로는 구분한다."},
      {title:"두 땅의 이집트 · 자연지리와 왕권의 상징",body:"상이집트와 하이집트의 구분은 물리적 지리이면서 이집트 왕권이 말한 '두 땅(Two Lands)'의 역사적·상징적 언어와 연결된다. 그러나 '두 땅'이라는 문화·정치적 개념을 모든 시대에 동일한 국경을 가진 두 행정구역으로 환원할 수 없다. 성경의 '미츠라임'(מִצְרַיִם, 미츠라임)은 이집트를 가리키지만 어미가 쌍수처럼 보인다는 사실만으로 상·하 이집트를 뜻하는 확정 어원이라고 할 수 없다."},
      {title:"더 깊은 연구 · 고센과 삼각주의 위치 확실성",body:"하이집트는 넓은 지리 권역으로 확실히 설명할 수 있다. 고센을 동부 삼각주에 두는 해석은 강한 문맥적 후보이지만 세부 지점과 범위는 연구마다 차이가 있다. 발굴된 동부 삼각주의 정착 유적은 고대 인구 이동과 생활상을 이해하게 하지만, 야곱 가족의 특정 거주지나 출애굽 사건 자체를 직접 입증하지는 않는다. 기존 고센 Place identity와 지도 좌표는 승인 없이 변경하지 않는다."}
    ],
    "hydro.nile":[
      {title:"한눈에 보기 · 이집트를 관통하는 생명의 물길",body:"나일강은 아프리카 내륙에서 북쪽 지중해로 흐르며 이집트의 좁은 계곡과 북부 삼각주를 하나의 긴 생활권으로 연결한 대하천이다. 사막의 강수량이 적은 환경에서 강의 물과 범람원은 농업·취락·교역·통치의 기초가 되었다. 그러나 강의 실재와 고대 각 시대의 정확한 하도·분류 수로는 서로 다른 지리 증거이다."},
      {title:"계절적 범람과 충적토 · 풍요의 조건과 한계",body:"고대의 연례 범람은 상류 유역의 계절 강우와 연결되어 경작지를 적시고 비옥한 퇴적물을 남겼다. 이집트 사람들은 범람원과 분지 관개를 활용하여 물을 저장하고 농사를 지었다. 범람이 낮으면 경작과 식량 확보가 어려워질 수 있고 지나치게 높으면 거주지와 농지에 피해가 생길 수 있었다. 나일의 선물을 인간의 물 관리나 기근의 위험이 없는 자동적 풍요로 묘사해서는 안 된다."},
      {title:"남쪽의 좁은 계곡과 북쪽의 넓은 삼각주",body:"상이집트는 남쪽 상류의 좁은 나일 계곡이고 하이집트는 북쪽 하류의 넓은 삼각주이다. 두 이름의 상·하는 지도의 위아래가 아니라 강의 흐름과 고도에 따른다. 사막과 경작지의 대비는 이집트의 공간 구조를 이해하게 하지만, 모든 시대의 행정 경계나 정치적 영토를 하나의 고정된 자연지형으로 만들 수는 없다."},
      {title:"강물과 바람이 만든 남북 교통축",body:"나일의 북향 흐름은 하류 방향 이동에 유리했고, 흔한 북풍은 상류로 항해하는 돛배에 도움이 되었다. 이런 조건은 도시·농산물·인력과 물자가 계곡을 따라 연결되는 배경이다. 실제 항행은 계절 수위, 강의 지류와 여울, 선박의 종류에 영향을 받았으며 특정 족장이나 이스라엘 공동체가 이용한 선로를 이 일반 원리만으로 확정할 수는 없다."},
      {title:"출애굽기 1–2장 · 억압과 보존의 현장",body:"출애굽기 1:22에서 바로는 히브리 남아를 강에 던지라고 명령한다. 2:3–5에서 모세는 강가 갈대 사이에 놓인 갈대 상자 안에서 발견된다. 같은 수계가 죽음의 명령이 실행되는 공간이면서 한 아이의 생명이 보존되는 서사적 배경으로 등장한다. 이 대조는 본문에 근거한 문학적 관찰이며, 모세의 발견 장소를 현대 지도상의 특정 지점으로 결정하지 않는다."},
      {title:"출애굽기 7장 · 물을 지배하시는 하나님",body:"출애굽기 7:15–25에서 나일의 물이 피로 변하는 표적은 이집트 생활을 떠받친 수계 자체가 심판의 장이 되는 사건이다. 이것은 이집트의 특정 신 한 명과 일대일로 대응시켜야만 설명되는 사건이 아니다. 본문의 직접 강조는 하나님이 바로 앞에서 자신의 말씀과 권능을 나타내신다는 데 있으며, 하천의 실제 지리와 사건의 신학적 의미를 구분해 읽어야 한다."},
      {title:"원어 · 여오르(יְאֹר)의 문맥별 의미",body:"출애굽기에서 나일을 가리키는 대표적인 히브리어는 יְאֹר(여오르, yəʾōr)이다. 이 단어는 문맥에 따라 강이나 수로를 가리킬 수 있으므로 모든 출현을 하나의 정확한 현대 하천 구간으로 기계적으로 고정하지 않는다. 출애굽기 1:22, 2:3–5, 7:15–25에서는 이집트의 나일 수계가 분명한 배경이다. 어원은 이집트어와의 연관이 논의되지만 여기서 확정적인 파생형을 주장하지 않는다."},
      {title:"더 깊은 연구 · 시대별 물길과 지도 권위",body:"고대 나일의 분류 수로와 범람 환경은 장기간 변했다. 강이 남에서 북으로 흐른다는 큰 지리적 사실과, 모세 시대의 삼각주 지류·갈대밭·왕궁 인근 강변의 정확한 좌표는 별개의 주장이다. 현대 위성지도의 수로를 고대 출애굽의 확정 경로로 옮기지 않고, 본문이 직접 지시하는 강, 수문 지리의 넓은 배경, 후대 복원 가설을 나누어 표시한다."}
    ],
    "landform.nile_delta":[
      {title:"한눈에 보기 · 살아 움직이는 하류 지형",body:"나일 삼각주는 강이 지중해로 들어가기 전에 여러 갈래로 퍼지며 퇴적물을 쌓아 형성한 넓은 충적 지형이다. 하이집트의 핵심 자연지형이지만 하이집트 전체와 정확히 같은 경계의 대상은 아니다. 강줄기·습지·해안선은 시대에 따라 바뀌었으므로 단일한 고대 지도 윤곽을 확정해서는 안 된다."},
      {title:"분류 수로·충적토·습지의 결합",body:"상류에서 내려온 물과 퇴적물은 낮은 평야에서 수로와 경작지를 형성했다. 수로 주변의 물·토양은 농경과 정착을 가능하게 했고, 저습지와 갈대밭은 별도의 생활 환경을 제공했다. 범람의 규모와 수로 유지 상태가 변하면 정착의 조건도 달라진다. 비옥한 땅이라는 설명만으로 특정 성경 사건의 위치를 재구성할 수 없다."},
      {title:"고대 지류와 현대 지도는 일치하지 않는다",body:"고대 삼각주에는 오늘날과 다른 분류 수로와 해안선이 존재했다. 역사 기록과 퇴적·지형 연구는 물길의 이동과 소멸을 보여 주지만 모든 시기의 지류를 같은 정밀도로 복원할 수 있는 것은 아니다. 현재의 강줄기 두 갈래를 고대의 전체 수계라고 보거나 고대 지류를 GPS 정확도의 선형으로 그리는 것은 위험하다."},
      {title:"고센과 동부 삼각주의 관계",body:"창세기 45:10, 46:28–34, 47:1–6은 요셉과 야곱 가족의 고센 거주를 이야기한다. 고센은 일반적으로 동부 삼각주 환경과 연결되지만 삼각주라는 지형 단위와 고센이라는 성경의 거주 지역은 동일한 엔티티가 아니다. 고센(גֹּשֶׁן, 고셴)의 어원·정확한 고고학적 위치·경계는 이 지형 연구만으로 확정하지 않는다."},
      {title:"와디 투밀라트 · 동쪽과 연결되는 지형 회랑",body:"동부 삼각주의 와디 투밀라트는 이집트에서 시나이와 레반트 방향으로 이어지는 이동·교역의 지리적 논의에 중요한 골짜기이다. 일부 연구는 고센이나 비돔의 위치 문제와 이 지역을 연결하지만, 골짜기 전체를 성경의 고센이나 출애굽 경로로 확정하는 것은 별도의 고고학·문헌 증거가 필요하다. 위치 후보와 확정 장소를 분리한다."},
      {title:"출애굽기 1–2장의 강과 갈대",body:"출애굽기 1:22와 2:3–5는 강과 갈대 사이에서 벌어지는 생명 위협과 모세의 보존을 서술한다. 삼각주 같은 하류 습지 환경은 갈대와 수로가 많은 이집트의 자연 배경을 이해하도록 돕는다. 그러나 본문이 모세를 발견한 장소를 삼각주의 특정 지류로 명시한다고 주장할 수는 없다."},
      {title:"시대별 교통과 정착 · 자료의 한계",body:"분류 수로와 평야는 물자 운송과 취락을 연결했지만 해안선과 강줄기의 변화는 항구·도시·농지의 상대적 위치를 바꾸었다. 한 시대에 존재한 운하나 도시를 족장 시대에 그대로 소급해서는 안 된다. 동부 삼각주의 유적은 고대 사회의 역사적 배경을 보여 줄 수 있어도 개별 성경 인물의 체류를 독립적으로 증명하지는 않는다."},
      {title:"더 깊은 연구 · 지형·장소·사건의 세 증거 층위",body:"첫째, 삼각주는 넓은 충적 지형으로 확인되는 물리적 실재이다. 둘째, 고센·비돔·라암셋 등 성경 지명과 고대 유적의 연결은 별도의 역사 지리 논증이다. 셋째, 요셉 가족의 정착과 출애굽 사건은 성경의 서사적 증언이다. 세 층위를 한 점이나 하나의 고정 경계로 합치지 않는 것이 지리 Reader와 지도 모두의 정확성을 지킨다."}
    ],
    "hydro.nile_cataracts":[
      {
        "title": "한눈에 보기 · 나일의 급류 지대",
        "body": "나일 급류 지대(Nile Cataracts)는 한 곳에 떨어지는 거대한 폭포가 아니라 강바닥의 암반과 바위섬, 좁아지는 물길이 만들어 낸 여러 급류·여울 구간의 체계이다. 전통적으로 나일의 주요 급류 지대 여섯 곳을 구분하며, 제1급류는 아스완 남쪽 일대에 있다. 이 수문 지형은 이집트와 누비아를 잇는 강이 동시에 이동을 어렵게 만드는 자연 장벽이기도 했다는 사실을 보여 준다."
      },
      {
        "title": "암반과 물살 · 항행이 어려워지는 이유",
        "body": "평탄한 하류의 강길과 달리 급류 구간에서는 단단한 암반이 수면 가까이 드러나고 물길이 좁아지거나 갈라진다. 강의 수위와 계절에 따라 위험한 여울, 소용돌이, 얕은 수로가 달라지므로 배가 늘 같은 방식으로 통과할 수는 없었다. 일부 구간에서는 선박이나 화물을 육로로 옮기는 방식이 필요했을 가능성이 있지만, 모든 시대와 급류에 하나의 운송 방식을 강제해서는 안 된다."
      },
      {
        "title": "제1급류와 아스완 · 관문이지만 영구 국경은 아니다",
        "body": "아스완 부근의 제1급류는 전통적으로 이집트의 나일 계곡과 남쪽 누비아 세계를 구별하는 중요한 지리적 기준으로 설명된다. 그러나 자연 장애물과 정치적 국경은 같지 않다. 이집트의 왕조들은 시대에 따라 남쪽으로 영향력을 확대하거나 후퇴했으며, 제1급류가 언제나 절대적 국경선으로 기능한 것은 아니다. 현대 댐과 저수지로 바뀐 수문 환경을 고대의 강 모습으로 그대로 옮길 수도 없다."
      },
      {
        "title": "누비아의 강길 · 교역과 교류의 제약",
        "body": "급류가 강 항행을 방해했다는 사실은 이집트와 누비아가 단절되어 있었다는 뜻이 아니다. 강변의 정착지와 육상 이동로는 사람·상품·기술·문화가 오가는 통로가 되었다. 누비아의 자원과 교역, 왕국들과 이집트의 관계는 시대에 따라 달라졌고 때로는 군사적 충돌도 일어났다. 이 지리 연구는 교류의 환경을 설명할 뿐 특정 성경 사건의 실제 교역 노선을 증명하지 않는다."
      },
      {
        "title": "급류의 연속성과 차이 · 하나의 점으로 표현할 수 없다",
        "body": "제1급류만이 아니라 더 남쪽의 여러 급류는 서로 떨어진 강 구간에 분포한다. 각각의 암반 지형과 주변 정착 환경이 달라 ‘나일 급류 지대’를 하나의 폭포 좌표나 짧은 단일 선으로 표시하는 것은 부정확하다. 특히 일부 역사적 지형은 현대 수력 시설과 저수지의 영향으로 크게 달라졌다. 개별 급류의 고대 모습과 구간별 위치를 표시하려면 별도 시대·지도 근거가 필요하다."
      },
      {
        "title": "성경의 남쪽 지평 · 수에네와 구스",
        "body": "에스겔 29:10의 ‘수에네’와 ‘구스의 경계’는 이집트에 대한 예언이 남쪽의 지리적 지평을 포함한다는 점을 보여 준다. 이사야 18:1–2 역시 구스와 강을 배경으로 먼 지역을 말하지만, 특정 나일 급류 번호나 확정 항로를 명시하지 않는다. 따라서 본문이 말하는 남쪽 권역과 현대 지리학이 구분한 급류 체계를 연결하되, 두 본문이 제1·제2급류의 정확한 좌표를 제공한다고 주장하지 않는다."
      },
      {
        "title": "용어의 구분 · cataract는 성경 지명이 아니다",
        "body": "영어 cataract(캐터랙트)는 여기서 급류·여울 지형을 가리키는 지리학적 용어이다. 창세기의 나일이나 출애굽기의 강을 지칭하는 히브리어 יְאֹר(여오르, yəʾōr)와 동일한 고유지명이나 직역 표현이 아니다. ‘나일’이라는 수계, ‘수에네’라는 남쪽 장소 언급, ‘급류’라는 지형 범주를 분리하면 원어의 범위를 과장하지 않으면서 지리적 배경을 설명할 수 있다."
      },
      {
        "title": "더 깊은 연구 · 지도와 증거의 세 층위",
        "body": "첫째, 아스완 부근 제1급류와 누비아를 따라 이어지는 급류 체계는 실제 지형으로 연구할 수 있다. 둘째, 시대별 강 수위와 항행 조건, 고대 경계의 정치적 의미는 역사 자료에 따라 달라진다. 셋째, 성경의 구스·수에네 언급과 급류의 직접 대응은 별도의 본문·지리 논증을 요구한다. 이 세 층위를 구별하여 광역 설명은 제공하되 새로운 단일 marker나 권위 있는 경로 선형은 만들지 않는다."
      }
    ],
    "geo.levant":[
      {title:"한눈에 보기 · 여러 세계가 만나는 동지중해",body:"레반트(Levant)는 고대의 한 나라 이름이 아니라 지중해 동쪽 해안과 그 배후에 이어지는 넓은 지리·문화권을 가리키는 현대 학술 용어이다. 시리아와 레바논, 남부의 가나안 지역을 포함하지만 연구자가 채택한 범위에 따라 요르단 내륙이나 더 북쪽의 지역까지 포괄하기도 한다. 이집트와 메소포타미아·아나톨리아 사이에 놓였다는 위치는 이곳을 이동과 만남의 공간으로 만들었다. 그러나 레반트 전체를 한 시대의 국가나 현대 국경선과 동일시할 수는 없다."},
      {title:"산과 해안, 내륙이 만든 다양한 지형",body:"레반트의 지형은 하나의 평탄한 길이 아니다. 지중해 해안의 좁거나 넓은 평야, 레바논과 안티레바논 산지, 시리아 내륙의 평원과 건조 지대, 남부의 산지와 요단 동편 고원이 서로 다른 이동 조건을 만든다. 해안에 가까워도 산맥이 가로막는 곳이 있고, 내륙으로 들어가려면 고개와 골짜기를 찾아야 하는 곳이 있다. 물과 농경지는 지역마다 불균등하며 강수와 정착의 차이도 크다. 성경의 이동 장면을 읽을 때 거리만이 아니라 이러한 지형적 제약을 고려해야 한다."},
      {title:"‘육상 교량’의 의미 · 연결은 선택적인 회랑을 따라 이루어진다",body:"레반트를 ‘육상 교량(land bridge)’이라고 부르는 것은 이집트와 북부 시리아·메소포타미아 사이에 사람과 물자, 군대와 사상이 이동할 수 있었음을 설명하는 기능적 표현이다. 그렇다고 모든 곳이 통행하기 쉬웠다는 뜻은 아니다. 남부 레반트의 갈멜 산지 부근 와디 아라 통로와 므깃도 일대는 해안에서 이스르엘 평야로 이어지는 중요한 관문이었으며, 북부에서는 여러 산악 통로가 해안과 내륙을 이어 주었다. 특정 성경 인물이 실제로 어느 고개를 넘었는지는 별도 증거가 필요하다."},
      {title:"육로와 바닷길 · 교역의 두 층위",body:"레반트의 연결성은 육로만으로 설명되지 않는다. 비블로스·시돈·두로 같은 해안 도시들은 지중해 항해와 목재·금속·직물 등의 교환에 참여했고, 시리아 해안의 우가리트는 항구와 동쪽 산악 통로를 함께 이용할 수 있는 입지에 있었다. 육상 회랑과 항구는 서로 경쟁하기만 한 것이 아니라 물품을 내륙으로 보내고 바다 건너로 옮기는 복합망을 이루었다. 다만 철기시대 페니키아의 해상 네트워크를 아브람 시대의 교통 조건과 완전히 같은 것으로 소급해서는 안 된다."},
      {title:"창세기 · 가나안은 레반트와 같은 단어가 아니다",body:"창세기 12:5–7에서 아브람이 들어간 곳은 ‘가나안 땅’이다. 히브리어 כְּנַעַן(크나안, Kənaʿan)은 성경의 특정 지역·사람과 약속의 문맥에 속하며 현대 학술 명칭인 ‘레반트’의 직역이 아니다. 창세기 15:18은 유프라테스를 약속의 지리적 지평 안에 언급하지만 그 문장을 모든 성경 시대에 통용되는 정치 국경 측량도로 바꾸어서는 안 된다. 넓은 레반트 지리는 족장 가족의 이동 배경을 이해하게 하지만, 하나님이 주신 약속의 내용과 땅의 경계에 대한 각 본문의 표현은 그대로 구별해 읽어야 한다."},
      {title:"왕국과 제국의 시대 · 같은 땅의 다른 역할",body:"이스라엘과 유다의 왕국 시대에 레반트의 여러 도시와 왕국은 이집트·앗수르·바빌로니아 같은 세력의 외교와 군사 이동에 영향을 받았다. 두로와 솔로몬의 교역 관계는 열왕기상 5장에서 구체적으로 드러나며, 열왕기하 17장은 앗수르 제국의 팽창과 북이스라엘의 멸망을 기록한다. 같은 지리권이라도 족장 시대에는 이동과 정착의 배경, 왕국 시대에는 교역과 외교의 공간, 제국 시대에는 정복과 포로 이동의 통로로 기능할 수 있다. 시대를 지운 하나의 지도만으로 모든 사건을 설명해서는 안 된다."},
      {title:"원어와 명칭 · 지리 범주를 섞지 않기",body:"레반트는 성경 히브리어의 단일 고유지명이 아니라 후대의 지역 명칭이다. 가나안(כְּנַעַן, 크나안), 아람(אֲרָם, 아람), 레바논(לְבָנוֹן, 레바논)은 서로 다른 성경 표현이며 각각의 본문에서 가리키는 사람·지역·산지의 범위를 확인해야 한다. 아람을 현대 시리아 전체와, 레바논을 현대 레바논 국가의 국경과, 가나안을 남부 레반트 전체의 불변 명칭과 곧바로 일치시키면 시대와 문맥이 사라진다. 원어는 구체적 본문 의미를 밝히는 데 사용하되 현대 지도 명칭을 거꾸로 증명하는 도구로 쓰지 않는다."},
      {title:"더 깊은 연구 · 공간 관계와 지도 권위의 한계",body:"‘레반트’라는 광역 지리권이 있다는 사실, 남북 이동을 연결하는 육상 회랑이 있었다는 해석, 특정 왕이나 족장 일행이 한 노선을 이용했다는 주장은 증거 수준이 다르다. 므깃도·와디 아라처럼 잘 알려진 관문도 모든 시대의 모든 여정이 그곳을 통과했다는 증거가 되지 않는다. 레반트의 넓은 범위는 설명할 수 있지만 정확한 시대별 정치 경계와 고대 도로 선형은 추가 검증이 필요하다. JudeBible은 기존 광역 지리 identity와 본문 관계를 유지하고 새 좌표·폴리곤·확정 경로를 만들지 않는다."}
    ],
    "geo.syria":[
      {title:"한눈에 보기 · 북부 레반트의 내륙 관문",body:"시리아는 레반트 북부에서 지중해 해안과 내륙 평야·산지·건조 지대가 이어지는 넓은 역사 지리적 배경이다. 이 지역은 북쪽의 아나톨리아, 동쪽의 유프라테스와 메소포타미아, 남쪽의 가나안과 연결되지만 하나의 고정된 자연 지형이나 고대 왕국으로 환원되지 않는다. 현대 시리아 국가의 경계는 이 Reader가 설명하는 고대의 시리아권과 정확히 일치하지 않는다. 성경에서 중요한 것은 아람의 여러 정치 세력과 족장들의 친족 지역, 후대 제국의 이동을 각각 그 시대에 맞게 읽는 일이다."},
      {title:"해안과 내륙을 가르는 산지 · 통로의 선택",body:"북부 레반트에는 지중해와 나란히 이어지는 산지, 내륙으로 열린 분지와 고개, 유프라테스 쪽으로 향하는 넓은 지형적 연결이 공존한다. 산은 이동을 막는 장벽이지만 통과할 수 있는 골짜기와 고개는 교역과 도시 성장의 결절점이 된다. 시리아 해안의 우가리트는 서쪽 항구와 동쪽 내륙으로 이어지는 산악 통로를 함께 활용한 사례이다. 이런 지형은 해상 교역과 육상 교통이 만나는 조건을 설명하지만 성경 인물의 정확한 여행길을 결정하지는 않는다."},
      {title:"유프라테스와 내륙 회랑 · 물과 정착",body:"시리아 내륙의 정착과 교역은 유프라테스 방향의 강 유역, 오아시스, 계절성 물길과 관련된다. 알레포와 하맛, 다메섹처럼 서로 다른 환경에 놓인 도시들은 북쪽과 남쪽, 해안과 내륙의 교통망에서 시대별로 중요한 역할을 했다. 호름스 부근의 내륙 통로와 팔미라 방향의 건조 지대 길은 북부 레반트의 이동이 단일한 해안도로에 한정되지 않았음을 보여 준다. 다만 후대 로마 시대의 팔미라 교역망을 족장 시대의 확정 경로로 소급하지 않는다."},
      {title:"기후와 농경 · 같은 시리아 안의 큰 차이",body:"해안과 산지의 일부는 지중해성 겨울 강수의 영향을 받지만, 내륙으로 갈수록 강수량과 경작 조건이 크게 달라진다. 강 주변의 농경지, 목축이 가능한 스텝, 관개나 우물에 의존하는 취락이 서로 다른 생활 방식을 낳았다. 이런 환경은 도시와 촌락, 이동하는 목축 집단 사이의 교환 관계를 이해하게 한다. 그러나 특정 성경 시대의 기근이나 가족 이동의 이유를 기후 자료 하나로 확정할 수 없고, 모든 시리아권을 균일한 비옥한 평야로 그려서도 안 된다."},
      {title:"아람의 원어와 족장 서사 · 지명의 층위",body:"성경 히브리어 אֲרָם(아람, ʾAram)은 아람 사람들과 여러 지역·정치 공동체를 가리키는 명칭이다. 창세기 24:10의 아람 나하라임(אֲרַם נַהֲרַיִם, 아람 나하라임)과 창세기 28:2의 밧단아람은 족장들의 친족 관계와 북부 이동을 이해하는 중요한 표현이다. 그러나 두 지명을 현대 시리아 국가 전체와 동일시하거나, 아람 나하라임의 ‘두 강’을 현재 지도상의 정확한 두 수로로 단정해서는 안 된다. 지명은 본문에 따라 특정 범위를 갖는다."},
      {title:"왕국 시대 · 아람 다메섹과 이스라엘의 관계",body:"사무엘하 8:5–6은 다메섹 아람 사람들과 다윗의 충돌을 기록한다. 열왕기하 5:1에서 나아만은 아람 왕의 군대 장관으로 등장하고, 이사야 7:1에서는 아람 왕 르신이 유다를 위협하는 정치적 문맥이 제시된다. 이 본문들은 같은 ‘아람’이라는 이름을 쓰더라도 왕국의 관계, 인물의 행동, 예언의 메시지를 서로 다른 각도에서 보여 준다. 북부 레반트라는 지리적 배경은 사건을 이해하게 하지만 각 사건의 역사적 경계와 정확한 군대 이동선은 따로 검증해야 한다."},
      {title:"후대 제국과 도시의 변화 · 시대를 구분하기",body:"시리아 지역의 도시는 청동기시대 교역망, 철기시대 아람 왕국들, 앗수르·바빌로니아의 팽창, 헬레니즘·로마 시대의 도시 체계 속에서 서로 다른 기능을 가졌다. 우가리트의 항구와 팔미라의 대상 교역은 서로 다른 시대의 사례이므로 하나의 고대 시리아 무역망으로 뭉뚱그릴 수 없다. 성경이 언급하는 아람의 정치사와 후대의 ‘시리아’라는 지역 명칭도 구분해야 한다. 지형의 지속성과 국가·도시의 변화는 별도의 시간축에서 읽어야 한다."},
      {title:"더 깊은 연구 · 아람, 시리아, 지도 경계",body:"시리아라는 광역 지리권의 일반적인 위치, 아람 다메섹의 역사적 실재, 창세기의 아람 나하라임을 동일한 한 점으로 그릴 수는 없다. 고대 지명들의 대응 범위와 정치적 영향력은 본문·문헌·고고학에 따라 다르게 판단된다. 현대 국경이나 현재 도로, 후대의 교역 중심지를 그대로 성경 시대의 확정 공간으로 만들면 지리 연구가 본문을 왜곡한다. 이 Reader는 기존 북부 레반트 foundation identity와 성경 본문을 설명으로 연결하되 신규 확정 좌표·경계·여정 노선을 추가하지 않는다."}
    ],
    "geo.lebanon":[
      {title:"한눈에 보기 · 산과 바다가 마주한 레바논",body:"레바논은 동지중해 연안에 높은 산지와 좁은 해안 공간이 나란히 놓인 지리권이다. 해안의 도시들과 산지의 숲·골짜기, 동쪽의 내륙 통로는 서로 다른 생활 환경을 형성했다. 성경의 레바논은 때로 산지와 백향목의 원산지로, 때로 북쪽 지리적 지평으로 등장한다. 이 이름을 오늘날 레바논 공화국의 국경과 자동 동일시하거나 고대 페니키아의 모든 도시·문화권을 하나의 국가로 묶는 것은 정확하지 않다. 산지와 해안의 결합이 이 지역의 역사적 중요성을 설명하는 출발점이다."},
      {title:"산맥과 강수 · 목재가 자란 환경",body:"레바논 산맥은 동지중해의 습한 공기가 상승하면서 비와 눈을 내리게 하는 지형적 조건을 갖는다. 고도가 높아지면 기온과 식생이 달라지고, 산지에는 백향목을 비롯한 수목이 자랄 수 있는 환경이 형성된다. 해안과 산악의 강수 차이, 계곡의 샘과 계절성 물길은 정착과 농경의 조건에도 영향을 주었다. 그러나 오늘날 남은 숲의 분포를 솔로몬 시대의 산림 면적이라고 단정할 수 없으며, 성경에 나오는 모든 목재를 한 종류의 나무로 환원해서도 안 된다."},
      {title:"좁은 해안과 항구 도시 · 교역의 이유",body:"레바논의 해안 도시들은 산과 바다 사이에 놓인 제한된 농경 공간을 배경으로 해상 교역을 발전시켰다. 비블로스·시돈·두로는 각기 다른 역사와 정치적 이해를 가진 도시였으며, 이 도시들을 무조건 단일한 페니키아 국가로 생각해서는 안 된다. 목재와 공예품, 염료와 식량이 교환되는 지중해 네트워크는 항구와 내륙의 관계를 강화했다. 다만 페니키아의 가장 넓은 해상 진출을 족장 시대의 교역 상황에 그대로 적용하는 것은 시대착오이다."},
      {title:"솔로몬과 히람 · 목재의 이동과 성전 건축",body:"열왕기상 5장에서 솔로몬은 두로 왕 히람에게 레바논의 백향목을 베어 달라고 요청한다. 이 장면에는 산림 자원만이 아니라 숙련된 벌목 노동, 해상 운송, 식량 공급과 왕국 간 협력이 함께 등장한다. 사무엘하 5:11도 히람이 다윗에게 백향목과 기술자를 보냈다고 기록한다. 레바논의 산과 해안은 이 교류가 가능했던 지리적 배경을 보여 주지만, 성전 건축에 사용된 모든 통나무의 벌목 지점이나 운송 경로를 정확한 지도 선으로 복원할 근거는 아니다."},
      {title:"두로의 배와 에스겔 27장 · 세계 교역의 시적 묘사",body:"에스겔 27장은 두로를 화려한 배에 비유하면서 레바논의 백향목을 돛대 재료로 언급한다(27:5). 이 시적 장면은 두로의 해상 교역과 부를 드러내는 동시에 그 교만과 몰락을 선포하는 예언의 일부이다. 레바논의 목재와 두로의 해양 경제는 역사 지리적 배경으로 이해할 수 있지만, 에스겔의 비유를 실제 한 선박의 기술 도면이나 고대 교역량의 정확한 통계로 읽어서는 안 된다. 지리적 사실과 예언 문학의 수사적 기능을 함께 보존해야 한다."},
      {title:"백향목의 상징 · 강함과 높음의 양면성",body:"시편 92:12는 의인이 레바논의 백향목처럼 성장한다고 말하고, 이사야 2:13은 높고 솟은 레바논의 백향목을 하나님의 심판 문맥에서 언급한다. 같은 나무의 웅장함이 한 본문에서는 번성의 비유, 다른 본문에서는 인간의 높아짐을 겨냥하는 심판 이미지가 될 수 있다. 레바논의 숲이라는 실제 자연환경을 이해하면 이 비유의 감각이 살아나지만, 두 구절을 같은 신학적 평가로 합치거나 나무 자체에 고정된 상징 하나만 부여해서는 안 된다."},
      {title:"원어 · 레바논의 이름과 의미 범위",body:"히브리어 לְבָנוֹן(레바논, Ləḇānôn)은 성경에서 레바논 산지 또는 그와 관련된 북쪽 지역을 가리킨다. ‘희다’와 관련된 어원 설명이 제안되며 눈 덮인 산지와 연결하기도 하지만, 어원 가설만으로 성경의 모든 용례가 눈이나 특정 산봉우리를 뜻한다고 확정할 수 없다. 백향목은 אֶרֶז(에레즈, ʾerez)로 표현되며 문맥에 따라 나무와 목재를 가리킨다. 지명·나무 명칭·후대 지리학의 산맥 분류를 각각 구별해야 본문을 정확하게 읽을 수 있다."},
      {title:"더 깊은 연구 · 산지·도시·국가를 구분하는 지도",body:"레바논 산지라는 자연지리, 두로·시돈 같은 고대 도시의 실제 위치, 페니키아라는 문화·교역권, 현대 레바논의 국가 경계는 서로 겹치지만 동일한 대상이 아니다. 산악 고도와 해안의 일반적인 지형은 확인할 수 있어도 성경 시대의 산림 범위, 벌목 지점, 왕국별 국경, 솔로몬의 목재 운송 항로는 각기 다른 증거가 필요하다. JudeBible에서는 기존 레바논 광역 identity와 관련 본문 설명을 유지하며 새로운 확정 점·경계·고대 항로를 생성하지 않는다."}
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
