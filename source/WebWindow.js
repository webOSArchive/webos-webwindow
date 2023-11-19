var autoReloadInterval;
enyo.kind({
	name: "WebWindow",
	kind: enyo.HFlexBox,
	dockWindow: null,
	appWindow: null,
	exhibitionMode: false,
	bookmarkData: [ { caption: "webOS Archive News", value: "http://www.webosarchive.org/news.php"}],
	homeUrl: "",
	helpUrl: "file:///media/cryptofs/apps/usr/palm/applications/org.webosarchive.webwindow/help.html",
	currentUrl: "",
	currentTitle: "",
	currentlyLoading: false,
	autoReloadTime: 0,
	inputConfirmCallBack: this.confirmInputPopup,
	inputCancelCallBack: this.cancelInputPopup,
	popupMessageCallBack: this.closePopupMessage,
	components: [
		{ kind: "ApplicationEvents", onLoad: "initBrowser", onApplicationRelaunch: "applicationRelaunchHandler" },
		{ name: "Updater", kind: "Helpers.Updater" },
		{ name: "Sharing", kind: "Helpers.Sharing" },
		{ name: "stService", kind: "PalmService", service: "palm://com.palm.stservice/", timeout: 500},
		{ name: "browserPanels", kind: "SlidingPane", flex: 1, multiView: true, components: [
			{name: "bookmarksPane", width: "280px", components: [
				{kind: "Header", className: "enyo-header-dark", components: [
					{w: "fill", content:"Playlist", domStyles: {"font-weight": "bold"}},
				]},
				{kind: "Scroller", flex:1, components: [
					{ name: "bookmarkList", kind: "VirtualRepeater", flex: 1, onSetupRow: "renderBookmarks", components: [
						{ kind: "SwipeableItem", layoutKind: "HFlexLayout", tapHighlight: true, onclick:"selectBookmark", onConfirm: "deleteBookmark", components: [
							{name: "itemCaption", flex: 1},
						]}
					]},
				]},
				{kind: "Toolbar", components: [
					{kind: "Button", name:"btnAddBookmark", className: "enyo-button-dark", caption: "Add", disabled: true, onclick: "promptAddBookmark"},
				]}
			]},
			{name: "browsingPane", components: [
				{kind:enyo.VFlexBox, flex:1, components: [
					{flex: 1, kind: "Pane", components: [
						{kind: "WebView", enableJavascript: true, onLoadStarted: "pageLoading", onLoadComplete: "pageLoaded", onPageTitleChanged: "pageChanged", onError: "pageError"},
					]},
					{kind: "Toolbar", name: "toolbarBrowse", components: [
						{kind: "GrabButton"},
						{kind: "Button", name:"btnHome", className: "enyo-button-dark", caption: "Home", onclick: "doGoHome"},
						{kind: "Button", name:"btnGoUrl", className: "enyo-button-dark", caption: "Go...", onclick: "promptgoToUrlLocally"},
						{kind: "Button", name:"btnReload", className: "enyo-button-dark", caption: "Reload", disabled:true, onclick: "doReload"},
						{kind: "Button", name:"btnAutoReload", className: "enyo-button-dark", caption: "Auto Reload", disabled:true, onclick: "showReloadOptions"},
						{kind: "Button", name:"btnShare", className: "enyo-button-dark", caption: "Share", disabled:true, onclick: "showShareOptions"},
					]}
				]},
			]},
		]},
		{kind: "AppMenu", onBeforeOpen: "toggleAppMenuItems", components: [
			{kind: "EditMenu"},
			{kind: "MenuItem", name:"menuHomePage", caption: "Set Home Page", onclick: "promptSetHomeUrl"},
			{kind: "MenuCheckItem", name:"menuUsePlaylist", caption: "Use Playlist", onclick: "setUsePlaylist"},
			{kind: "MenuItem", name:"menuHelp", caption: "Help", onclick: "showHelpContent"},
		]},
		{kind: "Popup", name: "loadingPopup", lazy: false, layoutKind: "VFlexLayout", style: "width: 300px;height:240px", components: [
			{ layoutKind: "HFlexLayout", pack: "center", components: [
				{content:"Requesting Page..."},
			]},
			{ layoutKind: "HFlexLayout", pack: "center", components: [
				{kind: "SpinnerLarge", name:"spinner" },
			]},
			{ layoutKind: "HFlexLayout", pack: "center", components: [
				{ kind: "Button", caption: "Stop", onclick: "doStopLoad" },
			]}
		]},
		{kind: "Popup", name: "inputPopup", lazy: false, layoutKind: "VFlexLayout", style: "width: 580px;height:260px", components: [
			{ layoutKind: "HFlexLayout", pack: "center", components: [
				{ name:"promptTitle", content: "Input:", domStyles: {"font-weight": "bold"} },
			]},
			{ kind: "BasicScroller", flex: 1, components: [
				{ name: "promptMessage", kind: "HtmlContent", flex: 1, pack: "center", align: "left", style: "text-align: left;padding-top:10px;padding-bottom: 10px" },
				{ name: "inputText", kind: "Input", spellcheck: false, autoWordComplete: false, autoCapitalize:"lowercase", alwaysLooksFocused: true, selectAllOnFocus: false },
				{ name: "inputShortcuts", layoutKind: "HFlexLayout", pack: "center", showing:false, components: [
					{ kind: "Button", caption: "http://", onclick: "inputHTTP" },
					{ kind: "Button", caption: "https://", onclick: "inputHTTPS" },
					{ kind: "Button", caption: ".com", onclick: "inputDotCom" },
					{ kind: "Button", caption: ".net", onclick: "inputDotNet" },
					{ kind: "Button", caption: ".org", onclick: "inputDotOrg" },
				]},
			]},
			{ layoutKind: "HFlexLayout", pack: "center", components: [
				{ kind: "Button", caption: "OK", onclick: "inputConfirmCallBack" },
				{ kind: "Button", caption: "Cancel", onclick: "inputCancelCallBack" },
			]}
		]},
		{kind: "Popup", name: "messagePopup", lazy: false, layoutKind: "VFlexLayout", style: "width: 510px;height:260px", components: [
			{ layoutKind: "HFlexLayout", pack: "center", components: [
				{ name:"popupTitle", content: "Input:", domStyles: {"font-weight": "bold"} },
			]},
			{ kind: "BasicScroller", flex: 1, components: [
				{ name: "popupMessage", kind: "HtmlContent", flex: 1, pack: "center", align: "left", style: "text-align: left;padding-top:10px;padding-bottom: 10px" },
			]},
			{ layoutKind: "HFlexLayout", pack: "center", components: [
				{ kind: "Button", caption: "OK", onclick: "popupMessageCallBack" },
			]}
		]},
		{kind: "Menu", name:"ReloadMenu", onBeforeOpen: "checkAutoReloadPref", components: [
			{ kind: "MenuCheckItem", caption: "Manually", value: 0, checked: true, onclick: "reloadOptionClicked" },
			{ kind: "MenuCheckItem", caption: "30 Seconds", value: 30, onclick: "reloadOptionClicked" },
			{ kind: "MenuCheckItem", caption: "1 Minute", value: 60, onclick: "reloadOptionClicked" },
			{ kind: "MenuCheckItem", caption: "2 Minutes", value: 120, onclick: "reloadOptionClicked" },
			{ kind: "MenuCheckItem", caption: "3 Minutes", value: 180, onclick: "reloadOptionClicked" },
			{ kind: "MenuCheckItem", caption: "5 Minutes", value: 300, onclick: "reloadOptionClicked" },
			{ kind: "MenuCheckItem", caption: "10 Minutes", value: 600, onclick: "reloadOptionClicked" },
			{ kind: "MenuCheckItem", caption: "15 Minutes", value: 900, onclick: "reloadOptionClicked" },
			{ kind: "MenuCheckItem", caption: "30 Minutes", value: 1800, onclick: "reloadOptionClicked" },
		]},
		{kind: "Menu", name:"ShareMenu", components: [
			{ kind: "MenuItem", caption: "Touch2Share Ready!", disabled: true},
			{ kind: "MenuItem", caption: "Copy URL", value: "clipboard", onclick: "shareOptionClicked" },
			{ kind: "MenuItem", caption: "Built-in browser", value: "browser", onclick: "shareOptionClicked" },
			{ kind: "MenuItem", caption: "E-mail", value: "email", onclick: "shareOptionClicked" },
			{ kind: "MenuItem", caption: "Messaging", value:"messaging", onclick: "shareOptionClicked" },
			{ kind: "MenuItem", caption: "SimpleChat", value:"simplechat", onclick: "shareOptionClicked" },
			{ kind: "MenuItem", caption: "ShareSpace", value:"sharespace", onclick: "shareOptionClicked" },
		]},
	],

	initBrowser: function(inSender) {
		var params = enyo.windowParams;
		enyo.log("Web Window launched with params: " + JSON.stringify(params));
		if (params && params.dockMode) {
			this.exhibitionMode = true;
			this.$.toolbarBrowse.hide();
		} else {
			this.exhibitionMode = false;
			this.$.toolbarBrowse.show();
		}
		this.homeUrl = this.getCookie("homeUrl", this.homeUrl);
		this.autoReloadTime = this.getCookie("autoReloadTime", this.autoReloadTime);
		this.usePlaylist = this.getCookie("usePlaylist", this.usePlaylist);
		if (this.homeUrl && this.homeUrl != "") {
			this.goToUrlLocally(this.homeUrl);
			this.startAutoReloadTimer();
		} else {
			//First run
			this.goToUrlLocally(this.helpUrl);
		}
		this.loadBookmarks();
		this.$.browserPanels.selectViewByIndex(1);
		props = {
			blockScreenTimeout: true
		}
		this.$.Updater.CheckForUpdate("Web Window");
		enyo.windows.setWindowProperties(window, props);
	},
	applicationRelaunchHandler: function(inSender) {
		var params = enyo.windowParams;
		enyo.log("Web Window re-launched with params: " + JSON.stringify(params));
		if (params) {
			if (params.sendDataToShare !== undefined) {
				enyo.warn("************ Touch2Share invoked! Sending url: " + this.currentUrl);
				this.$.stService.call({data: {target: this.currentUrl, type: "rawdata", mimetype: "text/html"}}, {method: "shareData"});
				return true;
			}
			else if (params.dockMode) {
				enyo.warn("************ Launching in Dock Mode");
				try {
					dockWindow = enyo.windows.fetchWindow("ExhibitionView");
					enyo.windows.activateWindow(dockWindow);
				} catch (ex) {
					this.dockWindow = enyo.windows.activate("index.html","ExhibitionView",{},{window:"dockMode"});
				}
				this.exhibitionMode = true;
			}
			else {
				enyo.info("************ Launching in REGULAR Mode");
				try {
					appWindow = enyo.windows.fetchWindow("InteractiveView");
					enyo.windows.activateWindow(appWindow);
				} catch (ex) {
					appWindow = enyo.windows.activate("index.html", "InteractiveView", params);
				}
				this.exhibitionMode = false;
			}
		}
	},
	startAutoReloadTimer: function () {
		enyo.warn("Clearing autoreload timer");
		window.clearInterval(autoReloadInterval);
		enyo.warn("Setting autoreload timer to " + this.autoReloadTime);
		if (this.autoReloadTime != 0) {
			if (this.autoReloadTime !== false && this.autoReloadTime != 0) {
				updateTimer = window.setInterval(function () { 
					this.doNextTimerLoad();
				}.bind(this), this.autoReloadTime * 1000);
			}	
		}
	},
	checkAutoReloadPref: function(inSender) {
		var menuOpts = inSender.getControls();
		for (var i=0;i<menuOpts.length;i++) {
			if (menuOpts[i].value == this.autoReloadTime) {
				menuOpts[i].setChecked(true)
			} else {
				menuOpts[i].setChecked(false);	
			}
		}
	},
    loadBookmarks: function(transaction, results) {
        this.bookmarkData = this.getCookie("bookmarks", this.bookmarkData);
		this.$.bookmarkList.render();
    },
	goToUrlLocally: function(inUrl) {
		this.$.webView.setUrl(inUrl);
	},
	pageLoading: function() {
		this.currentlyLoading = true;
		this.disableControls();
		this.$.spinner.show();
		this.$.loadingPopup.openAtCenter();
	},
	pageLoaded: function() {
		this.currentlyLoading = false;
		enyo.log("completed loading url: " + this.$.webView.url + " with: " + document.title);
		this.enableControls();
		this.$.spinner.hide();
		this.$.loadingPopup.close();
	},
	pageChanged: function(inSender, inTitle, inUrl, inBack, inForward) {
		var useUrl = inTitle.replace("WRP ", "");
		//this was a local render, use actual url
		useUrl = inUrl;
		this.currentUrl = useUrl;
		enyo.log("new url: " + useUrl);	
		var useTitle = useUrl.replace("http://", "");
		useTitle = useTitle.replace("https://", "");
		var pos = useTitle.lastIndexOf('/');
		useTitle = useTitle.substring(0,pos) + "" + useTitle.substring(pos+1);
		this.currentTitle = useTitle;
		enyo.log("new title: " + useTitle);
	},
	pageError: function(inSender, inErrorCode, inMsg) {
		this.currentlyLoading = false;
		switch (inErrorCode) {
			case 1000:
				enyo.log("Page load: Cancelled");
				break;
			case 1005:
				enyo.warn("Page load: No Internet!");
				this.doStopLoad();
				this.popupMessage("Load Error", "No internet connection. Check connectivity and proxy settings on your device.", this.closePopupMessage);
				break;
			case 2006:
				enyo.warn("Page load: Could not resolve host!");
				this.doStopLoad();
				this.popupMessage("Load Error", "The requested host did not respond. Check that the correct path is set. Also check proxy settings on your device.", this.closePopupMessage);
				break;
			case 2035:
				enyo.warn("Page load: SSL error!");
				this.doStopLoad();
				this.popupMessage("Load Error", "The requested page could not be loaded due to a SSL error. Check proxy settings on your device.", this.closePopupMessage);
				break;
			default:
				enyo.warn("Page load: Error: " + inErrorCode + ", " + inMsg);
				this.doStopLoad();
				this.popupMessage("Load Error", "The requested page could not be loaded. Ensure the correct path is set.<br>" + inMsg, this.closePopupMessage)	
		}
	},
	toggleAppMenuItems: function() {
		this.$.menuHomePage.setDisabled(this.currentlyLoading);
		this.$.menuHelp.setDisabled(this.currentlyLoading);
		if (this.usePlaylist) {
			this.$.menuUsePlaylist.setChecked(true)
		} else {
			this.$.menuUsePlaylist.setChecked(false);	
		}
	},
	disableControls: function() {
		this.$.btnAddBookmark.setDisabled(true);
		this.$.btnHome.setDisabled(true);
		this.$.btnGoUrl.setDisabled(true);
		this.$.btnReload.setDisabled(true);
		this.$.btnAutoReload.setDisabled(true);
		this.$.btnShare.setDisabled(true);
	},
	enableControls: function() {
		this.$.btnHome.setDisabled(false);
		this.$.btnGoUrl.setDisabled(false);
		if (this.currentUrl != "") {
			this.$.btnAddBookmark.setDisabled(false);
			this.$.btnReload.setDisabled(false);
			this.$.btnAutoReload.setDisabled(false);
			this.$.btnShare.setDisabled(false);
		}
	},
	promptSetHomeUrl: function(inSender) {
		useHomeUrl = decodeURI(this.homeUrl);
		this.getUserInputFromPopup("Home Page", "URL of Home Page:", useHomeUrl, true, this.doSetHomeUrl, this.cancelInputPopup);
	},
	setUsePlaylist: function(inSender) {
		if (this.usePlaylist) {
			this.usePlaylist = false;
		} else {
			this.usePlaylist = true;
		}
		this.setCookie("usePlaylist", this.usePlaylist);
	},
	doSetHomeUrl: function() {
		this.homeUrl = this.$.inputText.getValue();
		this.cancelInputPopup();
		enyo.log("set homeUrl: ", this.homeUrl);
		this.setCookie("homeUrl", this.homeUrl);
	},
	promptAddBookmark: function(inSender) {
		this.getUserInputFromPopup("New Bookmark", "Name of Bookmark:", this.currentTitle, false, this.doAddBookmark, this.cancelInputPopup);
	},
	doAddBookmark: function() {
		this.currentTitle = this.$.inputText.getValue();
		this.cancelInputPopup();
		enyo.log("add bookmark: ", this.currentUrl, this.currentTitle);
		var newBookmark = {
			caption: this.currentTitle,
			value: this.currentUrl
		}
		this.bookmarkData.push(newBookmark);
		this.setCookie("bookmarks", this.bookmarkData);
		this.$.bookmarkList.render();
	},
	renderBookmarks: function(inSender, inIndex) {
		enyo.log("rendering bookmarks: " + JSON.stringify(this.bookmarkData));
		if (this.bookmarkData && inIndex < this.bookmarkData.length) {
			var record = this.bookmarkData[inIndex];
			if (record) {
				if (record) {
					this.$.itemCaption.setContent(record.caption);
					return true;
				}
			} else {
				enyo.log("hit null record");
				return false;
			}
		}
	},
	selectBookmark: function(inSender, inEvent) {
		var selected = this.bookmarkData[inEvent.rowIndex];
		enyo.log("selected: " + JSON.stringify(selected));
		this.goToUrlLocally(selected.value);
	},
	deleteBookmark: function(inSender, inIndex) {
        this.bookmarkData.splice(inIndex, 1);
        this.setCookie("bookmarks", this.bookmarkData);
        this.$.bookmarkList.render();
    },
	showHelpContent: function() {
		this.goToUrlLocally(this.helpUrl);
	},
	doGoHome: function () {
		this.goToUrlLocally(this.homeUrl);
	},
	doReload: function() {
		this.goToUrlLocally(this.currentUrl);
	},
	doNextTimerLoad: function() {
		if (!this.usePlaylist) {
			enyo.log("reloading from timer");
			this.doReload();
		} else {
			var useNext = 0;
			var useUrl = this.homeUrl;
			//Check if there are bookmarks
			enyo.log("bookmark data is: " + this.bookmarkData);
			if (this.bookmarkData.length > 0) {
				for (var i=0;i<this.bookmarkData.length;i++) {
					if (this.currentUrl == this.bookmarkData[i].value) {
						enyo.log("found currently loaded bookmark" + this.bookmarkData[i].value);
						useNext = i + 1;
					} else {
						enyo.log("this is not the current bookmark:" + this.bookmarkData[i].value + ", vs: " + this.currentUrl);
					}
				}
			}
			enyo.log("next bookmark index is: " + (useNext));
			//If there's no next bookmark, go back to home
			if (useNext >= this.bookmarkData.length) {
				enyo.log("next bookmark index is out of range, go to home");
				useUrl = this.homeUrl;
			} else { 	//Otherwise use the next bookmark
				enyo.log("using bookmark:" + JSON.stringify(this.bookmarkData[useNext]));
				useUrl = this.bookmarkData[useNext].value;
			}
			this.goToUrlLocally(useUrl);
		}
	},
	promptRenderLocally: function() {
		this.popupMessage("SSL Warning", "Local rendering may require a SSL Proxy", this.doRenderLocally);
	},
	doRenderLocally: function() {
		this.closePopupMessage();
		var useUrl = this.currentUrl.replace("https://", "http://");
		this.goToUrlLocally(useUrl);
	},
	doStopLoad: function() {
		enyo.log("Stopping WebView load at user request...");
		this.$.webView.stopLoad();
		this.$.loadingPopup.close();
		this.enableControls();
		this.currentlyLoading = false;
	},
	showReloadOptions: function() {
		this.$.ReloadMenu.openAtControl(this.$.btnAutoReload);
	},
	reloadOptionClicked: function (inSender) {
		enyo.log("Auto reload option clicked: " + inSender.value);
		this.setCookie("autoReloadTime", inSender.value);
		this.autoReloadTime = inSender.value;
		this.startAutoReloadTimer();
	},
	showShareOptions: function() {
		this.$.ShareMenu.openAtControl(this.$.btnShare);
	},
	shareOptionClicked: function(inSender) {
		enyo.log("Share option clicked: " + inSender.value);
		this.$.Sharing.ShareWithTarget(inSender.value, "Check out this cool web page:", this.currentUrl);
	},
	promptgoToUrlLocally: function() {
		this.getUserInputFromPopup("Go To...", "Search string or URL to navigate to:", "", true, this.dogoToUrlLocally, this.cancelInputPopup);
	},
	dogoToUrlLocally: function() {
		newUrl = this.$.inputText.getValue();
		this.cancelInputPopup();
		if (newUrl != "") {
			newUrl = newUrl.toLowerCase();
			enyo.log("User entered URL: ", newUrl);
			this.goToUrlLocally(newUrl);	
		}
	},
	goToUrlLocally: function(newUrl) {
		enyo.log("navigating to new url via built-in renderer: " + newUrl);
		this.$.webView.setUrl(newUrl);
	},
	getUserInputFromPopup: function(title, message, defaultValue, showShortcuts, confirmCallback, cancelCallback) {
		this.$.inputText.setValue(defaultValue);
		this.$.promptTitle.setContent(title);
		this.$.promptMessage.setContent(message);
		if (showShortcuts) {
			this.$.inputShortcuts.setShowing(true);
		} else {
			this.$.inputShortcuts.setShowing(false);
		}
		if (confirmCallback)
			this.inputConfirmCallBack = confirmCallback;
		if (cancelCallback)
			this.inputCancelCallBack = cancelCallback;
		this.$.inputPopup.openAtCenter();
		this.$.inputText.forceFocus();
	},
	confirmInputPopup: function(inSender) {
		this.cancelInputPopup();
	},
	cancelInputPopup: function(inSender) {
		enyo.log("closing popup!");
		this.$.spinner.hide();
		this.$.inputPopup.close();
	},
	inputHTTP: function() {
		this.$.inputText.setValue("http://" + this.$.inputText.getValue());
		this.$.inputText.forceFocus();
	},
	inputHTTPS: function() {
		this.$.inputText.setValue("https://" + this.$.inputText.getValue());
		this.$.inputText.forceFocus();
	},
	inputDotCom: function() {
		this.$.inputText.setValue(this.$.inputText.getValue() + ".com");
		this.$.inputText.forceFocus();
	},
	inputDotNet: function() {
		this.$.inputText.setValue(this.$.inputText.getValue() + ".net");
		this.$.inputText.forceFocus();
	},
	inputDotOrg: function() {
		this.$.inputText.setValue(this.$.inputText.getValue() + ".org");
		this.$.inputText.forceFocus();
	},

	popupMessage: function(title, message, closeCallback) {
		if (closeCallback)
			this.popupMessageCallBack = closeCallback;
		this.$.popupTitle.setContent(title);
		this.$.popupMessage.setContent(message);
		this.$.messagePopup.openAtCenter();
	},
	closePopupMessage: function() {
		this.$.messagePopup.close();
	},
	getCookie: function(name, defaultValue) {
		if (localStorage.getItem(name) !== null)
		{
			return JSON.parse(localStorage.getItem(name));
		}
		else
		{
			return defaultValue;
		}
	},
	setCookie: function(name, value) {
		enyo.log("setting " + name + " to " + JSON.stringify(value));
		localStorage.setItem(name, JSON.stringify(value));
	},
});