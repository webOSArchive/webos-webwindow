enyo.kind({
  name: "Helpers.Sharing",
  kind: "Control",
  create: function() {
      this.inherited(arguments);
      enyo.log("Sharing Helper created.");
  },
  NotYetImplemented: function(shareTarget) {
    enyo.warn("Share target not implemented!");
    enyo.windows.addBannerMessage("Share target not implemented...", "{}");
  },
  ShareWithTarget: function(shareTarget, shareSubject, shareMessage) {
    enyo.log("Share helper invoked for: ", shareTarget, shareSubject, shareMessage);
    switch(shareTarget) {
      case "clipboard":
          enyo.log("sharing url: " + shareMessage);
          enyo.dom.setClipboard(shareMessage);
          enyo.windows.addBannerMessage("URL copied to clipboard!", "{}");
          break;
      case "browser":
        this.$.launchRequest.call({ id: "com.palm.app.browser", params: { target: shareMessage } });
        break;
      case "email":
        this.$.launchRequest.call({ id: "com.palm.app.email", params: { summary: shareSubject, text: shareMessage } });
        break;
      case "messaging":
        this.$.launchRequest.call({ id: "com.palm.app.messaging", params: { messageText: shareSubject + " " + shareMessage } });
        break;
      case "simplechat":
        this.$.launchRequest.call({ id: "com.palm.app.jonandnic.simplechat", params: { newshare: shareSubject + " " + shareMessage } });
        break;
      case "sharespace":
        this.$.launchRequest.call({ id: "com.palm.webos.sharespace", params: { newshare: shareMessage } });
        break;
      default:
        this.NotYetImplemented(shareTarget);
    }
  },
  components: [{
    name: "launchRequest",
    kind: "PalmService",
    service: "palm://com.palm.applicationManager",
    method: "open"
  }]
});