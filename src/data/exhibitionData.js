// 《167次-勝興》舊山線線上策展資料集
// 嚴格對應 13 個核心物件（地圖互動物件與「02. 沿線圖鑑」完全同源、僅收錄此 13 項）
// 圖片檔案上傳至 /public/images/ 後會自動套用，且同時支援 .png 與 .jpg 格式

import shengxingNightImg from '../assets/images/shengxing_night_station_1795101028819.jpg';
import longtengBridgeImg from '../assets/images/longteng_bridge_mist_1795101010969.jpg';
import juguangTrainImg from '../assets/images/juguang_train_167_1795101008541.jpg';
import mountainTunnelImg from '../assets/images/old_mountain_tunnel_1795101010490.jpg';

export const EXHIBITION_IMAGES = {
  shengxingNight: shengxingNightImg,
  longtengBridge: longtengBridgeImg,
  juguangTrain: juguangTrainImg,
  mountainTunnel: mountainTunnelImg,
};

export const NAV_ITEMS = [
  {
    id: 'explore',
    index: '01',
    label: '探索舊山線',
    subtitle: '1998.09.23 21:10 末班車與山線軌跡',
  },
  {
    id: 'archive',
    index: '02',
    label: '沿線圖鑑',
    subtitle: '舊山線13個景點與鐵道設施介紹',
  },
  {
    id: 'about',
    index: '03',
    label: '關於本展',
    subtitle: '策展論述與製作團隊',
  },
  {
    id: 'links',
    index: '04',
    label: '勝興連結',
    subtitle: '地方聚落與走讀資源',
  },
];

/**
 * 舊山線 11 個定位於地圖軌跡上的可點擊物件（加上第 12 項畫面中心移動列車、第 13 項右下角電氣閉塞器，共計 13 項）
 * 座標基準：0% = 北端三義站，100% = 南端豐原站（勝興核心位於 36%）
 * 所有項目皆可點擊開啟對應彈出視窗，且無任何未指定的額外物件。
 */
export const MAP_OBJECTS = [
  // --- ① 三義車站 ---
  {
    id: 'sign-sanyi',
    name: '三義車站',
    shortName: '三義',
    type: 'signpost',
    kmMark: 'K159+600',
    elevation: 302.0,
    elevationStr: '302.0m',
    isFocal: false,
    hasStory: true,
    isSignpost: true,
    prevStation: '銅鑼',
    nextStation: '勝興',
    portraitPos: { x: 26.0, y: 1.5 },
    landscapePos: { x: 1.5, y: 34.0 },
    mapIcon: 'sign_sanyi.png',
    image: 'scene_st_sanyi.jpg',
    fallbackImage: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '三義站牌與舊山線北端攀坡起點景致',
    summary: '舊山線北端起點，海拔 302.0 公尺。列車於此切入千分之二十五連續陡坡。',
    detail: '自三義站南下後，單線軌道隨山勢蜿蜒攀升，為進入關刀山隘口的序幕。',
    story:
      '原名「三叉河驛」的三義站，是舊山線攀登關刀山脈的北端起點。由苗栗平原南下的列車在此進入千分之二十五（每千公尺爬升 25 公尺）的連續陡坡。昔日蒸汽機關車牽引繁重客貨車時，常需在此加掛後連「補機」協力推升，直到勝興高點才解聯。1998 年新山線完工啟用後，三義新站改建為高架跨線大站，舊山線的慢行爬坡記憶就此封存。',
    walkingTip:
      '自三義新站出站後步行約 10 分鐘可抵達水美木雕街；站在舊山線跨線陸橋上，能遠眺當年單線軌道分岔切入山林的歷史路基。',
    source: '《臺灣總督府鐵道部年報》、交通部臺灣鐵路管理局《鐵道工務歷史月刊》、三義鄉誌。',
  },

  // --- ⑦ 折返式軌道與加掛補機 ---
  {
    id: 'switchback-track',
    name: '折返式軌道與加掛補機',
    shortName: '折返軌道',
    type: 'track',
    kmMark: 'K164+400',
    elevation: 400.5,
    elevationStr: '400.5m',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 26.0, y: 26.5 },
    landscapePos: { x: 26.5, y: 34.0 },
    mapIcon: 'icon_sx_switchback.png',
    image: 'scene_sx_switchback.jpg',
    fallbackImage: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '勝興車站北側折返式安全側線與加掛補機推拉情境',
    summary: '全台少見的千分之二十五避難防衝軌道，保護北上南下列車避免煞車不及釀災。',
    detail: '在勝興站北端分岔出長約 400 公尺的爬坡逆向引道，為極罕見的工程遺跡。',
    story:
      '勝興站座落於連續千分之二十五大陡坡的分水嶺鞍部。昔日蒸汽火車由三義爬坡北上，若進站馬力不足或停靠後難以再起步，常需加掛補機協力推升，或退入站外折返側線重整動力；而列車若煞車失靈，站務員可緊急扳轉道岔，引導列車衝上依山勢向上鋪設的「折返式安全斜坡」，利用重力自然減速止衝，展現明治時代因應險峻地形的智慧。',
    walkingTip:
      '出勝興站剪票口後，沿著第一股道鐵軌向北走約 250 公尺，即可見到明顯向右上方山壁斜衝的雜草鐵軌與轉轍器連桿遺跡。',
    source: '臺灣鐵道文化研究會《臺灣舊山線鐵道工藝史調查》、行政院文建會歷史聚落研究。',
  },

  // --- ⑨ 海拔 402.326m 紀念碑 ---
  {
    id: 'elevation-monument',
    name: '海拔 402.326m 紀念碑',
    shortName: '海拔紀念碑',
    type: 'monument',
    kmMark: 'K164+620',
    elevation: 402.326,
    elevationStr: '402.326m',
    isFocal: true,
    hasStory: true,
    portraitPos: { x: 24.0, y: 33.0 },
    landscapePos: { x: 32.0, y: 66.0 },
    mapIcon: 'icon_sx_monument.png',
    image: 'scene_sx_monument.jpg',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '勝興車站月台北端之縱貫鐵路最高點石砌紀念碑',
    summary: '豎立在第一月台北側，銘刻縱貫線鐵路海拔四○二・三二六公尺分水嶺。',
    detail: '全線四百多公里縱貫軌道的極高點，列車至此越過山陵，開始奔向台中盆地。',
    story:
      '立於勝興第一月台北端的這座方柱石碑，正面刻有「臺灣鐵路最高點 海拔四○二・三二六公尺」，背面記載苗栗工務段於民國四十八年重新精測豎立之緣由。舊山線以此為分水嶺，由三義北上是漫長千分之二十五大陡坡，由此向南穿越二號開天隧道後則是連續下坡。每位抵達勝興的旅客與鐵道司機員，皆會在此感受征服險峻山嶺的歷史厚度。',
    walkingTip:
      '紀念碑旁緊依著昔日第二股道上方「路牌受動架」（金屬支架，用來掛取路牌套圈環）。建議由月台外側取景，可同時將紀念碑與背後的木造站房屋瓦一同入鏡。',
    source: '交通部臺灣鐵路管理局工務處歷史碑碣清冊、《鐵道情報》雜誌。',
  },

  // --- ⑥ 勝興木造車站 ---
  {
    id: 'shengxing',
    name: '勝興木造車站',
    shortName: '勝興',
    type: 'station',
    kmMark: 'K164+600',
    elevation: 402.326,
    elevationStr: '402.326m',
    isFocal: true,
    isCenter: true,
    hasStory: true,
    portraitPos: { x: 74.0, y: 36.0 },
    landscapePos: { x: 36.0, y: 34.0 },
    mapIcon: 'icon_sx_station.png',
    image: 'scene_sx_station.jpg',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '1998 年秋夜薄霧中的勝興木造車站與月台暖燈',
    summary: '臺灣縱貫線最高點（標高 402.326 公尺），建於 1906 年日式木造站房。',
    detail: '1998 年 9 月 23 日晚間 21:10，莒光 167 次南下列車最後一次在此交會停靠。',
    story:
      '勝興站建於 1906 年（明治 39 年），初名「十六份信號場」，1958 年更名勝興。整座站房以珍貴台灣檜木穿斗榫接建造，未用一根鐵釘；因四周被九座山峰環抱（地理師指為虎穴），屋簷特別雕飾八卦、尖矛形「虎牙」與鋸齒木雕以鎮煞。1998 年 9 月 23 日 21:10，莒光 167 次最後一次進站，月台聚集數百名鐵道迷與村民，在長鳴的汽笛中向九十年的山線日常揮淚道別。',
    walkingTip:
      '站房候車室保留日治時期售票窗口、木造時刻表板與站長室。傍晚天色漸暗、暖黃吊燈亮起時，站在空曠月台上最能重溫 1998 年秋夜的靜謐情懷。',
    source: '臺鐵局運務處《勝興車站營運沿革紀錄》、苗栗縣政府文化觀光局縣定古蹟評定清冊。',
  },

  // --- ② 勝興車站 ---
  {
    id: 'sign-shengxing',
    name: '勝興車站',
    shortName: '勝興',
    type: 'signpost',
    kmMark: 'K164+600',
    elevation: 402.326,
    elevationStr: '402.326m',
    isFocal: true,
    hasStory: true,
    isSignpost: true,
    prevStation: '三義',
    nextStation: '泰安',
    portraitPos: { x: 26.0, y: 38.5 },
    landscapePos: { x: 37.5, y: 66.0 },
    mapIcon: 'sign_shengxing.png',
    image: 'scene_shengxing.jpg',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '台鐵傳統白底藍字勝興月台站名牌（三義 ⇐ 勝興 ⇒ 泰安）',
    summary: '白底藍字傳統台鐵月台站牌，左右標示「三義 ⇐ 勝興 ⇒ 泰安」與海拔高度。',
    detail: '記錄著舊山線單軌時期的站序與距離，成為無數旅人駐足合影的經典地標。',
    story:
      '矗立在勝興月台上的白底藍字傳統燈箱站牌，上方印著「勝興」二字與英文拼音，兩側箭頭分別指向北端「三義」與南端「泰安」。對搭車經過舊山線的旅客而言，夜色中亮起微光的站牌，總是提醒著列車正停靠在台灣縱貫鐵路的最高點；1998 年停駛之後，這塊站牌仍靜靜佇立於月台，將三義與泰安之間的舊山線站距永遠留在記憶裡。',
    walkingTip:
      '沿著勝興車站月台漫步，可尋找復刻與保留下來的傳統站名牌與海拔標示牌，站在鐵道旁將站牌與後方山嵐一起拍進畫面。',
    source: '臺鐵局運務處站名牌標準圖面、勝興車站現場文史踏查紀錄。',
  },

  // --- ⑪ 軋日機 ---
  {
    id: 'dater-machine',
    name: '軋日機',
    shortName: '軋日機',
    type: 'dater',
    kmMark: 'K164+630',
    elevation: 402.326,
    elevationStr: '402.326m',
    isFocal: true,
    hasStory: true,
    portraitPos: { x: 75.0, y: 42.0 },
    landscapePos: { x: 42.5, y: 66.0 },
    mapIcon: 'icon_sx_dater.png',
    image: 'scene_sx_dater.png',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '台鐵名片式硬票與售票口軋日機壓印情境',
    summary: '台鐵售票窗口不可或缺的重型鑄鐵軋日機，可壓印 87.09.23 或今日日期。',
    detail: '點擊開啟軋日儀式，親手重壓油墨鋼印，一鍵合成並下載專屬 167 次車票 PNG。',
    story:
      '在電腦售票尚未全面普及的年代，台鐵各級車站售票口皆擺放著一台厚重的鑄鐵「軋日機」。當旅客買妥名片式硬紙車票，售票員將票面俐落塞入機槽、下壓把手，「喀鏘」一聲便在票角壓印出清晰凹陷的民國年月日鋼印。1998 年 9 月 23 日晚間，勝興車站售票窗前大排長龍，只為求得一張軋上「87.09.23」的末班車硬票，成為舊山線最珍貴的實體記憶。',
    walkingTip:
      '造訪勝興車站木造候車室時，可留意保留下來的售票木窗與票櫃陳設；也可在本站「探索舊山線」地圖上點擊勝興旁的軋日機，親手壓印並收藏一張專屬的 167 次紀念車票。',
    source: '國家鐵道博物館籌備處館藏名片式硬票文物檔案、臺鐵局運務處售票規章。',
  },

  // --- ⑩ 樟腦寮 ---
  {
    id: 'camphor-lodge',
    name: '樟腦寮',
    shortName: '樟腦寮',
    type: 'heritage',
    kmMark: 'K164+800',
    elevation: 410.0,
    elevationStr: '410.0m',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 74.0, y: 29.5 },
    landscapePos: { x: 43.0, y: 34.0 },
    mapIcon: 'icon_sx_camphor.png',
    image: 'scene_sx_camphor.jpg',
    fallbackImage: EXHIBITION_IMAGES.longtengBridge,
    imageAlt: '三義山區客家樟腦林與山林煉製樟腦情境',
    summary: '清光緒年間在此搭建十六座樟腦蒸餾寮，為「十六份」（勝興原名）的歷史起源。',
    detail: '樟腦與林業物產的繁榮促使舊山線在此設站，奠定百年客家山城的鐵道命脈。',
    story:
      '勝興村在清光緒年間名為「十六份」，正是因為當年有客家拓墾先民在此山區搭建十六座蒸餾樟樹以提煉樟腦油的「腦寮」。當時台灣樟腦產量曾佔全球百分之七十以上，極度依賴搬運；日治初期修築縱貫鐵路時，便因十六份龐大的樟腦、木炭與茶葉物產運送需求而特設「十六份信號場」，車站與聚落因而相伴繁榮近百年。',
    walkingTip:
      '由站前老街往後山「挑柴古道」或桐花步道慢行，沿途仍有百年樟樹老林與傳統樟腦油老舖，店內依然陳列著古法蒸餾銅鍋與木製壓油機具。',
    source: '《苗栗縣客家文化與樟腦拓墾史》、行政院客委會地方文史叢書。',
  },

  // --- ⑧ 開天隧道口與警總哨亭 ---
  {
    id: 'tunnel-2',
    name: '開天隧道口與警總哨亭',
    shortName: '開天隧道',
    type: 'tunnel',
    kmMark: 'K165+100',
    elevation: 395.0,
    elevationStr: '395.0m',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 30.0, y: 50.0 },
    landscapePos: { x: 50.5, y: 36.0 },
    mapIcon: 'icon_sx_tunnel.png',
    image: 'scene_sx_tunnel.jpg',
    fallbackImage: EXHIBITION_IMAGES.mountainTunnel,
    imageAlt: '舊山線二號開天隧道百年磚拱洞口與警總哨亭',
    summary: '全長 726 公尺之百年紅磚隧道，北洞口題有後藤新平手書「開天」草書匾額。',
    detail: '列車由勝興出站後隨即鑽入隧道，洞口旁並留存戒嚴時期守衛隧道的哨亭遺跡。',
    story:
      '勝興站南端的二號隧道全長 726 公尺，於 1905 年（明治 38 年）竣工。北側洞口上方砌有氣勢磅礴的巴洛克風造型石匾，由當時臺灣總督府民政長官後藤新平親筆手題草書「開天」二字，寓意「劈開峻嶺、通達天地」。戒嚴時期因舊山線屬縱貫交通命脈，隧道口旁更設有警備總部駐守哨亭，見證鐵道工程與時代變遷交織的歷史紋理。',
    walkingTip:
      '站在勝興站二股道盡頭向南眺望，即可仰望「開天」兩字題額與洞口旁哨亭；搭乘舊山線鐵道自行車進入隧道，更能近距離觀察百年手砌紅磚工藝。',
    source: '《臺灣總督府官報》後藤新平題額記載、文化部文化資產局古蹟登錄檔案。',
  },

  // --- ③ 泰安車站 ---
  {
    id: 'sign-taian',
    name: '泰安車站',
    shortName: '泰安',
    type: 'signpost',
    kmMark: 'K173+200',
    elevation: 266.8,
    elevationStr: '266.8m',
    isFocal: false,
    hasStory: true,
    isSignpost: true,
    prevStation: '勝興',
    nextStation: '后里',
    portraitPos: { x: 26.0, y: 70.0 },
    landscapePos: { x: 70.0, y: 34.0 },
    mapIcon: 'sign_taian.png',
    image: 'scene_taian.jpg',
    fallbackImage: EXHIBITION_IMAGES.mountainTunnel,
    imageAlt: '泰安舊站月台站牌與大安溪畔鐵道景致',
    summary: '站房建於鐵軌路基下方的「地陷式站房」，月台立有 1935 年震災復興紀念碑。',
    detail: '167 次末班車於 21:24 通過泰安站，山線平原段由此延伸向后里。',
    story:
      '泰安舊站原名「大安溪信號場」，因鐵道高架橫越溪谷路基較高，站房巧妙建造於軌道下方；旅客買票後需穿過一條陰涼水泥地下通道，再登上樓梯抵達月台，為台灣非常罕見的建築配置。1935 年關刀山大地震此處震災慘重，日後重建月台特別豎立花崗岩「臺中線震災復興記念碑」，記錄了無數工程師與殉難職工的血淚。',
    walkingTip:
      '現為「泰安鐵道文化園區」，月台、臂木號誌機與防空洞皆保存完好。春天時月台旁整排昭和櫻盛開，隨風飄落於鐵軌碎石間，氣氛極為優雅。',
    source: '臺中市文化資產處歷史建築登錄文獻、臺鐵工務檔案《山線震災復建報告》。',
  },

  // --- ④ 后里車站 ---
  {
    id: 'sign-houli',
    name: '后里車站',
    shortName: '后里',
    type: 'signpost',
    kmMark: 'K178+300',
    elevation: 212.0,
    elevationStr: '212.0m',
    isFocal: false,
    hasStory: true,
    isSignpost: true,
    prevStation: '泰安',
    nextStation: '豐原',
    portraitPos: { x: 74.0, y: 86.0 },
    landscapePos: { x: 86.0, y: 66.0 },
    mapIcon: 'sign_houli.png',
    image: 'scene_houli.jpg',
    fallbackImage: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '后里站牌與山線台地接軌景致',
    summary: '舊山線南端接軌點，新山線雙軌完工後與新后豐隧道在此匯流。',
    detail: '列車由此重回雙軌電氣化幹線，告別陡峭山道，往台中方向飛馳。',
    story:
      '舊稱「後里驛」，座落於大安溪與大甲溪之間的后里台地。1998 年 9 月 24 日拂曉，新山線雙軌「后豐隧道」啟用，自三義截彎取直穿越火炎山東側直通后里，勝興與泰安舊線正式功成身退。后里站承接了新幹線列車的呼嘯，舊山線往南的舊路段則隨後被改建為全台知名的「后豐鐵馬道」，讓旅人以踩踏踏板的方式繼續感受百年九號隧道的清涼夜風。',
    walkingTip:
      '后里站後方可直接租用自行車銜接「后豐鐵馬道」，順著舊鐵道一路騎過長達 1.2 公里的九號隧道與壯觀的大甲溪花樑鋼橋。',
    source: '交通部鐵路改建工程局《山線雙軌工程專輯》、豐原客運文史回顧。',
  },

  // --- ⑤ 豐原車站 ---
  {
    id: 'sign-fengyuan',
    name: '豐原車站',
    shortName: '豐原',
    type: 'signpost',
    kmMark: 'K185+100',
    elevation: 215.0,
    elevationStr: '215.0m',
    isFocal: false,
    hasStory: true,
    isSignpost: true,
    prevStation: '后里',
    nextStation: '潭子',
    portraitPos: { x: 26.0, y: 98.5 },
    landscapePos: { x: 98.5, y: 34.0 },
    mapIcon: 'sign_fengyuan.png',
    image: 'scene_fengyuan.jpg',
    fallbackImage: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '豐原站牌與台中平原門戶車站夜色',
    summary: '舊山線南端運轉終點，列車由此進入繁華台中都會平原。',
    detail: '穿越百里山嶺與九十年歲月，167 次列車完成舊山線最後一次歷史巡禮。',
    story:
      '豐原舊稱「葫蘆墩」，是舊山線南端正式抵達台中平原的終點站。1998 年 9 月 23 日晚間，末班 167 次莒光號在通過勝興、越過雙溪大鐵橋後，於深夜抵達豐原，宣告歷時 90 年的舊山線單軌列車運轉史正式走入博物館。舊山線不僅是日治時代克服斷層與險坡的極致工程，更是串聯苗栗山林與台中平原物產的最動人動脈。',
    walkingTip:
      '豐原現已轉型為現代化高架捷運化車站；出站後步行 5 分鐘即可抵達歷史悠久的「慈濟宮」與「廟東夜市」，品嚐著名的排骨麵、鳳梨冰與傳統客家糕餅。',
    source: '《豐原市志·交通篇》、《臺灣總督府殖產局物產報告》。',
  },
];

/**
 * ⑫ 莒光167次（保持於畫面中心、隨滑動沿鐵路移動，點擊鳴笛並開啟介紹彈窗）
 */
export const TRAIN_167_OBJECT = {
  id: 'train-167',
  name: '莒光167次',
  shortName: '167 次莒光號',
  type: 'train',
  kmMark: 'K164+600',
  elevation: 402.326,
  elevationStr: '402.326m',
  isFocal: true,
  hasStory: true,
  portraitPos: { x: 50.0, y: 36.0 },
  landscapePos: { x: 36.0, y: 50.0 },
  mapIcon: 'ui_train_167.png',
  image: 'scene_train_167.jpg',
  fallbackImage: EXHIBITION_IMAGES.juguangTrain,
  imageAlt: 'E300 型電力機車牽引之 167 次莒光號橘白塗裝列車',
  summary: 'E300 型電力機車牽引 167 次莒光號，1998 年 9 月 23 日 21:10 最後一次停靠勝興車站。',
  detail: '末班車於 21:10 準點駛出勝興車站二股道，自此劃下舊山線定期營運句點。',
  story:
    '1998 年 9 月 23 日晚間，由台北開往高雄的南下 167 次莒光號，成為台灣鐵道史上最後一列定期停靠勝興車站的客運班次。車身經典的「莒光橘」（#F05E1C）搭配米白腰帶，在深綠山林與秋夜霧氣中格外醒目。當晚 21:10 列車長吹響哨音、機車頭拉響長鳴汽笛緩緩駛離月台，載著九十年的山線通勤與返鄉記憶，正式駛入歷史。',
  walkingTip:
    '滑動「探索舊山線」地圖即可駕駛 167 次莒光號由三義一路南下至豐原；點擊畫面中央的列車車頭，還可重溫經典的雙音氣笛聲。',
  source: '交通部臺灣鐵路管理局 1998 年時刻表檔案、《鐵道情報》舊山線停駛特輯。',
};

/**
 * ⑬ 電氣路牌閉塞器（右下角常駐裝置，點擊開啟與其他展品相同規格的彈出視窗，並同步顯示於「02. 沿線圖鑑」）
 */
export const BLOCK_INSTRUMENT_DATA = {
  id: 'block-instrument',
  name: '電氣路牌閉塞器',
  shortName: '電氣閉塞器',
  type: 'equipment',
  kmMark: 'K159+600 — K185+100',
  elevation: 402.326,
  elevationStr: '全線單軌區間',
  isFocal: false,
  hasStory: true,
  portraitPos: { x: 85.0, y: 85.0 },
  landscapePos: { x: 85.0, y: 85.0 },
  mapIcon: 'ui_block_instrument.png',
  image: 'scene_block_instrument.jpg',
  fallbackImage: EXHIBITION_IMAGES.shengxingNight,
  imageAlt: '舊山線單軌車站電氣路牌閉塞器歷史意象',
  summary: '舊山線單線鐵道的核心行車安全裝置，透過兩站電氣連鎖確保單一區間同時僅容許一列火車通行。',
  detail: '相鄰兩站各設一台電氣路牌閉塞器並以專線互鎖，直到列車平安抵達下一站歸還路牌才解除鎖定。',
  story:
    '舊山線為單線鐵道，為確保兩座相鄰車站之間的單一區間內「同一時間只能有一列火車行駛」，必須仰賴兩端站長室內的「電氣路牌閉塞器」連線聯鎖操作。兩站副站長透過電鈴暗號確認區間淨空後，才能共同解鎖扭出一枚銅質「電氣路牌」交給司機員作為通行憑證；直到列車安全抵達下一站並將路牌放回機器，系統才會解除鎖定。',
  walkingTip:
    '在勝興車站站長室與月台第二股道旁，仍可辨識當年行車室與「路牌受動架」位置；瀏覽本站「探索舊山線」地圖時，也可隨時觀察右下角電氣閉塞器的綠燈開通與紅燈佔用狀態。',
  source: '交通部臺灣鐵路管理局《行車實施細則》、國家鐵道博物館籌備處電氣路牌閉塞機典藏資料。',
};

export const MAP_STATIONS = MAP_OBJECTS.filter(
  (item) => item.type === 'station' || item.type === 'signpost'
);

/**
 * 右下角單軌電氣路牌閉塞器區間定義（對應 0% 三義 → 36% 勝興 → 70% 泰安 → 86% 后里 → 100% 豐原）
 */
export const BLOCK_SECTIONS = [
  {
    id: 'sec-1',
    name: '三義 ⟷ 勝興',
    rangeLandscape: [0, 34],
    rangePortrait: [0, 34],
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '40 km/h（千分之 25 連續上坡）',
    mileage: 'K159+600 — K164+600（5.0 公里）',
    description: '三義與勝興兩站各設一台電氣路牌閉塞機，兩端副站長以電鈴信號確認無車後，始能聯鎖扭出一枚銅質路牌。',
  },
  {
    id: 'sec-2',
    name: '勝興 ⟷ 泰安',
    rangeLandscape: [34, 68],
    rangePortrait: [34, 68],
    status: 'occupied',
    statusText: '列車佔用中（167 次）',
    speedLimit: '35 km/h（翻越分水嶺・連續隧道群）',
    mileage: 'K164+600 — K173+200（8.6 公里）',
    description: '1998 年 9 月 23 日 21:10，莒光 167 次正停靠勝興並將駛入此區間，閉塞機鎖定紅燈，絕不容許另一班列車進入。',
  },
  {
    id: 'sec-3',
    name: '泰安 ⟷ 后里',
    rangeLandscape: [68, 85],
    rangePortrait: [68, 85],
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '50 km/h（大安溪花樑鋼橋區間）',
    mileage: 'K173+200 — K178+300（5.1 公里）',
    description: '跨越大安溪花樑鋼橋至后里平原，確保單線區間列車通行安全無虞。',
  },
  {
    id: 'sec-4',
    name: '后里 ⟷ 豐原',
    rangeLandscape: [85, 101],
    rangePortrait: [85, 101],
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '60 km/h（銜接雙軌平原段）',
    mileage: 'K178+300 — K185+100（6.8 公里）',
    description: '舊山線南端最後一個閉塞區間，列車交還路牌後，即駛入台中都會區現代化號誌自動閉塞（ABS）雙軌區間。',
  },
];

export const OLD_MOUNTAIN_STOPS = [];

/**
 * 「02. 沿線圖鑑」13 個核心項目（與「探索舊山線」地圖彈窗 100% 同步，嚴格僅此 13 項）
 */
const ARCHIVE_ITEM_ORDER = [
  'sign-sanyi',         // 01. 三義車站
  'sign-shengxing',     // 02. 勝興車站
  'sign-taian',         // 03. 泰安車站
  'sign-houli',         // 04. 后里車站
  'sign-fengyuan',      // 05. 豐原車站
  'shengxing',          // 06. 勝興木造車站
  'switchback-track',   // 07. 折返式軌道與加掛補機
  'tunnel-2',           // 08. 開天隧道口與警總哨亭
  'elevation-monument', // 09. 海拔 402.326m 紀念碑
  'camphor-lodge',      // 10. 樟腦寮
  'dater-machine',      // 11. 軋日機
  'train-167',          // 12. 莒光號列車正面
  'block-instrument',   // 13. 電氣路牌閉塞器
];

const ARCHIVE_SOURCE_MAP = new Map([
  ...MAP_OBJECTS.map((item) => [item.id, item]),
  [TRAIN_167_OBJECT.id, TRAIN_167_OBJECT],
  [BLOCK_INSTRUMENT_DATA.id, BLOCK_INSTRUMENT_DATA],
]);

export const ARCHIVE_PLATES = ARCHIVE_ITEM_ORDER.map((id) => {
  const item = ARCHIVE_SOURCE_MAP.get(id);
  return {
    id: item.id,
    title: item.name,
    thumbnail: item.thumbnail || item.mapIcon || item.image || '',
    image: item.image || '',
    fallbackImage: item.fallbackImage || '',
    imageAlt: item.imageAlt || item.name,
    story: item.story || item.detail || '',
    walkingTip: item.walkingTip || '',
    source: item.source || '',
  };
});

export const CURATORIAL_CREDITS = [
  {
    role: '指導老師',
    members: ['涂卉 副教授'],
    note: '國立臺灣師範大學 圖文傳播學系',
  },
  {
    role: '策展與製作名單（依照姓氏筆畫排列）',
    members: ['徐立威', '陳主卉', '陳宏倫', '謝妮霓'],
    note: '',
    memberDetails: [
      { name: '徐立威', task: '網站架設與策展規劃' },
      { name: '陳主卉', task: '文案撰寫與編排' },
      { name: '陳宏倫', task: '音效製作' },
      { name: '謝妮霓', task: '插圖繪製與攝影' },
    ],
  },
];

export const CULTURAL_LINKS = [
  {
    id: 'link-01',
    title: '勝興車站歷史聚落與十六份老街（待替換）',
    description: '保留完整的縣定古蹟木造站體與周邊山城聚落文化，相關網站介紹與連結待補。',
    url: '',
  },
  {
    id: 'link-02',
    title: '舊山線鐵道自行車與龍騰斷橋園區（待替換）',
    description: '沿昔日舊山線軌跡串聯勝興站、開天隧道與龍騰斷橋，相關網站介紹與連結待補。',
    url: '',
  },
  {
    id: 'link-03',
    title: '國家鐵道博物館籌備處（待替換）',
    description: '收錄臺灣鐵道文史檔案、硬票與舊山線相關典藏資料，相關網站介紹與連結待補。',
    url: '',
  },
];
