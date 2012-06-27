chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	var ret = {};
	switch(request.cmd){
	case "SET_AREA":
		localStorage.setItem("area", request.value);
		break;
	case "GET_AREA":
		ret.value = localStorage.getItem("area");
		break;
	}
	sendResponse(ret);
});
