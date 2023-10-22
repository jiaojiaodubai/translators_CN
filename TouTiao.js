{
	"translatorID": "934bfb30-033b-4328-8621-f8f89559ea48",
	"label": "TouTiao",
	"creator": "jiaojiaoduabi23",
	"target": "^https://www\\.toutiao\\.com",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2023-10-22 04:36:07"
}

/*
    ***** BEGIN LICENSE BLOCK *****

    Copyright © 2022 jiaojiaodubai23 <jiaojiaodubai23@gmail.com>

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


function detectWeb(doc, url) {
	if (url.includes('/article/')) {
		return 'forumPost';
	}
	else if (getSearchResults(doc, true)) {
		return 'multiple';
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = doc.querySelectorAll('div[class^="feed-card-article"] > a[href*="/article/"]');
	for (let row of rows) {
		let href = row.href;
		let title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

async function doWeb(doc, url) {
	if (detectWeb(doc, url) == 'multiple') {
		let items = await Zotero.selectItems(getSearchResults(doc, false));
		if (!items) return;
		for (let url of Object.keys(items)) {
			try {
				await scrape(await requestDocument(url));
			}
			catch (erro) {}
			
		}
	}
	else {
		await scrape(doc, url);
	}
}

function matchCreator(creator) {
	if (creator.search(/[A-Za-z]/) !== -1) {
		creator = ZU.cleanAuthor(creator, 'author');
	}
	else {
		creator = creator.replace(/\s/g, '');
		creator = {
			lastName: creator,
			creatorType: 'author',
			fieldMode: true
		}
	}
	return creator;
}

async function scrape(doc, url = doc.location.href) {
	var newItem = new Z.Item('forumPost');
	newItem.title = doc.querySelector('.article-content > h1').innerText;
	newItem.date = doc.querySelector('.article-meta > span:nth-child(2)').innerText;
	newItem.creators = Array.from(doc.querySelectorAll('.article-meta > span.name > a')).map((element) => (
		matchCreator(element.textContent)
	));
	newItem.forumTitle = '今日头条';
	newItem.language = 'zh-CN';
	newItem.url = url;
	newItem.attachments.push({
		title: 'Snapshot',
		document: doc
	});
	let content = doc.getElementsByTagName('article')[0].innerHTML;
	content = `<h1>${newItem.title}</h1>` + content;
	newItem.notes.push({note: content});
	newItem.complete();
}
/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.toutiao.com/article/7292231575213785650",
		"items": [
			{
				"itemType": "forumPost",
				"title": "人民网评：这个“世界第一”启发乡村旅游新路径",
				"creators": [
					{
						"lastName": "人民网",
						"creatorType": "author",
						"fieldMode": true
					}
				],
				"date": "2023-10-21 10:22",
				"forumTitle": "今日头条",
				"language": "zh-CN",
				"url": "https://www.toutiao.com/article/7292231575213785650",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [
					"我国新增4个!总数位列世界第一。\n\n当地时间10月19日，联合国世界旅游组织全体大会第25届会议在乌兹别克斯坦撒马尔罕公布2023年联合国世界旅游组织“最佳旅游乡村”名单，我国江西篁岭村、浙江下姜村、甘肃扎尕那村和陕西朱家湾村入选。加上2021年入选的浙江余村、安徽西递村和2022年入选的广西大寨村、重庆荆竹村，中国入选乡村总数达到8个，位列世界第一。\n\n联合国世界旅游组织于2021年启动“最佳旅游乡村”评选，旨在通过旅游促进乡村文化遗产保护和可持续发展。短短三年时间，我国共有8个乡村入选，拿下“世界第一”的称号，这充分说明评选组织对入选乡村旅游环境、保护力度和发展活力的肯定，彰显出我国在乡村文化遗产保护和可持续发展上，取得的显著成效。\n\n乡村美则国家美。乡村首先要能留住乡风乡韵乡愁。近年来，各地开展了诸如“中国最美休闲乡村”“中国美丽田园”“寻找中国最美乡村”“中国乡村旅游模范村”等推介活动，促进乡村的保护、建设、治理和发展。此次新增的4个乡村，之所以能获得“世界大奖”，正是着眼于乡村文化遗产保护的典范示例。\n\n比如，距今已有580多年历史的江西篁岭村，现存100多栋明清古建，当地“晒秋”也成为“网红”景观。如何切实保护好这些“百年文物”，是一个重要课题。当地在实践中，摸索出不破坏古建，将传统村落风貌的保存保护和活态非遗相结合的经验；又如，有800多年历史的浙江下姜村，近年来积极恢复生态环境，一步一个脚印，改善村容村貌，实现了从“穷脏差”到“绿富美”的转变，“穷山沟”终于变为“聚宝盆”。如今，当地村民既能感受乡韵乡愁、祖辈记忆，游客也能领略百年历史文化的魅力。\n\n乡村要发展，保护是基础，可持续发展是出路。旅游作为乡村发展的一个路子，走稳走远需要扎根实际，用智慧将自然和文化优势转化为发展优势。\n\n甘肃扎尕那村，平均海拔2800米以上。当地利用独特的自然和人文景观，民俗风情，摸索出保护与发展的平衡点，以乡村旅游反哺生态保护、促进各民族交往交流交融。而陕西朱家湾村则深入挖掘文化资源，让秦岭老屋、古道遗迹、柞水渔鼓、民间社火、古法酿酒等文化遗产焕发生机，以文塑旅、以旅彰文。不同乡村在实践中摸索积累的珍贵发展经验，正是乡村结合实际，探索可持续发展优势和活力的生动体现。\n\n收获“世界第一”并不是保护和发展的终点。某种意义上，随着名气、关注度、游客的增多，对入选的“最佳旅游乡村”的考验，才刚刚开始。怎样继续平衡好保护和发展的课题，杜绝乡村过度商业化；如何完善旅游细节，提升游客服务保障；在人气飙升后，能否挖潜新的特色发展元素，让乡村旅游带动村民增收致富？这些疑问，都考验着入选乡村和当地相关部门。\n\n“最佳旅游乡村”，重要的不是荣誉，而是责任。“最佳旅游乡村”数量“世界第一”的背后，写满了对未来实践的期待。同时，启示我们无论何时何地，乡村的保护和发展，必须要留得住乡风乡韵乡愁，在科学可持续发展中，提升人们的幸福感、获得感。"
				],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
