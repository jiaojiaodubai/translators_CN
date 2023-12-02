{
	"translatorID": "5c95b67b-41c5-4f55-b71a-48d5d7183063",
	"label": "CNKI",
	"creator": "Aurimas Vinckevicius, Xingzhong Lin, jiaojiaodubai23",
	"target": "https?://.*?(cnki\\.com)|/(kns8?s?|kcms2?|KXReader|KNavi|Kreader)",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2023-12-02 14:13:28"
}

/*
	***** BEGIN LICENSE BLOCK *****
	CNKI(China National Knowledge Infrastructure) Translator
	Copyright © 2013 Aurimas Vinckevicius
	This file is part of Zotero.
	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.
	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.
	***** END LICENSE BLOCK *****
*/

var ids = {
	dbname: '',
	filename: '',
	dbcode: '',
	url: ''
};

function detectWeb(doc, url) {
	Z.debug("----------------CNKI 20231202------------------");
	ids = getIDFromPage(doc, url);
	const multiplePattern = [
		/kns\/brief\/(default_)?result\.aspx/i,
		// Article list in journal navigation page
		/\/KNavi\//i,
		/kns8?s?\/defaultresult\/index/i,
		// search page
		/KNS8?s?\/AdvSearch\?/i,
		// search page
		/kns8?s?\/search\?/i,
		// search page
		/kns8\/#\/\?/i,
		// search page
		/search\.cnki\.com/i
	];
	let searchResult = doc.querySelector("#ModuleSearchResult");
	if (searchResult) {
		Z.monitorDOMChanges(searchResult, { childList: true, subtree: true });
	}
	if (ids) {
		Z.debug(ids);
		return getTypeFromDBName(ids);
	}
	else if (multiplePattern.find(element => element.test(url)) && getSearchResults(doc, url, true)) {
		return "multiple";
	}
	else {
		return false;
	}
}

function getIDFromPage(doc, url) {
	ids = getIDFromURL(url) || getIDFromHeader(doc, url);
	return ids;
}

function getIDFromURL(url) {
	Z.debug(`receive url: ${url}`);
	ids = {
		dbname: /[?&](?:db|table)[nN]ame=([^&#]*)/i,
		filename: /[?&]filename=([^&#]*)/i,
		dbcode: /[?&]dbcode=([^&#]*)/i
	};
	for (const key in ids) {
		let value = tryMatch(url, ids[key], 1);
		Z.debug(value);
		if (!value) return false;
		ids[key] = value;
	}
	ids.url = url;
	return ids;
}

function getIDFromHeader(doc, url) {
	ids = {
		dbname: 'input#paramdbname',
		filename: 'input#paramfilename',
		dbcode: 'input#paramdbcode'
	};
	for (const key in ids) {
		let value = attr(doc, ids[key], 'value');
		if (!value) return false;
		ids[key] = value;
	}
	ids.url = url;
	return ids;
}

function getIDFromSpaceURL(url) {
	// https://www.cnki.com.cn/Article/CJFDTOTAL-SYYY202311015.htm
	ids = {
		filename: /-([A-Z\d]+)\./,
		dbcode: /\/([A-Z]{4})TOTAL-/
	};
	for (const key in ids) {
		let value = tryMatch(url, ids[key], 1);
		if (!value) return false;
		ids[key] = value;
	}
	ids.dbname = `${ids.dbcode}LAST${tryMatch(ids.filename, /[A-Z](\d{4})/, 1)}`;
	ids.url = url;
	return ids;
}

function getTypeFromDBName(ids) {
	const dbType = {
		CAPJ: 'journalArticle',
		CCJD: 'journalArticle',
		CDMD: 'journalArticle',
		CJFD: 'journalArticle',
		CJFQ: 'journalArticle',
		CJZK: 'journalArticle',
		CYFD: 'journalArticle',
		SJES: 'journalArticle',
		SJPD: 'journalArticle',
		SSJD: 'journalArticle',
		CDFD: 'thesis',
		CDMH: 'thesis',
		// CDMD: 'thesis',
		CLKM: 'thesis',
		CMFD: 'thesis',
		CHKN: 'newspaperArticle',
		CHKJ: 'newspaperArticle',
		CCND: 'newspaperArticle',
		CIPD: 'conferencePaper',
		CPFD: 'conferencePaper',
		IPFD: 'conferencePaper',
		SCOD: 'patent',
		SCPD: 'patent'
	};
	let db = ids.dbname.substr(0, 4).toUpperCase();
	return dbType[db] || dbType[ids.dbcode];
}

function getSearchResults(doc, url, checkOnly) {
	var items = {};
	var found = false;
	var rows = [];
	var aSlector = '';
	// for journal detail page
	if (/\/journals\/.+\/detail/i.test(url)) {
		Z.debug('Article list in journal navigation page');
		rows = doc.querySelectorAll('dl#CataLogContent dd');
		aSlector = 'span.name > a';
	}
	else if (/search\.cnki\.com/i.test(url)) {
		Z.debug('Article list in CNKI space');
		rows = doc.querySelectorAll('div#article_result div.list-item');
		aSlector = 'p > a';
	}
	// for search result page
	else {
		// table.list_table tbody tr => https://chkdx.cnki.net/
		rows = doc.querySelectorAll('table.result-table-list tbody tr,table.list_table tbody tr');
		aSlector = 'td.name > a,td.seq+td > a';
	}
	Z.debug(rows.length);
	if (!rows.length) return false;
	for (let i = 0; i < rows.length; i++) {
		let row = rows[i];
		let href = attr(row, aSlector, 'href');
		let title = attr(row, aSlector, 'title') || text(row, aSlector);
		// Z.debug(`${href}\n${title}`);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[JSON.stringify({
			url: href,
			cite: text(row, 'td.quote')
		})] = `【${i + 1}】${title}`;
	}
	return found ? items : false;
}

async function doWeb(doc, url) {
	if (detectWeb(doc, url) == "multiple") {
		let items = await Z.selectItems(getSearchResults(doc, url, false));
		if (!items) return;
		for (let key in items) {
			let keyObj = JSON.parse(key);
			let doc = await requestDocument(keyObj.url);
			// Z.debug(innerText(doc, 'body'));
			// If CAPTCHA occurs, notify user to handle it
			if (doc.querySelector('#verify_pic')) {
				let newItem = new Z.Item('webpage');
				newItem.title = `❌验证码错误！（CAPTCHA Erro!）❌`;
				newItem.url = keyObj.url;
				newItem.abstractNote
					= '原始条目在批量抓取过程中遇到验证码，这通常是您向知网请求过于频繁导致的。原始条目的链接已经保存到本条目中，请考虑随后打开这个链接并重新抓取。\n'
					+ 'Encountered CAPTCHA during batch scrape process with original item, which is usually caused by your frequent requests to CNKI. The link to original item has been saved to this entry. Please consider opening this link later and re scrap.';
				newItem.complete();
				continue;
			}
			await scrape(doc, keyObj.url, keyObj.cite);
		}
	}
	else {
		await scrape(doc, url);
	}
}

async function scrape(doc, url = doc.location.href, cite) {
	var isSpace = /cnki\.com\.cn/.test(url);
	ids = isSpace ? getIDFromSpaceURL(url) : getIDFromPage(doc, url);
	Z.debug(ids);
	var postData, refer, referText = '';
	try {
		postData = `FileName=${ids.dbname}!${ids.filename}!1!0`
			+ '&DisplayMode=EndNote'
			+ '&OrderParam=0'
			+ '&OrderType=desc'
			+ '&SelectField='
			+ '&PageIndex=1'
			+ '&PageSize=20'
			+ '&language='
			+ '&uniplatform=NZKPT'
			+ `&random=${Math.random()}`;
		refer = 'https://kns.cnki.net/dm/manage/export.html?'
			+ `filename=${ids.dbname}!${ids.filename}!1!0`
			+ '&displaymode=NEW'
			+ '&uniplatform=NZKPT';
		referText = await request(
			'https://kns.cnki.net/dm/api/ShowExport',
			{
				method: 'POST',
				body: postData,
				headers: {
					Referer: refer
				}
			}
		);

		/* Due to CNKI's anti crawler feature, fixed text is used during debugging to avoid frequent requests */
		/*
		referText = {
			"status": 200,
			"headers": {
				"connection": "close",
				"content-encoding": "br",
				"content-type": "text/plain;charset=utf-8",
				"date": "Fri, 01 Dec 2023 19:27:19 GMT",
				"transfer-encoding": "chunked",
				"vary": "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
			},
			"body": "<ul class='literature-list'><li>%0 Journal Article<br>%A 李儒\n%A 李泽慧\n%A 郑明和\n%A 钟良军\n%A 丁佩惠<br>%+ 杭州师范大学附属医院口腔医学中心;杭州师范大学口腔医学院;浙江大学医学院附属口腔医院,浙江大学口腔医学院浙江省口腔疾病临床医学研究中心;<br>%T 光生物调节疗法治疗口腔黏膜病的相关机制<br>%J 激光生物学报<br>%D 2023<br>%V 32<br>%N 05<br>%K 光生物调节;治疗;口腔黏膜病;发色团;双相剂量反应<br>%X 光生物调节疗法作为口腔黏膜病治疗的辅助手段发展迅速，它通过细胞吸收光子能量，产生光化学效应，从而调节各种各样的生物过程来达到治疗目的。本文就减少炎症、加速组织愈合、缓解疼痛以及光生物调节的双向剂量作用4个方面进行综述，并深入探讨了其作用机制，以便为临床医师应用光生物调节疗法治疗口腔黏膜病提供更好的临床决策和依据。<br>%P 403-413<br>%@ 1007-7146<br>%L 43-1264/Q<br>%W CNKI<br></li></ul><input id=\"traceid\" type=\"hidden\" value=\"f1f8e54793124a53b1ffbcf20d530b56.174.17014588396030201\">"
		}
		// During debugging, manually throw errors to guide the program to run inward.
		referText = false;
		throw ReferenceError;
		*/

		if (!referText.body) {
			Z.debug('Failed to retrieve data from API: ShowExport');
			Z.debug(referText);
			throw ReferenceError;
		}
		referText = referText.body
			// prefix
			.replace(/^<ul class='literature-list'><li>/, '')
			// suffix
			.replace(/<br><\/li><\/ul><input.*>$/, '');
	}
	catch (error1) {
		try {
			postData = `filename=${ids.dbname}!${ids.filename}!1!0`
				+ '&displaymode=GBTREFER%2Celearning%2CEndNote';
			referText = await requestJSON(
				'https://kns.cnki.net/dm/API/GetExport?uniplatform=NZKPT',
				{
					method: 'POST',
					body: postData,
					headers: {
						Referer: ids.url
					}
				}
			);

			/* Due to CNKI's anti crawler feature, fixed text is used during debugging to avoid frequent requests */
			/*
			referText = {
				"code": 1,
				"msg": "返回成功",
				"data": [
					{
						"key": "GB/T 7714-2015 格式引文",
						"value": [
							"[1]张福锁,王激清,张卫峰等.中国主要粮食作物肥料利用率现状与提高途径[J].土壤学报,2008(05):915-924."
						]
					},
					{
						"key": "知网研学（原E-Study）",
						"value": [
							"DataType: 1<br>Title-题名: 中国主要粮食作物肥料利用率现状与提高途径<br>Author-作者: 张福锁;王激清;张卫峰;崔振岭;马文奇;陈新平;江荣风;<br>Source-刊名: 土壤学报<br>Year-年: 2008<br>PubTime-出版时间: 2008-09-15<br>Keyword-关键词: 肥料农学效率;氮肥利用率;影响因素;提高途径<br>Summary-摘要: 总结了近年来在全国粮食主产区进行的1 333个田间试验结果,分析了目前条件下中国主要粮食作物水稻、小麦和玉米氮磷钾肥的偏生产力、农学效率、肥料利用率和生理利用率等,发现水稻、小麦和玉米的氮肥农学效率分别为10.4 kg kg-1、8.0 kg kg-1和9.8 kg kg-1,氮肥利用率分别为28.3%、28.2%和26.1%,远低于国际水平,与20世纪80年代相比呈下降趋势。造成肥料利用率低的主要原因包括高产农田过量施肥,忽视土壤和环境养分的利用,作物产量潜力未得到充分发挥以及养分损失未能得到有效阻控等。要大幅度提高肥料利用率就必须从植物营养学、土壤学、农学等多学科联合攻关入手,充分利用来自土壤和环境的养分资源,实现根层养分供应与高产作物需求在数量上匹配、时间上同步、空间上一致,同时提高作物产量和养分利用效率,协调作物高产与环境保护。<br>Period-期: 05<br>PageCount-页数: 10<br>Page-页码: 915-924<br>SrcDatabase-来源库: 期刊<br>Organ-机构: 农业部植物营养与养分循环重点实验室教育部植物-土壤相互作用重点实验室中国农业大学资源与环境学院;河北农业大学资源与环境学院;<br>Link-链接: https://kns.cnki.net/kcms2/article/abstract?v=2Wn7gbiy3W_uaYxWWHbfX6Eo_zqFxhUVFviONVwAOwGJb2qk1H2f2iCbMlOvOoP0DDONsYAP4T3EvRsDbBj1xyCMf7DOnq6aiLuQE42fefZ_sYdhZ4stRfXyaoK7TPbe&uniplatform=NZKPT&language=CHS<br>"
						]
					},
					{
						"key": "EndNote",
						"value": [
							"%0 Journal Article<br>%A 张福锁%A 王激清%A 张卫峰%A 崔振岭%A 马文奇%A 陈新平%A 江荣风<br>%+ 农业部植物营养与养分循环重点实验室教育部植物-土壤相互作用重点实验室中国农业大学资源与环境学院;河北农业大学资源与环境学院;<br>%T 中国主要粮食作物肥料利用率现状与提高途径<br>%J 土壤学报<br>%D 2008<br>%N 05<br>%K 肥料农学效率;氮肥利用率;影响因素;提高途径<br>%X 总结了近年来在全国粮食主产区进行的1 333个田间试验结果,分析了目前条件下中国主要粮食作物水稻、小麦和玉米氮磷钾肥的偏生产力、农学效率、肥料利用率和生理利用率等,发现水稻、小麦和玉米的氮肥农学效率分别为10.4 kg kg-1、8.0 kg kg-1和9.8 kg kg-1,氮肥利用率分别为28.3%、28.2%和26.1%,远低于国际水平,与20世纪80年代相比呈下降趋势。造成肥料利用率低的主要原因包括高产农田过量施肥,忽视土壤和环境养分的利用,作物产量潜力未得到充分发挥以及养分损失未能得到有效阻控等。要大幅度提高肥料利用率就必须从植物营养学、土壤学、农学等多学科联合攻关入手,充分利用来自土壤和环境的养分资源,实现根层养分供应与高产作物需求在数量上匹配、时间上同步、空间上一致,同时提高作物产量和养分利用效率,协调作物高产与环境保护。<br>%P 915-924<br>%@ 0564-3929<br>%L 32-1119/P<br>%W CNKI<br>"
						]
					}
				],
				"traceid": "a7af1c2425ec49b5973f756b194256c6.191.17014617381526837"
			}
			// During debugging, manually throw errors to guide the program to run inward
			referText = false;
			throw ReferenceError;
			*/

			if (!referText.body) {
				Z.debug('Failed to retrieve data from API: GetExport');
				Z.debug(referText);
				throw ReferenceError;
			}
			referText = referText.data[2].value[0];
		}
		catch (error2) {
			// Value return from API is invalid, scrape metadata from webpage
			Z.debug('scraping from page...');
			if (!isSpace) {
				await scrapeDoc(doc, ids, cite);
			}
		}
	}
	if (referText) {
		Z.debug("Get referText from api successfuly!");
		// Z.debug(referText);
		referText = referText
			// breakline
			.replace(/<br>|\r/g, '\n')
			// split keywords
			.replace(/^%@ /, '%G')
			.replace(/^%K .*/gm, function (match) {
				return match.replace(/[,;，；]\s?/g, '\n%K ');
			})
			.replace(/^%V 0?/m, '%V ')
			.replace(/^%N 0?/m, '%N ')
			// \t in abstract
			.replace(/\t/g, '')
			.replace(/(\n\s*)+/g, '\n');
		// Z.debug(referText);
		var translator = Zotero.loadTranslator("import");
		// Refer/BibIX
		translator.setTranslator('881f60f2-0802-411a-9228-ce5f47b64c7d');
		translator.setString(referText);
		translator.setHandler('itemDone', (_obj, newItem) => {
			fixItem(newItem, doc, ids, cite);
			newItem.complete();
		});
		await translator.translate();
	}
}

async function scrapeDoc(doc, ids, cite) {
	var fieldMap = {
		title: 'div.doc h1',
		abstractNote: '#ChDivSummary, div.abstract-text',
		pages: 'div.doc p.total-inform span:nth-child(2)',
		university: 'div.doc h3:last-child',
	};
	var newItem = new Zotero.Item(getTypeFromDBName(ids));
	// Click to get a full abstract in a single article page
	let moreClick = doc.querySelector('span a#ChDivSummaryMore');
	if (moreClick) moreClick.click();
	newItem.abstractNote = text(doc, 'span#ChDivSummary');
	newItem.creators = Array.from(doc.querySelectorAll('div.doc h3#authorpart span'))
		.map(e => e.textContent.trim().replace(/[0-9,]/g, ''))
		.map(element => ZU.cleanAuthor(element, 'author'));
	let tags = Array.from(doc.querySelectorAll('div.doc p.keywords a')).map(element => ZU.trimInternal(element.innerText).replace(/[,;，；]$/, '')
	);
	// Keywords sometimes appear as a whole paragraph
	if (tags.length == 0) {
		tags = text(doc, 'div.doc p.keywords')
			.split(/\n/g);
	}
	newItem.tags = tags.map(element => ({ tag: element }));
	let pubInfo = innerText(doc, 'div.top-tip span');
	newItem.publicationTitle = tryMatch(pubInfo, /(.*?)\./, 1);
	newItem.date = tryMatch(pubInfo, /\d*?(?:,)/);
	newItem.volume = tryMatch(pubInfo, /(\d*)\s*\(/, 1);
	newItem.issue = tryMatch(pubInfo, /\(0?(\d+)\)/, 1);
	newItem.place = label2Text(doc, '会议地点');
	newItem.date = label2Text(doc, '会议时间');
	for (let field in fieldMap) {
		newItem[field] = text(doc, fieldMap[field]);
	}
	if (newItem.pages) newItem.pages = tryMatch(newItem.pages, /^页码：([\d,.+-]+)/, 1);
	fixItem(newItem, doc, ids, cite);
	newItem.complete();
}

/* 通过变量提升起效 */
function fixItem(newItem, doc, ids, cite) {
	newItem.abstractNote = newItem.abstractNote
		? newItem.abstractNote
			.replace(/\s*[\r\n]\s*/g, '\n')
			.replace(/&lt;.*?&gt;/g, '')
			.replace(/^＜正＞/, '')
		: '';
	if (cite) newItem.extra = `cite: ${cite}`;
	// Build a shorter url
	newItem.url = ids.url.includes("cnki.net")
		? ids.url
		: 'https://kns.cnki.net/KCMS/detail/detail.aspx?'
		+ `dbcode=${ids.dbcode}`
		+ `&dbname=${ids.dbname}`
		+ `&filename=${ids.filename}`
		+ `&v=`;
	// CNKI DOI
	if (!newItem.DOI) newItem.DOI = label2Text(doc, 'DOI');
	// CN 中国刊物编号，非refworks中的callNumber
	delete newItem.callNumber;
	for (var i = 0, n = newItem.creators.length; i < n; i++) {
		// 通过浅拷贝影响原数组
		var creator = newItem.creators[i];

		/* test CJK char */
		if (/[\u4e00-\u9fa5]/.test(creator.lastName)) {
			creator.fieldMode = 1;
		}
		if (newItem.itemType == 'thesis' && i != 0) {
			// Except first author are Advisors in thesis
			// Here is contributor
			creator.creatorType = 'contributor';
		}
	}
	if (doc.querySelector('.icon-shoufa')) {
		newItem.itemType = 'preprint';
		newItem.date = tryMatch(innerText(doc, '.head-time'), /：([\d-]*)/, 1);
	}

	/* add PDF/CAJ attachment */
	// If you want CAJ instead of PDF, set keepPDF = false
	// 如果你想将PDF文件替换为CAJ文件，将下面一行 keepPDF 设为 false
	var keepPDF = Z.getHiddenPref('CNKIPDF');
	if (keepPDF === undefined) keepPDF = true;
	if (ids.url.includes('KXReader/Detail')) {
		newItem.attachments.push({
			title: 'Snapshot',
			document: doc
		});
	}
	else {
		newItem.attachments = getAttachments(doc, keepPDF);
	}
}

// add pdf or caj to attachments, default is pdf
function getAttachments(doc, keepPDF) {
	var attachments = [];
	let pdfurl = attr(doc, 'a[id^="pdfDown"]', 'href');
	let cajurl = attr(doc, 'a#cajDown', 'href');
	if (keepPDF && pdfurl) {
		attachments.push({
			title: 'Full Text PDF',
			mimeType: 'application/pdf',
			url: pdfurl
		});
	}
	else {
	}
	else {
		attachments.push({
			title: 'Full Text CAJ',
			mimeType: 'application/caj',
			url: cajurl
		});
	}
	return attachments;
}

function label2Text(doc, label) {
	let data = Array.from(doc.querySelectorAll('div.doc span.rowtit'));
	let labelElement = data.find(element => element.innerText.startsWith(label));
	return labelElement
		? ZU.trimInternal(labelElement.nextElementSibling.innerText)
		: '';
}

function tryMatch(string, pattern, index = 0) {
	let match = string.match(pattern);
	return (match && match[index])
		? match[index]
		: '';
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFQ&dbname=CJFDLAST2015&filename=SPZZ201412003&v=MTU2MzMzcVRyV00xRnJDVVJMS2ZidVptRmkva1ZiL09OajNSZExHNEg5WE5yWTlGWjRSOGVYMUx1eFlTN0RoMVQ=",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "基于部分酸水解-亲水作用色谱-质谱的黄芪多糖结构表征",
				"creators": [
					{
						"firstName": "",
						"lastName": "梁图",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "傅青",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "辛华夏",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "李芳冰",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "金郁",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "梁鑫淼",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "2014",
				"abstractNote": "来自中药的水溶性多糖具有广谱治疗和低毒性特点,是天然药物及保健品研发中的重要组成部分。针对中药多糖结构复杂、难以表征的问题,本文以中药黄芪中的多糖为研究对象,采用\"自下而上\"法完成对黄芪多糖的表征。首先使用部分酸水解方法水解黄芪多糖,分别考察了水解时间、酸浓度和温度的影响。在适宜条件(4 h、1.5mol/L三氟乙酸、80℃)下,黄芪多糖被水解为特征性的寡糖片段。接下来,采用亲水作用色谱与质谱联用对黄芪多糖部分酸水解产物进行分离和结构表征。结果表明,提取得到的黄芪多糖主要为1→4连接线性葡聚糖,水解得到聚合度4~11的葡寡糖。本研究对其他中药多糖的表征具有一定的示范作用。",
				"archiveLocation": "CNKI",
				"issue": "12",
				"libraryCatalog": "CNKI",
				"pages": "1306-1312",
				"publicationTitle": "色谱",
				"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFQ&dbname=CJFDLAST2015&filename=SPZZ201412003&v=MTU2MzMzcVRyV00xRnJDVVJMS2ZidVptRmkva1ZiL09OajNSZExHNEg5WE5yWTlGWjRSOGVYMUx1eFlTN0RoMVQ=",
				"volume": "32",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "亲水作用色谱"
					},
					{
						"tag": "多糖"
					},
					{
						"tag": "表征"
					},
					{
						"tag": "质谱"
					},
					{
						"tag": "部分酸水解"
					},
					{
						"tag": "黄芪"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CMFD&dbname=CMFD201701&filename=1017045605.nh&v=MDc3ODZPZVorVnZGQ3ZrV3JyT1ZGMjZHYk84RzlmTXFwRWJQSVI4ZVgxTHV4WVM3RGgxVDNxVHJXTTFGckNVUkw=",
		"items": [
			{
				"itemType": "thesis",
				"title": "黄瓜共表达基因模块的识别及其特点分析",
				"creators": [
					{
						"firstName": "",
						"lastName": "林行众",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "黄三文;杨清",
						"creatorType": "contributor",
						"fieldMode": 1
					}
				],
				"date": "2017",
				"abstractNote": "黄瓜(Cucumis sativus L.)是我国最大的保护地栽培蔬菜作物,也是植物性别发育和维管束运输研究的重要模式植物。黄瓜基因组序列图谱已经构建完成,并且在此基础上又完成了全基因组SSR标记开发和涵盖330万个变异位点变异组图谱,成为黄瓜功能基因研究的重要平台和工具,相关转录组研究也有很多报道,不过共表达网络研究还是空白。本实验以温室型黄瓜9930为研究对象,选取10个不同组织,进行转录组测序,获得10份转录组原始数据。在对原始数据去除接头与低质量读段后,将高质量读段用Tophat2回贴到已经发表的栽培黄瓜基因组序列上。用Cufflinks对回贴后的数据计算FPKM值,获得10份组织的24274基因的表达量数据。计算结果中的回贴率比较理想,不过有些基因的表达量过低。为了防止表达量低的基因对结果的影响,将10份组织中表达量最大小于5的基因去除,得到16924个基因,进行下一步分析。共表达网络的构建过程是将上步获得的表达量数据,利用R语言中WGCNA(weighted gene co-expression network analysis)包构建共表达网络。结果得到的共表达网络包括1134个模块。这些模块中的基因表达模式类似,可以认为是共表达关系。不过结果中一些模块内基因间相关性同其他模块相比比较低,在分析过程中,将模块中基因相关性平均值低于0.9的模块都去除,最终得到839个模块,一共11,844个基因。共表达的基因因其表达模式类似而聚在一起,这些基因可能与10份组织存在特异性关联。为了计算模块与组织间的相关性,首先要对每个模块进行主成分分析(principle component analysis,PCA),获得特征基因(module eigengene,ME),特征基因可以表示这个模块所有基因共有的表达趋势。通过计算特征基因与组织间的相关性,从而挑选出组织特异性模块,这些模块一共有323个。利用topGO功能富集分析的结果表明这些特异性模块所富集的功能与组织相关。共表达基因在染色体上的物理位置经常是成簇分布的。按照基因间隔小于25kb为标准。分别对839个模块进行分析,结果发现在71个模块中共有220个cluster,这些cluster 一般有2～5个基因,cluster中的基因在功能上也表现出一定的联系。共表达基因可能受到相同的转录调控,这些基因在启动子前2kb可能会存在有相同的motif以供反式作用元...",
				"archiveLocation": "CNKI",
				"libraryCatalog": "CNKI",
				"thesisType": "硕士",
				"university": "南京农业大学",
				"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CMFD&dbname=CMFD201701&filename=1017045605.nh&v=MDc3ODZPZVorVnZGQ3ZrV3JyT1ZGMjZHYk84RzlmTXFwRWJQSVI4ZVgxTHV4WVM3RGgxVDNxVHJXTTFGckNVUkw=",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "共表达"
					},
					{
						"tag": "网络"
					},
					{
						"tag": "转录组"
					},
					{
						"tag": "黄瓜"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CPFD&dbname=CPFD9908&filename=OYDD199010001004&v=MDI5NTRITnI0OUZaZXNQQ0JOS3VoZGhuajk4VG5qcXF4ZEVlTU9VS3JpZlplWnZGeW5tVTdqSkpWb1RLalRQYXJLeEY5",
		"items": [
			{
				"itemType": "conferencePaper",
				"title": "辽西区新石器时代考古学文化纵横",
				"creators": [
					{
						"firstName": "",
						"lastName": "朱延平",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "1990",
				"abstractNote": "<正>辽西区的范围从大兴安岭南缘到渤海北岸,西起燕山西段,东止辽河平原,基本上包括内蒙古的赤峰市(原昭乌达盟)、哲里木盟西半部,辽宁省西部和河北省的承德、唐山、廊坊及其邻近的北京、天津等地区。这一地区的古人类遗存自旧石器时代晚期起,就与同属东北的辽东区有着明显的不同,在后来的发展中,构成自具特色的一个考古学文化区,对我国东北部起过不可忽视的作用。以下就辽西地区新石器时代的考古学文化序列、编年、谱系及有关问题简要地谈一下自己的认识。",
				"archiveLocation": "CNKI",
				"libraryCatalog": "CNKI",
				"pages": "6",
				"place": "中国内蒙古赤峰",
				"proceedingsTitle": "内蒙古东部地区考古学术研讨会",
				"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CPFD&dbname=CPFD9908&filename=OYDD199010001004&v=MDI5NTRITnI0OUZaZXNQQ0JOS3VoZGhuajk4VG5qcXF4ZEVlTU9VS3JpZlplWnZGeW5tVTdqSkpWb1RLalRQYXJLeEY5",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "兴隆洼文化"
					},
					{
						"tag": "努鲁儿虎山"
					},
					{
						"tag": "半坡文化"
					},
					{
						"tag": "夹砂陶"
					},
					{
						"tag": "富河文化"
					},
					{
						"tag": "小河沿文化"
					},
					{
						"tag": "庙底沟文化"
					},
					{
						"tag": "彩陶花纹"
					},
					{
						"tag": "文化纵横"
					},
					{
						"tag": "新石器时代考古"
					},
					{
						"tag": "红山文化"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://chn.oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDLAST2020&filename=ZGYK202012011&v=%25mmd2BHGGqe3MG%25mmd2FiWsTP5sBgemYG4X5LOYXSuyd0Rs%25mmd2FAl1mzrLs%25mmd2F7KNcFfXQMiFAipAgN",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "多芯片联合分析2型糖尿病发病相关基因及其与阿尔茨海默病的关系",
				"creators": [
					{
						"firstName": "",
						"lastName": "辛宁",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "陈建康",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "陈艳",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "杨洁",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "2020",
				"abstractNote": "目的利用生物信息学方法探索2型糖尿病发病的相关基因,并研究这些基因与阿尔茨海默病的关系。方法基因表达汇编(GEO)数据库下载GSE85192、GSE95849、GSE97760、GSE85426数据集,获得健康人和2型糖尿病患者外周血的差异基因,利用加权基因共表达网络(WGCNA)分析差异基因和临床性状的关系。使用DAVID数据库分析与2型糖尿病有关的差异基因的功能与相关通路,筛选关键蛋白。根据结果将Toll样受体4 (TLR4)作为关键基因,利用基因集富集分析(GSEA)分析GSE97760中与高表达TLR4基因相关的信号通路。通过GSE85426验证TLR4的表达量。结果富集分析显示,差异基因主要参与的生物学过程包括炎症反应、Toll样受体(TLR)信号通路、趋化因子产生的正向调节等。差异基因主要参与的信号通路有嘧啶代谢通路、TLR信号通路等。ILF2、TLR4、POLR2G、MMP9为2型糖尿病的关键基因。GSEA显示,TLR4上调可通过影响嘧啶代谢及TLR信号通路而导致2型糖尿病及阿尔茨海默病的发生。TLR4在阿尔茨海默病外周血中高表达。结论 ILF2、TLR4、POLR2G、MMP9为2型糖尿病发病的关键基因,TLR4基因上调与2型糖尿病、阿尔茨海默病发生有关。",
				"archiveLocation": "CNKI",
				"issue": "12",
				"libraryCatalog": "CNKI",
				"pages": "1106-1111+1117",
				"publicationTitle": "中国医科大学学报",
				"url": "https://chn.oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDLAST2020&filename=ZGYK202012011&v=%25mmd2BHGGqe3MG%25mmd2FiWsTP5sBgemYG4X5LOYXSuyd0Rs%25mmd2FAl1mzrLs%25mmd2F7KNcFfXQMiFAipAgN",
				"volume": "49",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "2型糖尿病"
					},
					{
						"tag": "基因芯片"
					},
					{
						"tag": "数据挖掘"
					},
					{
						"tag": "胰岛炎症反应"
					},
					{
						"tag": "阿尔茨海默病"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://kns.cnki.net/kcms2/article/abstract?v=xNq_RSSxttteWi24laindD_Rj8W4Qc8zBVUH7S-kB3QzbsnSxv7JK2GdFzXlM8uKnXjC3JSVVS0rjTApf3TFAG95ch3e_C55Sw9_OvZ1DPp-aH68S8lEFWlBDz7Blb1-3rCFg7Ww345NFlWs3qF4wD78_fGzs0XGw6lD-7rBgHQ=&uniplatform=NZKPT&language=CHS",
		"items": [
			{
				"itemType": "conferencePaper",
				"title": "转录组学和毒力基因调控揭示了异硫氰酸苄酯对金黄色葡萄球菌的抗菌机制",
				"creators": [
					{
						"firstName": "",
						"lastName": "刘佳楠",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "侯红漫",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "张公亮",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "2023",
				"DOI": "10.26914/c.cnkihy.2023.044794",
				"abstractNote": "金黄色葡萄球菌是一种常见的病原体,可引起多种严重感染。因此,需要高效实用的技术来对抗金黄色葡萄球菌。本研究利用转录组学评估了金黄色葡萄球菌在使用异硫氰酸苄酯(BITC)处理后的变化,以确定其抗菌作用。结果显示,与对照组相比,1/8 MIC BITC处理组有92个差异表达基因,其中42个基因下调。此外,我们还利用STRING分析揭示了34个基因编码的蛋白质相互作用。然后,我们通过qRT-PCR验证了三个重要的毒力基因,包括胶囊多糖合成酶(cp8F)、胶囊多糖生物合成蛋白(cp5D)和热核酸酶(nuc)。此外,还进行了分子对接分析,以研究BITC与cp8F、cp5D和nuc的编码蛋白的作用位点。结果表明,BITC与所选蛋白质的对接分数在-6.00至-6.60kcal/mol之间,证实了这些复合物的稳定性。BITC与这些蛋白质的氨基酸TRP (130)、GLY (10)、ILE (406)、LYS (368)、TYR (192)和ARG (114)形成疏水、氢键、π-π共轭相互作用。这些发现将有助于今后研究BITC对金黄色葡萄球菌的抗菌机制。",
				"archiveLocation": "CNKI",
				"libraryCatalog": "CNKI",
				"pages": "2",
				"place": "中国湖南长沙",
				"proceedingsTitle": "中国食品科学技术学会第二十届年会",
				"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CPFD&dbname=CPFDTEMP&filename=ZGSP202310001012&v=",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "下调"
					},
					{
						"tag": "异硫氰酸苄酯"
					},
					{
						"tag": "毒力基因"
					},
					{
						"tag": "转录组学"
					},
					{
						"tag": "金黄色葡萄球菌"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://kns.cnki.net/kcms2/article/abstract?v=xNq_RSSxttsA_W-tUYyezhhnNBiP3QvBRKpUZn5bnDbp-R-W30GzHvKGqQHzyXqr74thvQKnTSNk8tRq073D8-8itn0ZqpitZQuvUp1NKfe3-NqlObLOB3kMpqq_F9Yqm9IgtojbqTNFKF0iTw5LNgbmOP_enTcFJ9QlO_PwIgs=&uniplatform=NZKPT&language=CHS",
		"items": [
			{
				"itemType": "newspaperArticle",
				"title": "灭绝物种RNA首次分离测序",
				"creators": [
					{
						"firstName": "",
						"lastName": "刘霞",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "2023-09-21",
				"archiveLocation": "CNKI",
				"libraryCatalog": "CNKI",
				"pages": "004",
				"publicationTitle": "科技日报",
				"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CCND&dbname=CCNDLAST2023&filename=KJRB202309210044&v=",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://t.cnki.net/kcms/article/abstract?v=xNq_RSSxtttXhP9SP69wMjwcwnSNtz7xbvO0_2Ai5cAwr_ND2iars2pGW3KdmtkLjJ-0-Gtv1odozNwDqpFk0E1STZw5eW-MucmrF2C2xy9jKgvYle59nPCj0k5endRrlj7vYbRfbiw=&uniplatform=NZKPT",
		"items": [
			{
				"itemType": "conferencePaper",
				"title": "转录组学和毒力基因调控揭示了异硫氰酸苄酯对金黄色葡萄球菌的抗菌机制",
				"creators": [
					{
						"firstName": "",
						"lastName": "王腾",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "冯会康",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "乔文涛",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "苏佶智",
						"creatorType": "author",
						"fieldMode": 1
					},
					{
						"firstName": "",
						"lastName": "王丽欢",
						"creatorType": "author",
						"fieldMode": 1
					}
				],
				"date": "2022",
				"DOI": "10.13206/j.gjgS22031502",
				"abstractNote": "金属面夹芯板以其保温绝热、降噪、自重轻和装配效率高等优点在围护结构中得到了很好的应用，基于金属面夹芯板的构造，提出一种新型的压型钢板与聚氨酯组合的夹芯楼板结构。为了研究压型钢板-聚氨酯夹芯楼板的受弯性能，对夹芯楼板试件进行了两点对称静载试验。在试验的基础上，提出并验证了夹芯楼板有限元模型，并对槽钢楼板厚度、压型钢板厚度和聚氨酯密度等进行了参数分析。研究结果表明：夹芯楼板的破坏形式主要表现为挠度过大，最大挠度达到了板跨度的1/42,并且跨中截面处的槽钢出现畸变屈曲；夹芯楼板受弯变形后，槽钢首先达到屈服状态，而受压钢板的材料性能未能得到充分发挥；新型压型钢板聚氨酯夹芯楼板相比传统金属面夹芯板的承载能力和刚度有明显提升，承载力和刚度均提高203%;楼板厚度和压型钢板厚度对夹芯楼板的承载能力和刚度均具有显著影响，而楼板厚度相比压型钢板厚度对刚度的影响效果更明显，当楼板厚度从120 mm增大到160 mm时，夹芯楼板的承载力在正常使用状态下提高87%,在承载能力极限状态下提高63%,刚度提高88%,钢板厚度由1 mm增至3 mm时，夹芯楼板的承载力在正常使用状态下提高59%,在承载能力极限状态下提高84%,刚度提高61%;聚氨酯泡沫密度的变化对夹芯楼板的承载能力和刚度影响较小，当密度从45 kg/m~3变化到90 kg/m~3时，正常使用状态下夹芯楼板的承载力增幅为12%,承载能力极限状态下的承载力增幅仅为2%,刚度增幅为12%。",
				"archiveLocation": "CNKI",
				"issue": "8",
				"libraryCatalog": "CNKI",
				"pages": "9-16",
				"publicationTitle": "钢结构(中英文)",
				"url": "https://kns.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDLAST2022&filename=GJIG202208002&v=",
				"volume": "37",
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "压型钢板"
					},
					{
						"tag": "受弯性能"
					},
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					}
				],
				"tags": [
					{
						"tag": "RNA"
					},
					{
						"tag": "转录组"
					}
				],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
