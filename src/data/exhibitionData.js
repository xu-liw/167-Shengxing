// 《167次-勝興》舊山線線上策展資料集
// 包含主地圖 9 個故事物件、5 個純顯示站牌、軋日機、車頭與閉塞區間資料

export const EXHIBITION_IMAGES = {
  shengxingNight: '/src/assets/images/shengxing_night_station_1795101028819.jpg',
  longtengBridge: '/src/assets/images/longteng_bridge_mist_1795101010969.jpg',
  juguangTrain: '/src/assets/images/juguang_train_167_1795101008541.jpg',
  mountainTunnel: '/src/assets/images/old_mountain_tunnel_1795101010490.jpg',
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
    subtitle: '車站、紅磚拱橋、隧道與莒光號檔案',
  },
  {
    id: 'about',
    index: '03',
    label: '關於本展',
    subtitle: '策展論述、展覽脈絡與製作團隊',
  },
  {
    id: 'links',
    index: '04',
    label: '勝興連結',
    subtitle: '地方聚落、鐵道文史與實地走讀資源',
  },
];

/**
 * 舊山線地圖物件資料清單
 * - 9 個可點擊開啟 #FFBA84 故事彈窗的物件 (hasStory: true)
 * - 5 個僅在地圖上顯示的傳統站牌 (isSignpost: true, no modal)
 * - 1 個軋日機 (id: 'dater-machine')
 * - 1 個車頭 (id: 'train-167')
 */
export const MAP_OBJECTS = [
  // --- 1. 三義站（故事物件 1） ---
  {
    id: 'sanyi',
    name: '三義站',
    shortName: '三義',
    type: 'station',
    kmMark: 'K159+600',
    elevation: 302.0,
    elevationStr: '302.0m',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 50.0, y: 7.5 },
    landscapePos: { x: 7.5, y: 50.0 },
    image: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '三義山區彎道攀爬中的莒光號列車',
    summary: '舊山線北端起點，海拔 302.0 公尺。列車於此切入千分之二十五連續陡坡。',
    detail: '自三義站南下後，單線軌道隨山勢蜿蜒攀升，為進入關刀山隘口的序幕。',
    story:
      '原名「三叉河驛」的三義站，是舊山線攀登關刀山脈的北端起點。由苗栗平原南下的列車在此進入千分之二十五（每千公尺爬升 25 公尺）的連續陡坡。昔日蒸汽機關車牽引繁重客貨車時，常需在此加掛後連「補機」協力推升，直到勝興高點才解聯。1998 年新山線完工啟用後，三義新站改建為高架跨線大站，舊山線的慢行爬坡記憶就此封存。',
    walkingTip:
      '自三義新站出站後步行約 10 分鐘可抵達水美木雕街；站在舊山線跨線陸橋上，能遠眺當年單線軌道分岔切入山林的歷史路基。',
    source: '《臺灣總督府鐵道部年報》、交通部臺灣鐵路管理局《鐵道工務歷史月刊》、三義鄉誌。',
  },

  // 純顯示站牌 1：三義站名牌
  {
    id: 'signpost-sanyi',
    name: '三義站牌',
    shortName: '三義',
    type: 'signpost',
    isSignpost: true,
    kmMark: 'K159+600',
    elevation: 302.0,
    elevationStr: '302.0m',
    prevStation: '銅鑼',
    nextStation: '勝興',
    portraitPos: { x: 33.0, y: 8.5 },
    landscapePos: { x: 7.5, y: 34.0 },
    summary: '台鐵傳統藍白月台站名牌：三義（銅鑼 ⇐ ‧ ⇒ 勝興）',
    detail: '',
  },

  // 鐵道設施：一號隧道
  {
    id: 'tunnel-1',
    name: '一號隧道',
    shortName: '一號洞',
    type: 'tunnel',
    kmMark: 'K161+200',
    elevation: 338.0,
    elevationStr: '338.0m',
    isFocal: false,
    portraitPos: { x: 48.0, y: 19.0 },
    landscapePos: { x: 19.5, y: 48.0 },
    summary: '舊山線首座紅磚隧道，長 230 公尺，穿越關刀山山腰。',
    detail: '火車穿出首座隧道後，山林霧氣漸濃，坡度持續上升至勝興。',
  },

  // --- 2. 折返式軌道與加掛補機（故事物件 2） ---
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
    portraitPos: { x: 35.5, y: 30.0 },
    landscapePos: { x: 32.5, y: 37.0 },
    image: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '勝興車站北側折返式安全側線與山壁坡道',
    summary: '全台少見的千分之二十五避難防衝軌道，保護北上南下列車避免煞車不及釀災。',
    detail: '在勝興站北端分岔出長約 400 公尺的爬坡逆向引道，為極罕見的工程遺跡。',
    story:
      '勝興站座落於連續千分之二十五大陡坡的分水嶺鞍部。昔日蒸汽火車由三義爬坡北上，若進站馬力不足或停靠後難以再起步，常需加掛補機協力推升，或退入站外折返側線重整動力；而列車若煞車失靈，站務員可緊急扳轉道岔，引導列車衝上依山勢向上鋪設的「折返式安全斜坡」，利用重力自然減速止衝，展現明治時代因應險峻地形的智慧。',
    walkingTip:
      '出勝興站剪票口後，沿著第一股道鐵軌向北走約 250 公尺，即可見到明顯向右上方山壁斜衝的雜草鐵軌與轉轍器連桿遺跡。',
    source: '臺灣鐵道文化研究會《臺灣舊山線鐵道工藝史調查》、行政院文建會歷史聚落研究。',
  },

  // --- 3. 勝興木造車站（故事物件 3） ---
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
    portraitPos: { x: 50.0, y: 35.0 },
    landscapePos: { x: 38.0, y: 50.0 },
    image: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '1998 年秋夜薄霧中的勝興木造車站與月台暖燈',
    summary: '臺灣縱貫線最高點（標高 402.326 公尺），建於 1906 年日式木造站房。',
    detail: '1998 年 9 月 23 日晚間 21:10，莒光 167 次南下列車最後一次在此交會停靠。',
    story:
      '勝興站建於 1906 年（明治 39 年），初名「十六份信號場」，1958 年更名勝興。整座站房以珍貴台灣檜木穿斗榫接建造，未用一根鐵釘；因四周被九座山峰環抱（地理師指為虎穴），屋簷特別雕飾八卦、尖矛形「虎牙」與鋸齒木雕以鎮煞。1998 年 9 月 23 日 21:10，莒光 167 次最後一次進站，月台聚集數百名鐵道迷與村民，在長鳴的汽笛中向九十年的山線日常揮淚道別。',
    walkingTip:
      '站房候車室保留日治時期售票窗口、木造時刻表板與站長室。傍晚天色漸暗、暖黃吊燈亮起時，站在空曠月台上最能重溫 1998 年秋夜的靜謐情懷。',
    source: '臺鐵局運務處《勝興車站營運沿革紀錄》、苗栗縣政府文化觀光局縣定古蹟評定清冊。',
  },

  // 純顯示站牌 2：勝興站名牌
  {
    id: 'signpost-shengxing',
    name: '勝興站牌',
    shortName: '勝興',
    type: 'signpost',
    isSignpost: true,
    kmMark: 'K164+600',
    elevation: 402.326,
    elevationStr: '402.326m',
    prevStation: '三義',
    nextStation: '泰安',
    portraitPos: { x: 32.5, y: 34.5 },
    landscapePos: { x: 38.0, y: 65.5 },
    summary: '台鐵傳統藍白月台站名牌：勝興（三義 ⇐ ‧ ⇒ 泰安）',
    detail: '',
  },

  // 軋日機圖示物件（在勝興旁）
  {
    id: 'dater-machine',
    name: '軋日機',
    shortName: '軋日機',
    type: 'dater',
    kmMark: 'K164+630',
    elevation: 402.326,
    elevationStr: '402.326m',
    isFocal: true,
    portraitPos: { x: 67.0, y: 31.5 },
    landscapePos: { x: 42.5, y: 64.0 },
    image: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '台鐵名片式硬票與售票口軋日機歷史意象',
    summary: '台鐵售票窗口不可或缺的重型鑄鐵軋日機，可壓印 87.09.23 或今日日期。',
    detail: '點擊開啟軋日儀式，親手重壓油墨鋼印，一鍵合成並下載專屬 167 次車票 PNG。',
    story:
      '在電腦售票尚未全面普及的年代，台鐵各級車站售票口皆擺放著一台厚重的鑄鐵「軋日機」。當旅客買妥名片式硬紙車票，售票員將票面俐落塞入機槽、下壓把手，「喀鏘」一聲便在票角壓印出清晰凹陷的民國年月日鋼印。1998 年 9 月 23 日晚間，勝興車站售票窗前大排長龍，只為求得一張軋上「87.09.23」的末班車硬票，成為舊山線最珍貴的實體記憶。',
    walkingTip:
      '造訪勝興車站木造候車室時，可留意保留下來的售票木窗與票櫃陳設；也可在本站「探索舊山線」地圖上點擊勝興旁的軋日機，親手壓印並收藏一張專屬的 167 次紀念車票。',
    source: '國家鐵道博物館籌備處館藏名片式硬票文物檔案、臺鐵局運務處售票規章。',
  },

  // 車頭圖示物件（在勝興旁）
  {
    id: 'train-167',
    name: '莒光 167 次車頭',
    shortName: '167 次車頭',
    type: 'train',
    kmMark: 'K164+650',
    elevation: 402.326,
    elevationStr: '402.326m',
    isFocal: true,
    portraitPos: { x: 65.5, y: 35.5 },
    landscapePos: { x: 38.2, y: 36.5 },
    summary: 'E300 型電力機車牽引 167 次莒光號，南下開往高雄。',
    detail: '末班車於 21:10 準點駛出勝興車站二股道，自此劃下舊山線定期營運句點。',
  },

  // --- 4. 海拔 402.326m 紀念碑（故事物件 4） ---
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
    portraitPos: { x: 36.5, y: 37.0 },
    landscapePos: { x: 33.5, y: 63.5 },
    image: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '勝興車站月台北端之縱貫鐵路最高點石砌紀念碑',
    summary: '豎立在第一月台北側，銘刻縱貫線鐵路海拔四○二・三二六公尺分水嶺。',
    detail: '全線四百多公里縱貫軌道的極高點，列車至此越過山陵，開始奔向台中盆地。',
    story:
      '立於勝興第一月台北端的這座方柱石碑，正面刻有「臺灣鐵路最高點 海拔四○二・三二六公尺」，背面記載苗栗工務段於民國四十八年重新精測豎立之緣由。舊山線以此為分水嶺，由三義北上是漫長千分之二十五大陡坡，由此向南穿越二號開天隧道後則是連續下坡。每位抵達勝興的旅客與鐵道司機員，皆會在此感受征服險峻山嶺的歷史厚度。',
    walkingTip:
      '紀念碑旁緊依著昔日第二股道上方「路牌受動架」（金屬支架，用來掛取路牌套圈環）。建議由月台外側取景，可同時將紀念碑與背後的木造站房屋瓦一同入鏡。',
    source: '交通部臺灣鐵路管理局工務處歷史碑碣清冊、《鐵道情報》雜誌。',
  },

  // --- 5. 樟腦寮（故事物件 5） ---
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
    portraitPos: { x: 68.0, y: 39.0 },
    landscapePos: { x: 44.0, y: 36.0 },
    image: EXHIBITION_IMAGES.longtengBridge,
    imageAlt: '三義山區客家樟腦林與舊山線聚落歷史景致',
    summary: '清光緒年間在此搭建十六座樟腦蒸餾寮，為「十六份」（勝興原名）的歷史起源。',
    detail: '樟腦與林業物產的繁榮促使舊山線在此設站，奠定百年客家山城的鐵道命脈。',
    story:
      '勝興村在清光緒年間名為「十六份」，正是因為當年有客家拓墾先民在此山區搭建十六座蒸餾樟樹以提煉樟腦油的「腦寮」。當時台灣樟腦產量曾佔全球百分之七十以上，極度依賴搬運；日治初期修築縱貫鐵路時，便因十六份龐大的樟腦、木炭與茶葉物產運送需求而特設「十六份信號場」，車站與聚落因而相伴繁榮近百年。',
    walkingTip:
      '由站前老街往後山「挑柴古道」或桐花步道慢行，沿途仍有百年樟樹老林與傳統樟腦油老舖，店內依然陳列著古法蒸餾銅鍋與木製壓油機具。',
    source: '《苗栗縣客家文化與樟腦拓墾史》、行政院客委會地方文史叢書。',
  },

  // --- 6. 開天隧道口與警總哨亭（故事物件 6） ---
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
    portraitPos: { x: 52.0, y: 46.5 },
    landscapePos: { x: 49.0, y: 52.0 },
    image: EXHIBITION_IMAGES.mountainTunnel,
    imageAlt: '舊山線二號開天隧道百年磚拱與深邃洞口',
    summary: '全長 726 公尺之百年紅磚隧道，北洞口題有後藤新平手書「開天」草書匾額。',
    detail: '列車由勝興出站後隨即鑽入隧道，磚石拱頂上方至今留存近百年的蒸汽煤煙墨痕。',
    story:
      '勝興站南端的二號隧道全長 726 公尺，於 1905 年（明治 38 年）竣工。北側洞口上方砌有氣勢磅礴的巴洛克風造型石匾，由當時臺灣總督府民政長官後藤新平親筆手題草書「開天」二字，寓意「劈開峻嶺、通達天地」。隧道通體以手工紅磚交錯疊砌，歷經近一個世紀列車反覆震動與強震，結構依舊堅如磐石，拱頂厚重的煤煙黑痕更是無可取代的時間紋理。',
    walkingTip:
      '站在勝興站二股道盡頭向南眺望，即可仰望「開天」兩字題額；若搭乘舊山線鐵道自行車進入隧道，在柔和的投射燈下能細緻欣賞百年手砌紅磚的工藝。',
    source: '《臺灣總督府官報》後藤新平題額記載、文化部文化資產局古蹟登錄檔案。',
  },

  // 鐵道設施：魚藤坪／龍騰斷橋
  {
    id: 'longteng',
    name: '魚藤坪・龍騰斷橋',
    shortName: '龍騰斷橋',
    type: 'bridge',
    kmMark: 'K167+200',
    elevation: 355.0,
    elevationStr: '355.0m',
    isFocal: false,
    portraitPos: { x: 48.0, y: 56.5 },
    landscapePos: { x: 60.5, y: 48.0 },
    summary: '歷經 1935 年關刀山大地震遺構，糯米紅磚拱柱矗立在深谷翠竹間。',
    detail: '167 次於 21:16 呼嘯通過魚藤坪新鐵橋，車窗外能瞥見暗夜中斷橋壯麗的輪廓。',
  },

  // 鐵道設施：連續隧道群
  {
    id: 'tunnel-group',
    name: '連續隧道群（3~6 號）',
    shortName: '連續隧道',
    type: 'tunnel',
    kmMark: 'K169+800',
    elevation: 310.0,
    elevationStr: '310.0m',
    isFocal: false,
    portraitPos: { x: 51.5, y: 66.5 },
    landscapePos: { x: 71.5, y: 51.5 },
    summary: '舊山線最密集的磚砌單線隧道群，列車在忽明忽暗中急降。',
    detail: '舊山線連續穿山破壁，車輪與鐵軌撞擊的回音在山洞內劇烈迴盪。',
  },

  // 鐵道設施：大安溪花樑鋼橋
  {
    id: 'daan-bridge',
    name: '大安溪花樑鋼橋',
    shortName: '大安溪鐵橋',
    type: 'bridge',
    kmMark: 'K171+500',
    elevation: 280.0,
    elevationStr: '280.0m',
    isFocal: false,
    portraitPos: { x: 48.5, y: 75.5 },
    landscapePos: { x: 81.0, y: 48.5 },
    summary: '橫跨苗栗與台中界河大安溪，全長 637 公尺之十孔鋼桁架橋。',
    detail: '當列車駛出最後一座隧道越過開闊鐵橋，夜風轉涼，象徵舊山線山嶺段即將告終。',
  },

  // --- 7. 泰安舊站（故事物件 7） ---
  {
    id: 'taian',
    name: '泰安舊站',
    shortName: '泰安',
    type: 'station',
    kmMark: 'K173+200',
    elevation: 266.8,
    elevationStr: '266.8m',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 50.0, y: 83.5 },
    landscapePos: { x: 88.5, y: 50.0 },
    image: EXHIBITION_IMAGES.mountainTunnel,
    imageAlt: '泰安舊站靜謐月台與老鐵軌景致',
    summary: '站房建於鐵軌路基下方的「地陷式站房」，月台立有 1935 年震災復興紀念碑。',
    detail: '167 次末班車於 21:24 通過泰安站，山線平原段由此延伸向后里。',
    story:
      '泰安舊站原名「大安溪信號場」，因鐵道高架橫越溪谷路基較高，站房巧妙建造於軌道下方；旅客買票後需穿過一條陰涼水泥地下通道，再登上樓梯抵達月台，為台灣非常罕見的建築配置。1935 年關刀山大地震此處震災慘重，日後重建月台特別豎立花崗岩「臺中線震災復興記念碑」，其砲彈形狀與古樸碑文記錄了無數工程師與殉難職工的血淚。',
    walkingTip:
      '現為「泰安鐵道文化園區」，月台、臂木號誌機與防空洞皆保存完好。春天時月台旁整排昭和櫻盛開，隨風飄落於鐵軌碎石間，氣氛極為優雅。',
    source: '臺中市文化資產處歷史建築登錄文獻、臺鐵工務檔案《山線震災復建報告》。',
  },

  // 純顯示站牌 3：泰安站名牌
  {
    id: 'signpost-taian',
    name: '泰安站牌',
    shortName: '泰安',
    type: 'signpost',
    isSignpost: true,
    kmMark: 'K173+200',
    elevation: 266.8,
    elevationStr: '266.8m',
    prevStation: '勝興',
    nextStation: '后里',
    portraitPos: { x: 33.0, y: 84.5 },
    landscapePos: { x: 88.5, y: 66.0 },
    summary: '台鐵傳統藍白月台站名牌：泰安（勝興 ⇐ ‧ ⇒ 后里）',
    detail: '',
  },

  // --- 8. 后里站（故事物件 8） ---
  {
    id: 'houli',
    name: '后里站',
    shortName: '后里',
    type: 'station',
    kmMark: 'K178+300',
    elevation: 212.0,
    elevationStr: '212.0m',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 50.0, y: 91.0 },
    landscapePos: { x: 94.0, y: 50.0 },
    image: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '后里平原縱貫線電氣化列車飛馳意象',
    summary: '舊山線南端接軌點，新山線雙軌完工後與新后豐隧道在此匯流。',
    detail: '列車由此重回雙軌電氣化幹線，告別陡峭山道，往台中方向飛馳。',
    story:
      '舊稱「後里驛」，座落於大安溪與大甲溪之間的后里台地。1998 年 9 月 24 日拂曉，新山線雙軌「后豐隧道」啟用，自三義截彎取直穿越火炎山東側直通后里，勝興與泰安舊線正式功成身退。后里站承接了新幹線列車的呼嘯，舊山線往南的舊路段則隨後被改建為全台知名的「后豐鐵馬道」，讓旅人以踩踏踏板的方式繼續感受百年九號隧道的清涼夜風。',
    walkingTip:
      '后里站後方可直接租用自行車銜接「后豐鐵馬道」，順著舊鐵道一路騎過長達 1.2 公里的九號隧道與壯觀的大甲溪花樑鋼橋。',
    source: '交通部鐵路改建工程局《山線雙軌工程專輯》、豐原客運文史回顧。',
  },

  // 純顯示站牌 4：后里站名牌
  {
    id: 'signpost-houli',
    name: '后里站牌',
    shortName: '后里',
    type: 'signpost',
    isSignpost: true,
    kmMark: 'K178+300',
    elevation: 212.0,
    elevationStr: '212.0m',
    prevStation: '泰安',
    nextStation: '豐原',
    portraitPos: { x: 33.0, y: 91.5 },
    landscapePos: { x: 94.0, y: 66.0 },
    summary: '台鐵傳統藍白月台站名牌：后里（泰安 ⇐ ‧ ⇒ 豐原）',
    detail: '',
  },

  // --- 9. 豐原站（故事物件 9） ---
  {
    id: 'fengyuan',
    name: '豐原站',
    shortName: '豐原',
    type: 'station',
    kmMark: 'K185+100',
    elevation: 215.0,
    elevationStr: '215.0m',
    isFocal: false,
    hasStory: true,
    portraitPos: { x: 50.0, y: 96.5 },
    landscapePos: { x: 98.0, y: 50.0 },
    image: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '進入台中都會區的豐原歷史車站夜色',
    summary: '舊山線南端運轉終點，列車由此進入繁華台中都會平原。',
    detail: '穿越百里山嶺與九十年歲月，167 次列車完成舊山線最後一次歷史巡禮。',
    story:
      '豐原舊稱「葫蘆墩」，是舊山線南端正式抵達台中平原的終點站。1998 年 9 月 23 日晚間，末班 167 次莒光號在通過勝興、越過雙溪大鐵橋後，於深夜抵達豐原，宣告歷時 90 年的舊山線單軌列車運轉史正式走入博物館。舊山線不僅是日治時代克服斷層與險坡的極致工程，更是串聯苗栗山林與台中平原物產的最動人動脈。',
    walkingTip:
      '豐原現已轉型為現代化高架捷運化車站；出站後步行 5 分鐘即可抵達歷史悠久的「慈濟宮」與「廟東夜市」，品嚐著名的排骨麵、鳳梨冰與傳統客家糕餅。',
    source: '《豐原市志·交通篇》、《臺灣總督府殖產局物產報告》。',
  },

  // 純顯示站牌 5：豐原站名牌
  {
    id: 'signpost-fengyuan',
    name: '豐原站牌',
    shortName: '豐原',
    type: 'signpost',
    isSignpost: true,
    kmMark: 'K185+100',
    elevation: 215.0,
    elevationStr: '215.0m',
    prevStation: '后里',
    nextStation: '潭子',
    portraitPos: { x: 33.0, y: 97.0 },
    landscapePos: { x: 98.0, y: 66.0 },
    summary: '台鐵傳統藍白月台站名牌：豐原（后里 ⇐ ‧ ⇒ 潭子）',
    detail: '',
  },
];

export const MAP_STATIONS = MAP_OBJECTS.filter((item) => item.type === 'station');

/**
 * 右下角單軌電氣路牌閉塞器區間定義
 */
export const BLOCK_SECTIONS = [
  {
    id: 'sec-1',
    name: '三義 ⟷ 勝興',
    rangeLandscape: [0, 26],
    rangePortrait: [0, 26],
    tokenShape: '圓形 ○',
    tokenName: '第 1 種路牌（圓形）',
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '40 km/h（千分之 25 連續上坡）',
    mileage: 'K159+600 — K164+600（5.0 公里）',
    description: '三義與勝興兩站各設一台電氣路牌閉塞機，兩端副站長以電鈴信號確認無車後，始能聯鎖扭出一枚圓形銅質路牌。',
  },
  {
    id: 'sec-2',
    name: '勝興 ⟷ 泰安',
    rangeLandscape: [26, 68],
    rangePortrait: [26, 68],
    tokenShape: '半月形 ☽',
    tokenName: '第 2 種路牌（半月形）',
    status: 'occupied',
    statusText: '列車佔用中（167 次）',
    speedLimit: '35 km/h（翻越分水嶺・連續隧道群）',
    mileage: 'K164+600 — K173+200（8.6 公里）',
    description: '1998 年 9 月 23 日 21:10，莒光 167 次正停靠勝興並將駛入此區間，閉塞機鎖定紅燈，絕不容許另一班列車進入。',
  },
  {
    id: 'sec-3',
    name: '泰安 ⟷ 后里',
    rangeLandscape: [68, 86],
    rangePortrait: [68, 86],
    tokenShape: '方形 □',
    tokenName: '第 3 種路牌（方形）',
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '50 km/h（大安溪花樑鋼橋區間）',
    mileage: 'K173+200 — K178+300（5.1 公里）',
    description: '跨越大安溪花樑鋼橋至后里平原，配發第 3 種方形路牌。相鄰區間路牌形狀絕對不同，避免司機誤持錯牌衝撞。',
  },
  {
    id: 'sec-4',
    name: '后里 ⟷ 豐原',
    rangeLandscape: [86, 100],
    rangePortrait: [86, 100],
    tokenShape: '三角形 △',
    tokenName: '第 4 種路牌（三角形）',
    status: 'clear',
    statusText: '區間開通',
    speedLimit: '60 km/h（銜接雙軌平原段）',
    mileage: 'K178+300 — K185+100（6.8 公里）',
    description: '舊山線南端最後一個閉塞區間，列車交還三角形路牌後，即駛入台中都會區現代化號誌自動閉塞（ABS）雙軌區間。',
  },
];

export const OLD_MOUNTAIN_STOPS = [
  {
    id: 'sanyi',
    order: '01',
    name: '三義站',
    kmMark: 'K159+600',
    elevation: '302.0m',
    time167: '21:02 開',
    summary: '舊山線北端起點，列車於此切入千分之二十五陡坡，正式攀向霧氣瀰漫的關刀山脈。',
    detail:
      '自三義站南下後，單線軌道沿著山腰蜿蜒爬升。昔日蒸汽機車時代，列車常需在此加掛補機協助推升，夜間車燈劃破樟樹林間的霧氣，是無數旅客記憶中進入山城的序幕。',
    image: EXHIBITION_IMAGES.juguangTrain,
    imageAlt: '黃昏時分橘白塗裝莒光號列車行駛於舊山線彎道山谷之間',
  },
  {
    id: 'shengxing',
    order: '02',
    name: '勝興站',
    kmMark: 'K164+600',
    elevation: '402.326m',
    time167: '21:10 停靠',
    summary: '臺灣縱貫鐵路最高點，1998 年 9 月 23 日晚間 21:10，莒光 167 次最後一次在此交會停靠。',
    detail:
      '建於 1906 年、原名「十六份」的勝興車站，以不使用鐵釘的日式木構虎牙屋簷聞名。當 1998 年 9 月 23 日 21:10 最後一班南下莒光 167 次緩緩駛離月台，響徹九十年的電氣路牌拋接聲與鳴笛，自此凝結在這個秋夜。',
    image: EXHIBITION_IMAGES.shengxingNight,
    imageAlt: '1998 年秋夜薄霧中的勝興木造車站與進站中的莒光號列車燈光',
  },
  {
    id: 'longteng',
    order: '03',
    name: '魚藤坪・龍騰斷橋',
    kmMark: 'K167+200',
    elevation: '355.0m',
    time167: '21:16 通過',
    summary: '歷經 1935 年關刀山大地震後殘存的紅磚拱橋遺址，見證台灣鐵道磚砌工藝的極致。',
    detail:
      '列車離開勝興、穿過二號隧道後，右側山谷即能望見矗立在霧嵐與翠竹之間的龍騰斷橋。原橋由糯米混合紅磚砌成，未曾使用一根鋼筋，震後新建的鋼板橋與舊橋墩隔溪相望，構成舊山線最壯麗的地景對話。',
    image: EXHIBITION_IMAGES.longtengBridge,
    imageAlt: '晨霧繚繞苗栗山谷中的龍騰斷橋紅磚拱橋遺址',
  },
  {
    id: 'taian',
    order: '04',
    name: '泰安舊站・連續隧道群',
    kmMark: 'K173+200',
    elevation: '266.8m',
    time167: '21:24 通過',
    summary: '連續穿越三至七號紅磚隧道與大安溪花樑鋼橋，列車由高處緩降入台中盆地。',
    detail:
      '舊山線南段密集分布著百餘年歷史的連續磚砌隧道與鋼桁架橋樑。車廂內規律回盪著轟隆隆的隧道回聲，直到越過大安溪花樑鋼橋，夜風轉為開闊，舊山線的旅程也隨之畫下句點。',
    image: EXHIBITION_IMAGES.mountainTunnel,
    imageAlt: '舊山線百年紅磚圓拱隧道內部軌道與遠方暖色出口微光',
  },
];

/**
 * 電氣閉塞器專題資料（與地圖右下角電氣路牌閉塞器對應，同步顯示於「02. 沿線圖鑑」）
 * 日後替換文字與圖片時，直接修改此物件之 image / thumbnail / story / walkingTip / source 即可。
 */
export const BLOCK_INSTRUMENT_DATA = {
  id: 'block-instrument',
  name: '電氣閉塞器',
  image: EXHIBITION_IMAGES.shengxingNight,
  imageAlt: '舊山線單軌車站電氣路牌閉塞器與路牌套圈歷史意象',
  story:
    '舊山線為單線鐵道，為確保兩座相鄰車站之間的單一區間內「同一時間只能有一列火車行駛」，必須仰賴兩端站長室內的「電氣路牌閉塞器」連線聯鎖操作。兩站副站長透過電鈴暗號確認區間淨空後，才能共同解鎖扭出一枚銅質「電氣路牌」交給司機員作為通行憑證；相鄰區間的路牌形狀（圓形、半月形、方形、三角形）絕不相同，直到列車安全抵達下一站並將路牌放回機器，系統才會解除鎖定。',
  walkingTip:
    '在勝興車站站長室與月台第二股道旁，仍可辨識當年行車室與「路牌受動架」位置；瀏覽本站「探索舊山線」地圖時，也可隨時點擊右下角的電氣閉塞器查看各區間的路牌形狀與狀態。',
  source: '交通部臺灣鐵路管理局《行車實施細則》、國家鐵道博物館籌備處電氣路牌閉塞機典藏資料。',
};

/**
 * 「02. 沿線圖鑑」11 個核心項目（與「探索舊山線」彈窗共用相同資料來源）
 * 日後更新文字說明或圖片時，只需修改上方 MAP_OBJECTS（及 BLOCK_INSTRUMENT_DATA）
 * 中的 image / thumbnail / story / walkingTip / source，地圖彈窗與沿線圖鑑將會同步更新。
 */
const ARCHIVE_ITEM_ORDER = [
  'shengxing',          // 01. 勝興木造車站
  'switchback-track',   // 02. 折返式軌道與加掛補機
  'tunnel-2',           // 03. 開天隧道口與警總哨亭
  'elevation-monument', // 04. 海拔 402.326m 紀念碑
  'camphor-lodge',      // 05. 樟腦寮
  'dater-machine',      // 06. 軋日機
  'sanyi',              // 07. 三義站
  'taian',              // 08. 泰安舊站
  'houli',              // 09. 后里站
  'fengyuan',           // 10. 豐原站
  'block-instrument',   // 11. 電氣閉塞器
];

const ARCHIVE_SOURCE_MAP = new Map([
  ...MAP_OBJECTS.map((item) => [item.id, item]),
  [BLOCK_INSTRUMENT_DATA.id, BLOCK_INSTRUMENT_DATA],
]);

export const ARCHIVE_PLATES = ARCHIVE_ITEM_ORDER.map((id) => {
  const item = ARCHIVE_SOURCE_MAP.get(id);
  return {
    id: item.id,
    title: item.name,
    thumbnail: item.thumbnail || item.image || '',
    image: item.image || '',
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
    role: '策展與製作組員',
    members: ['徐立威', '陳主卉', '陳宏倫', '謝妮霓'],
    note: '共同開發與策劃（依照姓氏筆畫排列）',
  },
];

export const CULTURAL_LINKS = [
  {
    id: 'link-01',
    category: '古蹟車站',
    title: '勝興車站歷史聚落與十六份老街',
    location: '苗栗縣三義鄉勝興村 14 鄰 88 號',
    description:
      '保留完整的縣定古蹟木造站體、海拔 402.326 公尺紀念碑與站長宿舍，周圍聚落延伸客家山城飲食、擂茶與木雕工藝文化。',
    fieldNote: '建議傍晚時分造訪月台，感受山嵐垂降與黃昏路燈亮起時的歷史氛圍。',
    coordinates: '24.3886° N, 120.7819° E',
  },
  {
    id: 'link-02',
    category: '鐵道遺構',
    title: '舊山線鐵道自行車與龍騰斷橋園區',
    location: '苗栗縣三義鄉龍騰村 4 鄰外庄 20-2 號',
    description:
      '沿昔日舊山線軌跡串聯勝興站、二號開天隧道、魚藤坪鐵橋與六號隧道，以貼近鐵軌的視角重新閱讀百年山線工程。',
    fieldNote: '南斷橋步道可近距離觀察 1935 年震後被老樹根緊密包覆的紅磚橋墩。',
    coordinates: '24.3584° N, 120.7740° E',
  },
  {
    id: 'link-03',
    category: '文史檔案',
    title: '國家鐵道博物館籌備處・山線鐵道記憶',
    location: '臺灣鐵道文化保存與口述歷史典藏',
    description:
      '收錄縱貫線山線改線前後的時刻表、名片式硬票、電氣路牌閉塞器與莒光號客車圖面等珍貴文史資料。',
    fieldNote: '本展「售票機」與 167 次列車車票版式，即參考 1990 年代台鐵自動售票機與硬票視覺語彙轉譯而成。',
    coordinates: '文史典藏參考 · 1908–1998',
  },
  {
    id: 'link-04',
    category: '南段延伸',
    title: '泰安鐵道文化園區（泰安舊站）',
    location: '台中市后里區泰安里福興路 52 號',
    description:
      '舊山線少見將站房建於軌道下方的獨特構造，月台立有台中線震災復興紀念碑，是見證大安溪北岸鐵道歷史的重要起迄點。',
    fieldNote: '由勝興向南延伸走讀至泰安舊站，可完整串聯舊山線從高點降至溪谷的立體地景變化。',
    coordinates: '24.3316° N, 120.7422° E',
  },
];
