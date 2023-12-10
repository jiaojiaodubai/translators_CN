# TODO

## 未通过ESLint

- [x] CNKI
- [x] Dangdang
- [x] Duxiu
- [ ] GFSOSO
  - 暂缓，缺少测试用例，无法校对。
  - 暂缓，网站有较大改动，需要原作者重新适配。
- [ ] National Public Service Platform for Standards Information - China
  - 暂缓，网站有较大改动，需要原作者重新适配。
- [x] Ncpssd
- [x] Nlc.cn
  - 备注：建议添加测试用例。
- [ ] People's Daily
- [x] ProQuestCN Thesis
  - 备注：建议添加测试用例。
- [x] Soopat
  - 备注：缺少帐号，无法测试。
- [x] SuperLib
- [ ] Wanfang Data
- [ ] Weixin
- [ ] Wenjin
- [ ] xiaoyuzhoufm
- [ ] Zhihu

## `ZU.do*()`遗留

- [x] Baidu Scholar
- [ ] GFSOSO
  - 暂缓，缺少测试用例，无法校对。
  - 暂缓，网站有较大改动，需要原作者重新适配。
- [x] Soopat
- [ ] Wenjin

## 未使用`async`和`awaite`执行异步操作

- [x] Baidu Scholar
- [x] Bilibili
- [x] Dangdang
- [ ] Douban
  - 暂缓，有未合并的pull request。
- [x] dpaper
- [ ] GFSOSO
  - 暂缓，缺少测试用例，无法校对。
  - 暂缓，网站有较大改动，需要原作者重新适配。
- [x] Jd
- [ ] translators_CN\National Public Service Platform for Standards Information
  - 暂缓，网站有较大改动，需要原作者重新适配。
- [ ] National Standards Open System - China
- [ ] People's Daily
  - 暂缓，网站有较大改动，需要原作者重新适配。
- [x] ProQuestCN Thesis
  - 备注：建议添加测试用例。
- [ ] Spc.org.cn
- [x] SuperLib
- [ ] Wanfang Data
- [ ] Weixin
- [ ] Wenjin
- [ ] xiaoyuzhoufm

## 其他

- [x] Cubox
  - [x] `header`缺少必要信息
  - [x] 缺`data.json`记录

## 开发建议

1. 克隆^[1] [官方仓库](https://github.com/zotero/translators/blob/master)到本地后，在终端跳转到trnslators目录，输入`npm install`以启用ESLint。
2. 对于使用VS Code的开发者，将`.vscode`文件夹移动到**官方仓库克隆文件夹下的master分支**下，在**官方仓库克隆文件夹下的master分支**分支完成开发后，使用快捷键 <kbd>F5</kbd> 调用 ESLint。
3. 不使用VS Code的开发者，完成 1. 的基础上，在**官方仓库克隆文件夹下的master分支**开发完成后，在终端输入`npm run lint -- "xxx.js" --fix`调用 ESLint。
4. 将本仓库的`check_data.py`移动到translators_CN的开发目录下，在提交前运行`check_data.py`检查是否已填写汉化文件`data.json`。

[1] 注：如果你clone官方仓库有困难，可以下载官方仓库的`.zip`包，解压后在终端输入`git init`以便继续使用`npm install`。
