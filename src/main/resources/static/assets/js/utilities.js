//convenience feature so we can all use window.location.origin when referring to server, makes migration between servers easier
if (!window.location.origin)
     window.location.origin = window.location.protocol+"//"+window.location.host;
	 
//convenience variable allowing for manual entry of critical alert messages should rss
//feeds be unavailable.  default value is 0, set to 1 to display manual alerts.  
//add manual alerts to alert.php inside existing tags.  Place alert title in appropriate tags
//and alert description in appropriate tags. 
manualAlert = 0;